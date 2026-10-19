use std::path::PathBuf;

use reqwest::Url;
use serde::{Deserialize, Serialize};
use tauri::{utils::config::WebviewUrl, AppHandle, Emitter, Manager, WebviewWindowBuilder};

const RECAPTCHA_WINDOW_LABEL: &str = "recaptcha_verification";
const RECAPTCHA_CALLBACK_SCHEME: &str = "damander-recaptcha";
const RECAPTCHA_TOKEN_EVENT: &str = "recaptcha:token";
const RECAPTCHA_FALLBACK_SITE_KEY: &str = "6LeLXeUqAAAAAIjM20HZNfzvTsFv5vSt8nusNq__";

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OpenRecaptchaWindowPayload {
    pub base_url: String,
    pub locale: Option<String>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct RecaptchaTokenEventPayload {
    token: String,
}

fn build_recaptcha_init_script(locale: &str) -> String {
    let locale = serde_json::to_string(locale).expect("locale JSON serialization failed");
    let callback_scheme =
        serde_json::to_string(RECAPTCHA_CALLBACK_SCHEME).expect("scheme JSON serialization failed");
    let site_key = serde_json::to_string(RECAPTCHA_FALLBACK_SITE_KEY)
        .expect("site key JSON serialization failed");

    format!(
        r##"
(() => {{
  if (window.top !== window.self) {{
    return;
  }}

  if (window.__damanderRecaptchaBridgeInstalled) {{
    return;
  }}

  window.__damanderRecaptchaBridgeInstalled = true;

  const locale = {locale};
  const callbackScheme = {callback_scheme};
  const siteKey = {site_key};
  let tokenForwarded = false;
  let apiRequested = false;
  let widgetRendered = false;

  const buildCallbackUrl = (token) => {{
    const params = new URLSearchParams({{ token }});
    return `${{callbackScheme}}://token?${{params.toString()}}`;
  }};

  const updateStatus = (message, tone = "neutral") => {{
    const statusNode = document.querySelector("[data-damander-status]");
    if (!statusNode) {{
      return;
    }}

    statusNode.textContent = message;
    statusNode.dataset.tone = tone;
  }};

  const forwardToken = (token) => {{
    const normalized = typeof token === "string" ? token.trim() : "";
    if (!normalized || tokenForwarded) {{
      return;
    }}

    tokenForwarded = true;
    updateStatus("Jeton detecte. Retour automatique vers l'app...", "success");
    window.setTimeout(() => {{
      window.location.replace(buildCallbackUrl(normalized));
    }}, 120);
  }};

  const ensureShell = () => {{
    if (document.querySelector("[data-damander-shell]")) {{
      return;
    }}

    document.title = "Verification reCAPTCHA";
    document.documentElement.lang = locale || "fr";
    document.documentElement.style.background = "#fffaf5";

    let styleTag = document.getElementById("damander-recaptcha-style");
    if (!styleTag) {{
      styleTag = document.createElement("style");
      styleTag.id = "damander-recaptcha-style";
      document.head.appendChild(styleTag);
    }}

    styleTag.textContent = `
      :root {{
        color-scheme: light;
        font-family: "Segoe UI", Arial, sans-serif;
        background: #fffaf5;
        color: #1f2937;
      }}

      * {{
        box-sizing: border-box;
      }}

      html,
      body {{
        margin: 0;
        min-height: 100%;
        width: 100%;
        overflow: hidden;
        background:
          radial-gradient(circle at top, rgba(251, 146, 60, 0.12), transparent 36%),
          linear-gradient(180deg, #fffdf9 0%, #fff7ed 100%);
      }}

      body {{
        min-height: 100vh;
        display: grid;
        place-items: center;
      }}

      [data-damander-shell] {{
        width: min(440px, calc(100vw - 32px));
        border-radius: 28px;
        border: 1px solid rgba(251, 146, 60, 0.22);
        background: rgba(255, 255, 255, 0.96);
        box-shadow: 0 24px 60px rgba(15, 23, 42, 0.12);
        padding: 28px 24px 24px;
      }}

      [data-damander-title] {{
        margin: 0 0 8px;
        font-size: 28px;
        line-height: 1.1;
      }}

      [data-damander-copy] {{
        margin: 0;
        font-size: 15px;
        line-height: 1.6;
        color: #5b6472;
      }}

      [data-damander-widget] {{
        margin-top: 22px;
        min-height: 82px;
        display: flex;
        align-items: center;
        justify-content: center;
      }}

      [data-damander-status] {{
        margin: 16px 0 0;
        min-height: 22px;
        text-align: center;
        font-size: 13px;
        color: #64748b;
      }}

      [data-damander-status][data-tone="error"] {{
        color: #dc2626;
      }}

      [data-damander-status][data-tone="success"] {{
        color: #047857;
      }}
    `;

    document.body.className = "";
    document.body.removeAttribute("style");
    document.body.innerHTML = `
      <main data-damander-shell>
        <h1 data-damander-title>Verification reCAPTCHA</h1>
        <p data-damander-copy>Validez le test. La fenetre se fermera automatiquement ensuite.</p>
        <div data-damander-widget>
          <div id="damander-recaptcha-widget"></div>
        </div>
        <p data-damander-status data-tone="neutral">Chargement du widget officiel...</p>
      </main>
    `;
  }};

  const renderWidget = () => {{
    if (!window.grecaptcha?.render) {{
      return;
    }}

    const container = document.getElementById("damander-recaptcha-widget");
    if (!container) {{
      return;
    }}

    if (widgetRendered && container.childElementCount > 0) {{
      return;
    }}

    widgetRendered = true;

    try {{
      window.grecaptcha.render(container, {{
        sitekey: siteKey,
        callback: forwardToken,
        "expired-callback": () => {{
          tokenForwarded = false;
          updateStatus(
            "Le test a expire. Revalidez le reCAPTCHA pour renvoyer un nouveau jeton.",
            "error"
          );
        }},
        "error-callback": () => {{
          tokenForwarded = false;
          widgetRendered = false;
          updateStatus(
            "Le widget reCAPTCHA ne repond pas correctement. Rechargez cette fenetre.",
            "error"
          );
        }}
      }});
      updateStatus("Validez le test. La fenetre se fermera automatiquement.");
    }} catch (error) {{
      widgetRendered = false;
      updateStatus(
        `Le rendu du widget a echoue: ${{error instanceof Error ? error.message : String(error)}}`,
        "error"
      );
    }}
  }};

  const ensureApiScript = () => {{
    if (window.grecaptcha?.render) {{
      renderWidget();
      return;
    }}

    if (apiRequested) {{
      return;
    }}

    apiRequested = true;

    const script = document.createElement("script");
    script.src =
      `https://www.google.com/recaptcha/api.js?render=explicit&hl=${{encodeURIComponent(locale || "fr")}}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {{
      renderWidget();
    }};
    script.onerror = () => {{
      apiRequested = false;
      updateStatus("Impossible de charger le script Google reCAPTCHA.", "error");
    }};

    document.head.appendChild(script);
  }};

  const keepShellAlive = () => {{
    const keepAliveHandle = window.setInterval(() => {{
      if (tokenForwarded) {{
        window.clearInterval(keepAliveHandle);
        return;
      }}

      const container = document.getElementById("damander-recaptcha-widget");
      const shellMissing = !document.querySelector("[data-damander-shell]");
      const widgetMissing = !container || container.childElementCount === 0;

      if (shellMissing) {{
        widgetRendered = false;
        ensureShell();
      }}

      if (widgetMissing) {{
        widgetRendered = false;
        renderWidget();
      }}
    }}, 1000);
  }};

  const bootstrap = () => {{
    if (!document.head || !document.body) {{
      window.requestAnimationFrame(bootstrap);
      return;
    }}

    try {{
      window.stop();
    }} catch (_error) {{
      // Ignore browsers that do not support window.stop().
    }}

    ensureShell();
    ensureApiScript();
    window.setTimeout(renderWidget, 250);
    keepShellAlive();
  }};

  bootstrap();
}})();
"##
    )
}

fn recaptcha_data_directory(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("App data dir unavailable: {error}"))?;

    Ok(app_data_dir.join("recaptcha-webview"))
}

fn create_recaptcha_window(
    app: &AppHandle,
    payload: &OpenRecaptchaWindowPayload,
) -> Result<(), String> {
    let base_url = Url::parse(&payload.base_url).map_err(|error| error.to_string())?;
    let locale = payload
        .locale
        .as_deref()
        .filter(|value| !value.trim().is_empty())
        .unwrap_or("fr");

    if let Some(existing_window) = app.get_webview_window(RECAPTCHA_WINDOW_LABEL) {
        let _ = existing_window.close();
    }

    let app_handle = app.clone();
    let window_label = RECAPTCHA_WINDOW_LABEL.to_string();
    let data_directory = recaptcha_data_directory(app)?;

    let builder =
        WebviewWindowBuilder::new(app, RECAPTCHA_WINDOW_LABEL, WebviewUrl::External(base_url))
            .title("Verification reCAPTCHA")
            .inner_size(560.0, 760.0)
            .min_inner_size(460.0, 620.0)
            .resizable(true)
            .center()
            .focused(true)
            .data_directory(data_directory)
            .initialization_script(build_recaptcha_init_script(locale))
            .on_navigation(move |url| {
                if url.scheme() != RECAPTCHA_CALLBACK_SCHEME {
                    return true;
                }

                let token = url
                    .query_pairs()
                    .find_map(|(key, value)| (key == "token").then_some(value.into_owned()))
                    .unwrap_or_default();

                if !token.trim().is_empty() {
                    let _ = app_handle
                        .emit(RECAPTCHA_TOKEN_EVENT, RecaptchaTokenEventPayload { token });
                }

                if let Some(window) = app_handle.get_webview_window(&window_label) {
                    let _ = window.close();
                }

                false
            });

    builder.build().map_err(|error| error.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn open_recaptcha_window(
    app: AppHandle,
    payload: OpenRecaptchaWindowPayload,
) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || create_recaptcha_window(&app, &payload))
        .await
        .map_err(|error| error.to_string())?
}
