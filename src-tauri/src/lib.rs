mod commands;
mod sidecar;
mod tray;

use sidecar::SidecarState;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let port = portpicker::pick_unused_port().expect("failed to find an unused port");

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_store::Builder::new().build())
        .manage(SidecarState::new(port))
        .invoke_handler(tauri::generate_handler![commands::get_server_port])
        .setup(move |app| {
            let handle = app.handle().clone();

            // Start the Next.js sidecar server
            let state = handle.state::<SidecarState>();
            if let Some(resource_dir) = app.path().resource_dir().ok() {
                if let Err(e) = state.start(&resource_dir) {
                    eprintln!("Sidecar start error: {}", e);
                    // In dev mode, the Next.js dev server is already running externally
                    #[cfg(debug_assertions)]
                    eprintln!("(dev mode) Assuming external Next.js dev server on port 3000");
                }
            } else {
                #[cfg(debug_assertions)]
                eprintln!("(dev mode) No resource dir — using external Next.js dev server");
            }

            // Set up system tray
            if let Err(e) = tray::setup_tray(&handle) {
                eprintln!("Tray setup error: {}", e);
            }

            // In production, wait for the sidecar and navigate to it
            #[cfg(not(debug_assertions))]
            {
                let port = state.port;
                std::thread::spawn(move || {
                    if let Err(e) = sidecar::wait_for_server(port, 30) {
                        eprintln!("Server wait error: {}", e);
                        return;
                    }
                    if let Some(window) = handle.get_webview_window("main") {
                        let url = format!("http://127.0.0.1:{}", port);
                        let _ = window.eval(&format!("window.location.replace('{}')", url));
                    }
                });
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::Destroyed = event {
                let state = window.state::<SidecarState>();
                state.stop();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
