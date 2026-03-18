use tauri::State;

use crate::sidecar::SidecarState;

#[tauri::command]
pub fn get_server_port(state: State<'_, SidecarState>) -> u16 {
    state.port
}
