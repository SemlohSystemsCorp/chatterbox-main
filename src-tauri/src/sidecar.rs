use std::process::{Child, Command};
use std::sync::Mutex;

pub struct SidecarState {
    process: Mutex<Option<Child>>,
    pub port: u16,
}

impl SidecarState {
    pub fn new(port: u16) -> Self {
        Self {
            process: Mutex::new(None),
            port,
        }
    }

    /// Start the Next.js standalone server as a child process.
    pub fn start(&self, resource_dir: &std::path::Path) -> Result<(), String> {
        let server_js = resource_dir.join(".next/standalone/server.js");
        if !server_js.exists() {
            return Err(format!("server.js not found at {:?}", server_js));
        }

        // Look for bundled node binary, fall back to system node
        let node_bin = if cfg!(target_os = "macos") {
            let bundled = resource_dir.join("node");
            if bundled.exists() {
                bundled.to_string_lossy().to_string()
            } else {
                "node".to_string()
            }
        } else if cfg!(target_os = "windows") {
            let bundled = resource_dir.join("node.exe");
            if bundled.exists() {
                bundled.to_string_lossy().to_string()
            } else {
                "node".to_string()
            }
        } else {
            "node".to_string()
        };

        let child = Command::new(&node_bin)
            .arg(&server_js)
            .env("PORT", self.port.to_string())
            .env("HOSTNAME", "127.0.0.1")
            .current_dir(resource_dir)
            .spawn()
            .map_err(|e| format!("Failed to start Next.js server: {}", e))?;

        let mut proc = self.process.lock().map_err(|e| e.to_string())?;
        *proc = Some(child);
        Ok(())
    }

    /// Kill the child process on shutdown.
    pub fn stop(&self) {
        if let Ok(mut proc) = self.process.lock() {
            if let Some(ref mut child) = *proc {
                let _ = child.kill();
                let _ = child.wait();
            }
            *proc = None;
        }
    }
}

impl Drop for SidecarState {
    fn drop(&mut self) {
        self.stop();
    }
}

/// Wait for the Next.js server to become ready by polling the health endpoint.
pub fn wait_for_server(port: u16, timeout_secs: u64) -> Result<(), String> {
    let url = format!("http://127.0.0.1:{}", port);
    let start = std::time::Instant::now();
    let timeout = std::time::Duration::from_secs(timeout_secs);

    while start.elapsed() < timeout {
        if let Ok(resp) = reqwest::blocking::get(&url) {
            if resp.status().is_success() || resp.status().is_redirection() {
                return Ok(());
            }
        }
        std::thread::sleep(std::time::Duration::from_millis(200));
    }

    Err(format!(
        "Next.js server did not start within {} seconds",
        timeout_secs
    ))
}
