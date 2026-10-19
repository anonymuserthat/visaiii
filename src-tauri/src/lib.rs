mod commands;

use reqwest::Client;
use std::{env, path::PathBuf};
use tauri::Manager;

pub struct AppState {
    pub http_client: Client,
}

fn build_http_client() -> Result<Client, reqwest::Error> {
    Client::builder()
        .cookie_store(true)
        .user_agent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 \
       (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36",
        )
        .build()
}

fn load_runtime_environment(resource_dir: Option<PathBuf>) {
    let mut candidates = Vec::<PathBuf>::new();

    if let Some(directory) = resource_dir {
      candidates.push(directory.join(".env"));
      candidates.push(directory.join("_up_").join(".env"));
    }

    if let Ok(executable) = env::current_exe() {
        if let Some(directory) = executable.parent() {
            candidates.push(directory.join(".env"));
            candidates.push(directory.join("..").join(".env"));
            candidates.push(directory.join("..").join("..").join(".env"));
            candidates.push(directory.join("..").join("..").join("..").join(".env"));
        }
    }

    if let Ok(directory) = env::current_dir() {
        candidates.push(directory.join(".env"));
    }

    for path in candidates {
        if dotenvy::from_path_override(&path).is_ok() {
            break;
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(commands::captcha_solver::CaptchaState::default())
        .manage(commands::gmail::GmailState::default())
        .manage(AppState {
            http_client: build_http_client().expect("http client initialization failed"),
        })
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let resource_dir = app.path().resource_dir().ok();
            load_runtime_environment(resource_dir);

            if let Err(error) = commands::captcha_solver::import_environment_key(&app.handle()) {
                log::warn!("Unable to import the 2Captcha environment key: {error}");
            }

            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            if let Err(error) = app.path().app_data_dir() {
                log::warn!("Unable to resolve app data dir: {error}");
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::booking::fetch_booking_json,
            commands::booking::submit_booking_form,
            commands::recaptcha::open_recaptcha_window,
            commands::captcha_solver::get_captcha_settings,
            commands::captcha_solver::save_captcha_settings,
            commands::captcha_solver::clear_captcha_settings,
            commands::captcha_solver::solve_captcha,
            commands::gmail::get_gmail_status,
            commands::gmail::configure_gmail_app,
            commands::gmail::start_gmail_authorization,
            commands::gmail::finish_gmail_authorization,
            commands::gmail::cancel_gmail_authorization,
            commands::gmail::disconnect_gmail,
            commands::gmail::list_gmail_messages,
            commands::gmail::get_gmail_message,
            commands::storage::save_draft,
            commands::storage::load_draft,
            commands::storage::save_current_user_profile,
            commands::storage::load_current_user_profile,
            commands::storage::append_audit_entry,
            commands::storage::save_request_record,
            commands::storage::list_request_records,
            commands::storage::get_database_status,
            commands::storage::configure_database,
            commands::storage::clear_database_configuration,
            commands::storage::dismiss_request_reminder
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
