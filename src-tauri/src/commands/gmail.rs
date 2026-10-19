use super::secrets;
use base64::{
    engine::general_purpose::{URL_SAFE, URL_SAFE_NO_PAD},
    Engine,
};
use rand::RngCore;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sha2::{Digest, Sha256};
use std::{
    io::{Read, Write},
    net::TcpListener,
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc, Mutex,
    },
    time::{Duration, Instant},
};
use tauri::{AppHandle, State};

const CONFIG_FILE: &str = "gmail.dat";
const API: &str = "https://gmail.googleapis.com/gmail/v1/users/me";
const SCOPE: &str = "https://www.googleapis.com/auth/gmail.readonly";

#[derive(Default)]
pub struct GmailState {
    gate: tokio::sync::Mutex<()>,
    pending: Mutex<Option<OAuthAttempt>>,
    cancellation: Mutex<Option<Arc<AtomicBool>>>,
}

#[derive(Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Configuration {
    client_id: String,
    client_secret: String,
    #[serde(default)]
    refresh_token: String,
    #[serde(default)]
    access_token: String,
    #[serde(default)]
    expires_at: i64,
    #[serde(default)]
    email: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GmailStatus {
    configured: bool,
    connected: bool,
    client_id: String,
    email: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GmailAppPayload {
    client_id: String,
    client_secret: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Authorization {
    url: String,
}

struct OAuthAttempt {
    listener: TcpListener,
    state: String,
    verifier: String,
    redirect_uri: String,
    client_id: String,
    client_secret: String,
    cancellation: Arc<AtomicBool>,
    started: Instant,
}

fn load(app: &AppHandle) -> Result<Configuration, String> {
    Ok(secrets::load(app, CONFIG_FILE)?.unwrap_or_default())
}
fn status(config: &Configuration) -> GmailStatus {
    GmailStatus {
        configured: !config.client_id.is_empty() && !config.client_secret.is_empty(),
        connected: !config.refresh_token.is_empty() && !config.email.is_empty(),
        client_id: config.client_id.clone(),
        email: if config.email.is_empty() {
            None
        } else {
            Some(config.email.clone())
        },
    }
}
fn client() -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .timeout(Duration::from_secs(30))
        .build()
        .map_err(|_| "Client Google indisponible.".into())
}

async fn json_response(mut response: reqwest::Response) -> Result<Value, String> {
    let status = response.status();
    let mut body = Vec::new();
    while let Some(chunk) = response
        .chunk()
        .await
        .map_err(|_| "Lecture de la reponse Google impossible.")?
    {
        if body.len() + chunk.len() > 2 * 1024 * 1024 {
            return Err("Ce message est trop volumineux. Ouvrez-le dans Gmail.".into());
        }
        body.extend_from_slice(&chunk);
    }
    let value: Value = serde_json::from_slice(&body).map_err(|_| "Reponse Google invalide.")?;
    if !status.is_success() {
        let message = value
            .pointer("/error/message")
            .and_then(Value::as_str)
            .or_else(|| value.get("error_description").and_then(Value::as_str))
            .or_else(|| value.get("error").and_then(Value::as_str))
            .unwrap_or("Verifiez la configuration et reconnectez Gmail.");
        return Err(format!("Google ({}) : {}", status.as_u16(), message));
    }
    Ok(value)
}

#[tauri::command]
pub async fn get_gmail_status(
    app: AppHandle,
    state: State<'_, GmailState>,
) -> Result<GmailStatus, String> {
    let _guard = state.gate.lock().await;
    Ok(status(&load(&app)?))
}

fn cancel(state: &GmailState) {
    if let Ok(mut pending) = state.pending.lock() {
        if let Some(attempt) = pending.take() {
            attempt.cancellation.store(true, Ordering::SeqCst);
        }
    }
    if let Ok(mut cancellation) = state.cancellation.lock() {
        if let Some(flag) = cancellation.take() {
            flag.store(true, Ordering::SeqCst);
        }
    }
}

#[tauri::command]
pub async fn configure_gmail_app(
    app: AppHandle,
    state: State<'_, GmailState>,
    payload: GmailAppPayload,
) -> Result<GmailStatus, String> {
    let _guard = state.gate.lock().await;
    let client_id = payload.client_id.trim().to_string();
    if !client_id.ends_with(".apps.googleusercontent.com")
        || client_id.len() > 256
        || client_id.chars().any(char::is_whitespace)
    {
        return Err(
            "Utilisez l'identifiant OAuth d'une application Google de type Bureau (Desktop app)."
                .into(),
        );
    }
    let previous = load(&app)?;
    let client_secret = payload
        .client_secret
        .map(|secret| secret.trim().to_string())
        .filter(|secret| !secret.is_empty())
        .or_else(|| {
            if client_id == previous.client_id {
                Some(previous.client_secret.clone())
            } else {
                None
            }
        })
        .filter(|secret| !secret.is_empty() && secret.len() < 512)
        .ok_or("Le secret client Google est requis.")?;
    cancel(&state);
    let config = if client_id == previous.client_id && client_secret == previous.client_secret {
        previous
    } else {
        Configuration {
            client_id,
            client_secret,
            ..Configuration::default()
        }
    };
    secrets::save(&app, CONFIG_FILE, &config)?;
    Ok(status(&config))
}

fn random_token() -> String {
    let mut bytes = [0u8; 32];
    rand::rngs::OsRng.fill_bytes(&mut bytes);
    URL_SAFE_NO_PAD.encode(bytes)
}

#[tauri::command]
pub async fn start_gmail_authorization(
    app: AppHandle,
    state: State<'_, GmailState>,
) -> Result<Authorization, String> {
    let _guard = state.gate.lock().await;
    let config = load(&app)?;
    if !status(&config).configured {
        return Err("Configurez d'abord votre application OAuth Google.".into());
    }
    cancel(&state);
    let listener = TcpListener::bind(("127.0.0.1", 0))
        .map_err(|_| "Impossible d'ouvrir le retour de connexion Google local.")?;
    listener
        .set_nonblocking(true)
        .map_err(|_| "Connexion Google locale indisponible.")?;
    let redirect_uri = format!(
        "http://127.0.0.1:{}/oauth2callback",
        listener
            .local_addr()
            .map_err(|_| "Port local indisponible.")?
            .port()
    );
    let verifier = random_token();
    let oauth_state = random_token();
    let challenge = URL_SAFE_NO_PAD.encode(Sha256::digest(verifier.as_bytes()));
    let mut url = reqwest::Url::parse("https://accounts.google.com/o/oauth2/v2/auth").unwrap();
    url.query_pairs_mut().extend_pairs([
        ("client_id", config.client_id.as_str()),
        ("redirect_uri", redirect_uri.as_str()),
        ("response_type", "code"),
        ("scope", SCOPE),
        ("access_type", "offline"),
        ("prompt", "consent select_account"),
        ("state", oauth_state.as_str()),
        ("code_challenge", challenge.as_str()),
        ("code_challenge_method", "S256"),
    ]);
    let cancellation = Arc::new(AtomicBool::new(false));
    *state
        .cancellation
        .lock()
        .map_err(|_| "Connexion occupee.")? = Some(cancellation.clone());
    *state.pending.lock().map_err(|_| "Connexion occupee.")? = Some(OAuthAttempt {
        listener,
        state: oauth_state,
        verifier,
        redirect_uri,
        client_id: config.client_id,
        client_secret: config.client_secret,
        cancellation,
        started: Instant::now(),
    });
    Ok(Authorization { url: url.into() })
}

// The loopback redirect accepts only this attempt's random state and callback path.
fn callback_code(target: &str, expected_state: &str) -> Result<Option<String>, String> {
    if !target.starts_with('/') || target.starts_with("//") {
        return Ok(None);
    }
    let url = reqwest::Url::parse(&format!("http://127.0.0.1{target}"))
        .map_err(|_| "Retour OAuth invalide.")?;
    if url.path() != "/oauth2callback" {
        return Ok(None);
    }
    let pairs: std::collections::HashMap<_, _> = url.query_pairs().into_owned().collect();
    if pairs.get("state").map(String::as_str) != Some(expected_state) {
        return Ok(None);
    }
    if pairs.contains_key("error") {
        return Err("La connexion Google a ete refusee ou annulee.".into());
    }
    Ok(pairs.get("code").filter(|code| !code.is_empty()).cloned())
}

fn await_callback(attempt: OAuthAttempt) -> Result<(OAuthAttempt, String), String> {
    loop {
        if attempt.cancellation.load(Ordering::SeqCst) {
            return Err("Connexion Google annulee.".into());
        }
        if attempt.started.elapsed() > Duration::from_secs(180) {
            return Err("Delai de connexion Google depasse. Recommencez la connexion.".into());
        }
        match attempt.listener.accept() {
            Ok((mut stream, _)) => {
                let _ = stream.set_read_timeout(Some(Duration::from_secs(2)));
                let _ = stream.set_write_timeout(Some(Duration::from_secs(2)));
                let mut request = Vec::new();
                let mut buffer = [0u8; 1024];
                while request.len() < 8192 && !request.windows(4).any(|part| part == b"\r\n\r\n") {
                    match stream.read(&mut buffer) {
                        Ok(0) | Err(_) => break,
                        Ok(count) => request.extend_from_slice(&buffer[..count]),
                    }
                }
                let text = String::from_utf8_lossy(&request);
                let line = text.lines().next().unwrap_or("");
                let mut words = line.split_whitespace();
                let result = if words.next() == Some("GET") {
                    callback_code(words.next().unwrap_or(""), &attempt.state)
                } else {
                    Ok(None)
                };
                let accepted = matches!(result, Ok(Some(_)) | Err(_));
                let body = if accepted {
                    "Vous pouvez fermer cet onglet et revenir dans Damander Visa."
                } else {
                    "Retour OAuth invalide."
                };
                let code = if accepted {
                    "200 OK"
                } else {
                    "400 Bad Request"
                };
                let _ = write!(stream, "HTTP/1.1 {code}\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Length: {}\r\nCache-Control: no-store\r\nConnection: close\r\n\r\n{body}", body.len());
                match result {
                    Ok(Some(code)) => return Ok((attempt, code)),
                    Err(error) => return Err(error),
                    Ok(None) => {}
                }
            }
            Err(error) if error.kind() == std::io::ErrorKind::WouldBlock => {
                std::thread::sleep(Duration::from_millis(100))
            }
            Err(_) => return Err("Le retour de connexion Google a echoue.".into()),
        }
    }
}

#[tauri::command]
pub async fn finish_gmail_authorization(
    app: AppHandle,
    state: State<'_, GmailState>,
) -> Result<GmailStatus, String> {
    let attempt = state
        .pending
        .lock()
        .map_err(|_| "Connexion occupee.")?
        .take()
        .ok_or("Aucune connexion Google en cours.")?;
    let (attempt, code) = tauri::async_runtime::spawn_blocking(move || await_callback(attempt))
        .await
        .map_err(|_| "Connexion Google interrompue.")??;
    let _guard = state.gate.lock().await;
    if attempt.cancellation.load(Ordering::SeqCst) {
        return Err("Connexion Google annulee.".into());
    }
    let mut config = load(&app)?;
    if config.client_id != attempt.client_id || config.client_secret != attempt.client_secret {
        return Err("La configuration Google a change. Reconnectez-vous.".into());
    }
    let http = client()?;
    let tokens = json_response(
        http.post("https://oauth2.googleapis.com/token")
            .form(&[
                ("client_id", attempt.client_id.as_str()),
                ("client_secret", attempt.client_secret.as_str()),
                ("code", code.as_str()),
                ("code_verifier", attempt.verifier.as_str()),
                ("redirect_uri", attempt.redirect_uri.as_str()),
                ("grant_type", "authorization_code"),
            ])
            .send()
            .await
            .map_err(|_| "Impossible de finaliser la connexion Google.")?,
    )
    .await?;
    config.access_token = tokens
        .get("access_token")
        .and_then(Value::as_str)
        .filter(|v| !v.is_empty())
        .ok_or("Google n'a pas retourne de jeton d'acces.")?
        .into();
    config.refresh_token = tokens
        .get("refresh_token")
        .and_then(Value::as_str)
        .filter(|v| !v.is_empty())
        .ok_or(
            "Google n'a pas retourne de jeton permanent. Reconnectez-vous en acceptant l'acces.",
        )?
        .into();
    config.expires_at = chrono::Utc::now().timestamp()
        + tokens
            .get("expires_in")
            .and_then(Value::as_i64)
            .unwrap_or(3600);
    let profile = json_response(
        http.get(format!("{API}/profile"))
            .bearer_auth(&config.access_token)
            .send()
            .await
            .map_err(|_| "Impossible de lire le compte Gmail.")?,
    )
    .await?;
    config.email = profile
        .get("emailAddress")
        .and_then(Value::as_str)
        .ok_or("Adresse Gmail indisponible.")?
        .into();
    if attempt.cancellation.load(Ordering::SeqCst) {
        return Err("Connexion Google annulee.".into());
    }
    secrets::save(&app, CONFIG_FILE, &config)?;
    Ok(status(&config))
}

#[tauri::command]
pub fn cancel_gmail_authorization(state: State<'_, GmailState>) {
    cancel(&state);
}

#[tauri::command]
pub async fn disconnect_gmail(
    app: AppHandle,
    state: State<'_, GmailState>,
    forget_app: bool,
) -> Result<GmailStatus, String> {
    cancel(&state);
    let _guard = state.gate.lock().await;
    let previous = load(&app)?;
    // Removing the local token is deterministic, including when offline.
    if forget_app {
        secrets::remove(&app, CONFIG_FILE)?;
    } else {
        secrets::save(
            &app,
            CONFIG_FILE,
            &Configuration {
                client_id: previous.client_id,
                client_secret: previous.client_secret,
                ..Configuration::default()
            },
        )?;
    }
    Ok(status(&load(&app)?))
}

async fn access_token(
    app: &AppHandle,
    state: &GmailState,
    http: &reqwest::Client,
) -> Result<String, String> {
    let _guard = state.gate.lock().await;
    let mut config = load(app)?;
    if config.refresh_token.is_empty() {
        return Err("Connectez votre compte Gmail.".into());
    }
    if config.access_token.is_empty() || config.expires_at <= chrono::Utc::now().timestamp() + 60 {
        let response = http
            .post("https://oauth2.googleapis.com/token")
            .form(&[
                ("client_id", config.client_id.as_str()),
                ("client_secret", config.client_secret.as_str()),
                ("refresh_token", config.refresh_token.as_str()),
                ("grant_type", "refresh_token"),
            ])
            .send()
            .await
            .map_err(|_| "Impossible de renouveler la connexion Gmail.")?;
        let tokens = match json_response(response).await {
            Ok(tokens) => tokens,
            Err(error) => {
                if error.contains("invalid_grant") || error.contains("expired or revoked") {
                    config.refresh_token.clear();
                    config.access_token.clear();
                    config.email.clear();
                    secrets::save(app, CONFIG_FILE, &config)?;
                }
                return Err(error);
            }
        };
        config.access_token = tokens
            .get("access_token")
            .and_then(Value::as_str)
            .filter(|v| !v.is_empty())
            .ok_or("Jeton Gmail invalide. Reconnectez-vous.")?
            .into();
        config.expires_at = chrono::Utc::now().timestamp()
            + tokens
                .get("expires_in")
                .and_then(Value::as_i64)
                .unwrap_or(3600);
        secrets::save(app, CONFIG_FILE, &config)?;
    }
    Ok(config.access_token)
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MessageSummary {
    id: String,
    subject: String,
    from: String,
    to: String,
    date: String,
    snippet: String,
    unread: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InboxPage {
    messages: Vec<MessageSummary>,
    next_page_token: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MessageDetail {
    #[serde(flatten)]
    summary: MessageSummary,
    text_body: String,
    html_body: String,
}

fn header(value: &Value, name: &str) -> String {
    value
        .pointer("/payload/headers")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .find(|header| {
            header
                .get("name")
                .and_then(Value::as_str)
                .map(|s| s.eq_ignore_ascii_case(name))
                .unwrap_or(false)
        })
        .and_then(|header| header.get("value"))
        .and_then(Value::as_str)
        .unwrap_or("")
        .to_string()
}
fn summary(value: &Value) -> Result<MessageSummary, String> {
    Ok(MessageSummary {
        id: value
            .get("id")
            .and_then(Value::as_str)
            .ok_or("Message Gmail invalide.")?
            .into(),
        subject: header(value, "Subject"),
        from: header(value, "From"),
        to: header(value, "To"),
        date: header(value, "Date"),
        snippet: value
            .get("snippet")
            .and_then(Value::as_str)
            .unwrap_or("")
            .into(),
        unread: value
            .get("labelIds")
            .and_then(Value::as_array)
            .map(|labels| labels.iter().any(|label| label.as_str() == Some("UNREAD")))
            .unwrap_or(false),
    })
}

#[tauri::command]
pub async fn list_gmail_messages(
    app: AppHandle,
    state: State<'_, GmailState>,
    page_token: Option<String>,
    query: Option<String>,
) -> Result<InboxPage, String> {
    let page_token = page_token.unwrap_or_default();
    let query = query.unwrap_or_default();
    if page_token.len() > 2048 || query.len() > 500 {
        return Err("Recherche Gmail trop longue.".into());
    }
    let http = client()?;
    let token = access_token(&app, &state, &http).await?;
    let mut params = vec![
        ("maxResults", "20"),
        ("labelIds", "INBOX"),
        ("fields", "messages(id),nextPageToken"),
    ];
    if !page_token.is_empty() {
        params.push(("pageToken", &page_token));
    }
    if !query.trim().is_empty() {
        params.push(("q", query.trim()));
    }
    let list = json_response(
        http.get(format!("{API}/messages"))
            .bearer_auth(&token)
            .query(&params)
            .send()
            .await
            .map_err(|_| "Impossible de charger la boite Gmail.")?,
    )
    .await?;
    let mut messages = Vec::new();
    for message in list
        .get("messages")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .take(20)
    {
        let id = message
            .get("id")
            .and_then(Value::as_str)
            .ok_or("Message Gmail invalide.")?;
        validate_id(id)?;
        let value = json_response(
            http.get(format!("{API}/messages/{id}"))
                .bearer_auth(&token)
                .query(&[
                    ("format", "metadata"),
                    ("metadataHeaders", "Subject"),
                    ("metadataHeaders", "From"),
                    ("metadataHeaders", "To"),
                    ("metadataHeaders", "Date"),
                    ("fields", "id,snippet,labelIds,payload(headers)"),
                ])
                .send()
                .await
                .map_err(|_| "Impossible de charger un message Gmail.")?,
        )
        .await?;
        messages.push(summary(&value)?);
    }
    Ok(InboxPage {
        messages,
        next_page_token: list
            .get("nextPageToken")
            .and_then(Value::as_str)
            .map(str::to_owned),
    })
}

fn validate_id(id: &str) -> Result<(), String> {
    if id.is_empty() || id.len() > 128 || !id.chars().all(|c| c.is_ascii_hexdigit()) {
        return Err("Identifiant Gmail invalide.".into());
    }
    Ok(())
}

fn collect_bodies(
    part: &Value,
    text: &mut Vec<String>,
    html: &mut Vec<String>,
    depth: usize,
) -> Result<(), String> {
    if depth > 20 {
        return Ok(());
    }
    // Attachments are not fetched or displayed as message content.
    if part
        .get("filename")
        .and_then(Value::as_str)
        .map(|name| !name.is_empty())
        .unwrap_or(false)
    {
        return Ok(());
    }
    let mime = part.get("mimeType").and_then(Value::as_str).unwrap_or("");
    if matches!(mime, "text/plain" | "text/html") {
        if let Some(data) = part.pointer("/body/data").and_then(Value::as_str) {
            let bytes = URL_SAFE_NO_PAD
                .decode(data.trim_end_matches('='))
                .or_else(|_| URL_SAFE.decode(data))
                .map_err(|_| "Contenu Gmail invalide.")?;
            let body = String::from_utf8_lossy(&bytes).into_owned();
            if mime == "text/plain" {
                text.push(body);
            } else {
                html.push(body);
            }
        }
    }
    for child in part
        .get("parts")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
    {
        collect_bodies(child, text, html, depth + 1)?;
    }
    Ok(())
}

#[tauri::command]
pub async fn get_gmail_message(
    app: AppHandle,
    state: State<'_, GmailState>,
    id: String,
) -> Result<MessageDetail, String> {
    validate_id(&id)?;
    let http = client()?;
    let token = access_token(&app, &state, &http).await?;
    let value = json_response(
        http.get(format!("{API}/messages/{id}"))
            .bearer_auth(&token)
            .query(&[
                ("format", "full"),
                ("fields", "id,snippet,labelIds,payload"),
            ])
            .send()
            .await
            .map_err(|_| "Impossible de lire ce message Gmail.")?,
    )
    .await?;
    let mut text = Vec::new();
    let mut html = Vec::new();
    if let Some(payload) = value.get("payload") {
        collect_bodies(payload, &mut text, &mut html, 0)?;
    }
    Ok(MessageDetail {
        summary: summary(&value)?,
        text_body: text.join("\n\n"),
        html_body: html.join("\n\n"),
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    #[test]
    fn oauth_callback_requires_matching_state_and_path() {
        assert_eq!(
            callback_code("/oauth2callback?state=expected&code=abc", "expected").unwrap(),
            Some("abc".into())
        );
        assert_eq!(
            callback_code("/oauth2callback?state=wrong&code=abc", "expected").unwrap(),
            None
        );
        assert_eq!(
            callback_code("/favicon.ico?state=expected&code=abc", "expected").unwrap(),
            None
        );
        assert_eq!(
            callback_code("//evil/oauth2callback?state=expected&code=abc", "expected").unwrap(),
            None
        );
        assert!(callback_code(
            "/oauth2callback?state=expected&error=access_denied",
            "expected"
        )
        .is_err());
    }
    #[test]
    fn reads_nested_mime_without_attachments_and_handles_base64url() {
        let message = json!({"mimeType":"multipart/alternative", "parts":[
            {"mimeType":"text/plain", "body":{"data": URL_SAFE_NO_PAD.encode("Bonjour")}},
            {"mimeType":"text/html", "body":{"data": URL_SAFE.encode("<p>Bonjour</p>")}},
            {"mimeType":"text/plain", "filename":"secret.txt", "body":{"data": URL_SAFE_NO_PAD.encode("attachment")}}
        ]});
        let mut text = Vec::new();
        let mut html = Vec::new();
        collect_bodies(&message, &mut text, &mut html, 0).unwrap();
        assert_eq!(text, vec!["Bonjour"]);
        assert_eq!(html, vec!["<p>Bonjour</p>"]);
        assert!(validate_id("../../profile").is_err());
    }
}
