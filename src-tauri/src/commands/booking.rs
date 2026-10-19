use std::collections::HashMap;

use reqwest::header::{ACCEPT, ACCEPT_LANGUAGE, CONTENT_TYPE, ORIGIN, REFERER};
use reqwest::StatusCode;
use serde::{Deserialize, Serialize};
use tauri::State;

use crate::AppState;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FetchBookingJsonPayload {
    pub base_url: String,
    pub frontend_url: Option<String>,
    pub path: String,
    pub query: HashMap<String, String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubmitBookingFormPayload {
    pub base_url: String,
    pub frontend_url: Option<String>,
    pub path: String,
    pub body: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SubmitBookingFormResponse {
    pub status: u16,
    pub location: Option<String>,
    pub json_body: Option<serde_json::Value>,
    pub raw_body: String,
}

fn build_url(base_url: &str, path: &str) -> String {
    format!(
        "{}{}",
        base_url.trim_end_matches('/'),
        if path.starts_with('/') {
            path.to_string()
        } else {
            format!("/{}", path)
        }
    )
}

fn build_origin(base_url: &str) -> Option<String> {
    let parsed = reqwest::Url::parse(base_url).ok()?;
    let host = parsed.host_str()?;

    Some(match parsed.port() {
        Some(port) => format!("{}://{}:{}", parsed.scheme(), host, port),
        None => format!("{}://{}", parsed.scheme(), host),
    })
}

fn build_referer(url: &str) -> String {
    format!("{}/", url.trim_end_matches('/'))
}

fn request_origin_url<'a>(base_url: &'a str, frontend_url: &'a Option<String>) -> &'a str {
    frontend_url.as_deref().unwrap_or(base_url)
}

#[tauri::command]
pub async fn fetch_booking_json(
    payload: FetchBookingJsonPayload,
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    let origin_url = request_origin_url(&payload.base_url, &payload.frontend_url);
    let request = state
        .http_client
        .get(build_url(&payload.base_url, &payload.path))
        .header(ACCEPT, "application/json, text/javascript, */*; q=0.01")
        .header(ACCEPT_LANGUAGE, "fr-FR,fr;q=0.9")
        .header("X-Requested-With", "XMLHttpRequest")
        .header(REFERER, build_referer(origin_url))
        .query(&payload.query);

    let request = if let Some(origin) = build_origin(origin_url) {
        request.header(ORIGIN, origin)
    } else {
        request
    };

    let response = request.send().await.map_err(|error| error.to_string())?;

    let status = response.status();
    let body = response.text().await.map_err(|error| error.to_string())?;

    if !status.is_success() {
        return Err(format!("HTTP {}: {}", status.as_u16(), body));
    }

    serde_json::from_str(&body).map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn submit_booking_form(
    payload: SubmitBookingFormPayload,
    state: State<'_, AppState>,
) -> Result<SubmitBookingFormResponse, String> {
    let origin_url = request_origin_url(&payload.base_url, &payload.frontend_url);
    let request = state
        .http_client
        .post(build_url(&payload.base_url, &payload.path))
        .header(ACCEPT, "application/json, text/javascript, */*; q=0.01")
        .header(ACCEPT_LANGUAGE, "fr-FR,fr;q=0.9")
        .header(CONTENT_TYPE, "application/x-www-form-urlencoded")
        .header("X-Requested-With", "XMLHttpRequest")
        .header(REFERER, build_referer(origin_url))
        .body(payload.body);

    let request = if let Some(origin) = build_origin(origin_url) {
        request.header(ORIGIN, origin)
    } else {
        request
    };

    let response = request.send().await.map_err(|error| error.to_string())?;

    let status = response.status();
    let location = response
        .headers()
        .get("location")
        .and_then(|value| value.to_str().ok())
        .map(std::string::ToString::to_string);
    let raw_body = response.text().await.map_err(|error| error.to_string())?;

    let json_body = if status == StatusCode::CREATED {
        None
    } else {
        serde_json::from_str(&raw_body).ok()
    };

    Ok(SubmitBookingFormResponse {
        status: status.as_u16(),
        location,
        json_body,
        raw_body,
    })
}
