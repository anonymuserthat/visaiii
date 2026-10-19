//! Secrets are protected for the current Windows user, never returned to the UI.
use serde::{de::DeserializeOwned, Serialize};
use std::{fs, path::PathBuf};
use tauri::{AppHandle, Manager};

fn path(app: &AppHandle, name: &str) -> Result<PathBuf, String> {
    let directory = app
        .path()
        .app_data_dir()
        .map_err(|_| "Stockage local indisponible.")?;
    fs::create_dir_all(&directory).map_err(|_| "Impossible de creer le stockage local.")?;
    Ok(directory.join(name))
}

#[cfg(windows)]
fn protect(data: &[u8], encrypt: bool) -> Result<Vec<u8>, String> {
    use windows_sys::Win32::{
        Foundation::LocalFree,
        Security::Cryptography::{
            CryptProtectData, CryptUnprotectData, CRYPTPROTECT_UI_FORBIDDEN, CRYPT_INTEGER_BLOB,
        },
    };
    let input = CRYPT_INTEGER_BLOB {
        cbData: data.len() as u32,
        pbData: data.as_ptr() as *mut u8,
    };
    let mut output = CRYPT_INTEGER_BLOB {
        cbData: 0,
        pbData: std::ptr::null_mut(),
    };
    // DPAPI allocates the output; copy it and release it with LocalFree.
    unsafe {
        let result = if encrypt {
            CryptProtectData(
                &input,
                std::ptr::null(),
                std::ptr::null(),
                std::ptr::null(),
                std::ptr::null(),
                CRYPTPROTECT_UI_FORBIDDEN,
                &mut output,
            )
        } else {
            CryptUnprotectData(
                &input,
                std::ptr::null_mut(),
                std::ptr::null(),
                std::ptr::null(),
                std::ptr::null(),
                CRYPTPROTECT_UI_FORBIDDEN,
                &mut output,
            )
        };
        if result == 0 {
            return Err("Impossible de proteger/lire les identifiants Windows. Reconfigurez ce compte sur cet ordinateur.".into());
        }
        let bytes = std::slice::from_raw_parts(output.pbData, output.cbData as usize).to_vec();
        LocalFree(output.pbData as *mut core::ffi::c_void);
        Ok(bytes)
    }
}

#[cfg(not(windows))]
fn protect(_data: &[u8], _encrypt: bool) -> Result<Vec<u8>, String> {
    Err("Le stockage des identifiants est actuellement disponible sous Windows uniquement.".into())
}

pub fn load<T: DeserializeOwned>(app: &AppHandle, name: &str) -> Result<Option<T>, String> {
    let path = path(app, name)?;
    let bytes = match fs::read(path) {
        Ok(bytes) => bytes,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(None),
        Err(_) => return Err("Impossible de lire les identifiants locaux.".into()),
    };
    serde_json::from_slice(&protect(&bytes, false)?)
        .map(Some)
        .map_err(|_| "Configuration locale invalide. Reconfigurez la connexion.".into())
}

pub fn save<T: Serialize>(app: &AppHandle, name: &str, value: &T) -> Result<(), String> {
    let bytes = serde_json::to_vec(value).map_err(|_| "Configuration invalide.")?;
    let path = path(app, name)?;
    let temporary = path.with_extension("tmp");
    fs::write(&temporary, protect(&bytes, true)?)
        .map_err(|_| "Impossible de sauvegarder les identifiants.")?;
    fs::rename(temporary, path).map_err(|_| "Impossible de finaliser la sauvegarde.".into())
}

pub fn remove(app: &AppHandle, name: &str) -> Result<(), String> {
    match fs::remove_file(path(app, name)?) {
        Ok(()) => Ok(()),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(_) => Err("Impossible de supprimer les identifiants locaux.".into()),
    }
}

#[cfg(all(test, windows))]
mod tests {
    #[test]
    fn secrets_are_encrypted_and_round_trip() {
        let original = b"private-refresh-token";
        let encrypted = super::protect(original, true).unwrap();
        assert!(!encrypted
            .windows(original.len())
            .any(|part| part == original));
        assert_eq!(super::protect(&encrypted, false).unwrap(), original);
        assert!(super::protect(b"corrupted", false).is_err());
    }
}
