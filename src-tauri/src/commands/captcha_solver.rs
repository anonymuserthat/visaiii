use super::secrets;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::{
    path::Path,
    sync::{
        atomic::{AtomicBool, Ordering},
        Mutex,
    },
    time::Duration,
};
use tauri::{AppHandle, Manager, State};

const CONFIG_FILE: &str = "2captcha.dat";
const API_KEY_ENV: &str = "TWOCAPTCHA_API_KEY";
const SITE_KEY: &str = "6LeLXeUqAAAAAIjM20HZNfzvTsFv5vSt8nusNq__";

#[derive(Default)]
pub struct CaptchaState {
    gate: Mutex<()>,
    solving: AtomicBool,
}

struct SolvingGuard<'a>(&'a AtomicBool);
impl Drop for SolvingGuard<'_> {
    fn drop(&mut self) {
        self.0.store(false, Ordering::SeqCst);
    }
}

#[derive(Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Configuration {
    enabled: bool,
    api_key: String,
    website_url: String,
    site_key: String,
    invisible: bool,
    enterprise: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CaptchaSettings {
    enabled: bool,
    configured: bool,
    website_url: String,
    site_key: String,
    invisible: bool,
    enterprise: bool,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveCaptchaSettings {
    enabled: bool,
    api_key: Option<String>,
    website_url: String,
    site_key: String,
    invisible: bool,
    enterprise: bool,
}

fn read_env_api_key(path: &Path) -> Option<String> {
    dotenvy::from_path_iter(path)
        .ok()?
        .flatten()
        .find_map(|(name, value)| {
            (name == API_KEY_ENV && !value.trim().is_empty()).then(|| value.trim().to_owned())
        })
}

fn effective_api_key(config: &Configuration) -> String {
    // The startup loader imports .env into the process environment. Keep
    // executable-adjacent lookup as a direct fallback for packaged builds.
    std::env::var(API_KEY_ENV)
        .ok()
        .map(|key| key.trim().to_owned())
        .filter(|key| !key.is_empty())
        .or_else(|| {
            let executable = std::env::current_exe().ok()?;
            read_env_api_key(&executable.parent()?.join(".env"))
        })
        .or_else(|| {
            let executable = std::env::current_exe().ok()?;
            read_env_api_key(&executable.parent()?.join("..").join(".env"))
        })
        .or_else(|| {
            let executable = std::env::current_exe().ok()?;
            read_env_api_key(&executable.parent()?.join("..").join("..").join(".env"))
        })
        .or_else(|| {
            let executable = std::env::current_exe().ok()?;
            read_env_api_key(
                &executable
                    .parent()?
                    .join("..")
                    .join("..")
                    .join("..")
                    .join(".env"),
            )
        })
        .or_else(|| (!config.api_key.is_empty()).then(|| config.api_key.clone()))
        .unwrap_or_default()
}

fn valid_api_key(key: &str) -> bool {
    key.len() == 32 && key.chars().all(|c| c.is_ascii_hexdigit())
}

fn resource_api_key(app: &AppHandle) -> Option<String> {
    let resource_dir = app.path().resource_dir().ok()?;
    read_env_api_key(&resource_dir.join(".env"))
        .or_else(|| read_env_api_key(&resource_dir.join("_up_").join(".env")))
        .filter(|key| valid_api_key(key))
}

fn settings(config: &Configuration) -> CaptchaSettings {
    let configured = valid_api_key(&effective_api_key(config));
    CaptchaSettings {
        // A valid deployment key always enables automatic solving. The stored
        // flag is retained only for backwards-compatible saved settings.
        enabled: configured || config.enabled,
        configured,
        website_url: config.website_url.clone(),
        site_key: config.site_key.clone(),
        invisible: config.invisible,
        enterprise: config.enterprise,
    }
}

fn load(app: &AppHandle) -> Result<Configuration, String> {
    Ok(
        secrets::load(app, CONFIG_FILE)?.unwrap_or_else(|| Configuration {
            website_url: "https://appointment-anb.capago.eu".into(),
            site_key: SITE_KEY.into(),
            ..Configuration::default()
        }),
    )
}

pub fn import_environment_key(app: &AppHandle) -> Result<(), String> {
    let environment_key = std::env::var(API_KEY_ENV)
        .ok()
        .map(|key| key.trim().to_owned())
        .filter(|key| valid_api_key(key))
        .or_else(|| {
            let executable = std::env::current_exe().ok()?;
            read_env_api_key(&executable.parent()?.join(".env")).filter(|key| valid_api_key(key))
        })
        .or_else(|| resource_api_key(app));
    let environment_key = environment_key.or_else(|| {
        let executable = std::env::current_exe().ok()?;
        read_env_api_key(
            &executable
                .parent()?
                .join("..")
                .join("..")
                .join("..")
                .join(".env"),
        )
        .filter(|key| valid_api_key(key))
    });

    let Some(api_key) = environment_key else {
        return Ok(());
    };

    let mut config = load(app)?;
    if config.api_key != api_key || !config.enabled {
        config.api_key = api_key;
        config.enabled = true;
        secrets::save(app, CONFIG_FILE, &config)?;
    }
    Ok(())
}

#[tauri::command]
pub fn get_captcha_settings(
    app: AppHandle,
    state: State<'_, CaptchaState>,
) -> Result<CaptchaSettings, String> {
    let _guard = state.gate.lock().map_err(|_| "Configuration occupee.")?;
    Ok(settings(&load(&app)?))
}

#[tauri::command]
pub fn save_captcha_settings(
    app: AppHandle,
    state: State<'_, CaptchaState>,
    payload: SaveCaptchaSettings,
) -> Result<CaptchaSettings, String> {
    let _guard = state.gate.lock().map_err(|_| "Configuration occupee.")?;
    let previous = load(&app)?;
    let api_key = payload
        .api_key
        .map(|key| key.trim().to_string())
        .filter(|key| !key.is_empty())
        .unwrap_or(previous.api_key);
    let url =
        reqwest::Url::parse(payload.website_url.trim()).map_err(|_| "URL du CAPTCHA invalide.")?;
    if url.scheme() != "https"
        || url.host_str().is_none()
        || !url.username().is_empty()
        || url.password().is_some()
    {
        return Err("Utilisez une URL HTTPS valide pour la page du CAPTCHA.".into());
    }
    if payload.site_key.trim().is_empty() {
        return Err("La cle publique du site est requise.".into());
    }
    let config = Configuration {
        enabled: payload.enabled,
        api_key,
        website_url: url.to_string(),
        site_key: payload.site_key.trim().into(),
        invisible: payload.invisible,
        enterprise: payload.enterprise,
    };
    if !valid_api_key(&effective_api_key(&config)) {
        return Err("Renseignez une cle API 2Captcha valide (32 caracteres) dans TWOCAPTCHA_API_KEY ou dans les parametres.".into());
    }
    // Keep an environment key out of saved settings so editing .env still works.
    secrets::save(&app, CONFIG_FILE, &config)?;
    Ok(settings(&config))
}

#[tauri::command]
pub fn clear_captcha_settings(
    app: AppHandle,
    state: State<'_, CaptchaState>,
) -> Result<CaptchaSettings, String> {
    let _guard = state.gate.lock().map_err(|_| "Configuration occupee.")?;
    secrets::remove(&app, CONFIG_FILE)?;
    Ok(settings(&load(&app)?))
}

fn check_response(response: &Value) -> Result<(), String> {
    if response.get("errorId").and_then(Value::as_u64) != Some(0) {
        let code = response
            .get("errorCode")
            .and_then(Value::as_str)
            .unwrap_or("INVALID_RESPONSE");
        let description = response
            .get("errorDescription")
            .and_then(Value::as_str)
            .unwrap_or("Reponse 2Captcha invalide.");
        return Err(format!("2Captcha : {code} — {description}"));
    }
    Ok(())
}

#[tauri::command]
pub async fn solve_captcha(
    app: AppHandle,
    state: State<'_, CaptchaState>,
) -> Result<String, String> {
    // Also prevents duplicate paid tasks when several submit events arrive.
    if state.solving.swap(true, Ordering::SeqCst) {
        return Err("Une verification 2Captcha est deja en cours.".into());
    }
    let _solving = SolvingGuard(&state.solving);
    let config = {
        let _guard = state.gate.lock().map_err(|_| "Configuration occupee.")?;
        load(&app)?
    };
    let api_key = effective_api_key(&config);
    if !valid_api_key(&api_key) {
        return Err("Activez et configurez 2Captcha avant la verification.".into());
    }
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(30))
        .build()
        .map_err(|_| "Client 2Captcha indisponible.")?;
    let task_type = if config.enterprise {
        "RecaptchaV2EnterpriseTaskProxyless"
    } else {
        "RecaptchaV2TaskProxyless"
    };
    let task = json!({ "type": task_type, "websiteURL": config.website_url, "websiteKey": config.site_key, "isInvisible": config.invisible });
    let created: Value = client
        .post("https://api.2captcha.com/createTask")
        .json(&json!({"clientKey": api_key, "task": task}))
        .send()
        .await
        .map_err(|_| "Connexion a 2Captcha impossible.")?
        .error_for_status()
        .map_err(|_| "Le service 2Captcha est indisponible.")?
        .json()
        .await
        .map_err(|_| "Reponse 2Captcha invalide.")?;
    check_response(&created)?;
    let task_id = created
        .get("taskId")
        .and_then(Value::as_u64)
        .filter(|id| *id > 0)
        .ok_or("2Captcha n'a pas retourne de numero de tache.")?;
    let polling = async {
        tokio::time::sleep(Duration::from_secs(10)).await;
        loop {
            let result: Value = client
                .post("https://api.2captcha.com/getTaskResult")
                .json(&json!({"clientKey": api_key, "taskId": task_id}))
                .send()
                .await
                .map_err(|_| "Impossible de recuperer le resultat 2Captcha. Reessayez plus tard.")?
                .error_for_status()
                .map_err(|_| "Le service 2Captcha est indisponible.")?
                .json()
                .await
                .map_err(|_| "Reponse 2Captcha invalide.")?;
            check_response(&result)?;
            match result.get("status").and_then(Value::as_str) {
                Some("ready") => {
                    return result
                        .pointer("/solution/gRecaptchaResponse")
                        .and_then(Value::as_str)
                        .filter(|token| !token.trim().is_empty())
                        .map(str::to_owned)
                        .ok_or("2Captcha a retourne un jeton vide.".into())
                }
                Some("processing") => tokio::time::sleep(Duration::from_secs(5)).await,
                _ => return Err("Etat de tache 2Captcha inconnu.".into()),
            }
        }
    };
    tokio::time::timeout(Duration::from_secs(180), polling)
        .await
        .map_err(|_| {
            format!("Delai 2Captcha depasse (tache {task_id}). Aucune demande n'a ete soumise.")
        })?
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn reads_only_the_backend_key_from_a_runtime_env_file() {
        let path =
            std::env::temp_dir().join(format!("damander-2captcha-{}.env", rand::random::<u64>()));
        let key = "0123456789abcdef0123456789abcdef";
        std::fs::write(
            &path,
            format!("VITE_TEST=unrelated\nTWOCAPTCHA_API_KEY=\"  {key}  \"\n"),
        )
        .unwrap();
        let loaded = read_env_api_key(&path);
        std::fs::write(&path, "TWOCAPTCHA_API_KEY=\n").unwrap();
        let empty = read_env_api_key(&path);
        std::fs::remove_file(&path).unwrap();
        assert_eq!(loaded.as_deref(), Some(key));
        assert!(valid_api_key(loaded.as_deref().unwrap()));
        assert!(empty.is_none());
    }

    #[test]
    fn rejects_paid_service_errors_and_malformed_responses() {
        assert!(check_response(&json!({"errorId": 0})).is_ok());
        assert!(
            check_response(&json!({"errorId": 10, "errorCode": "ERROR_ZERO_BALANCE"}))
                .unwrap_err()
                .contains("ERROR_ZERO_BALANCE")
        );
        assert!(check_response(&json!({})).is_err());
    }
}
