// Never embed DATABASE_URL (including database passwords) in desktop installers.
// Configure the connection per PC via the application settings instead.
fn main() {
    tauri_build::build()
}
