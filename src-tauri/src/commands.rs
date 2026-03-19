use tauri::{AppHandle, State};

use crate::sidecar::SidecarState;

#[tauri::command]
pub fn get_server_port(state: State<'_, SidecarState>) -> u16 {
    state.port
}

#[tauri::command]
pub fn autostart_is_enabled(app: AppHandle) -> Result<bool, String> {
    use tauri_plugin_autostart::ManagerExt;
    app.autolaunch()
        .is_enabled()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn autostart_enable(app: AppHandle) -> Result<(), String> {
    use tauri_plugin_autostart::ManagerExt;
    app.autolaunch()
        .enable()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn autostart_disable(app: AppHandle) -> Result<(), String> {
    use tauri_plugin_autostart::ManagerExt;
    app.autolaunch()
        .disable()
        .map_err(|e| e.to_string())
}
