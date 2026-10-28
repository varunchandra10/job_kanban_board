#![windows_subsystem = "windows"]

use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

static APP_BYTES: &[u8] = include_bytes!("../../src-tauri/target/release/app.exe");

fn get_local_app_data() -> PathBuf {
    std::env::var_os("LOCALAPPDATA")
        .map(PathBuf::from)
        .unwrap_or_else(|| {
            let userprofile = std::env::var_os("USERPROFILE").unwrap_or_default();
            Path::new(&userprofile).join("AppData").join("Local")
        })
}

fn get_desktop_dir() -> PathBuf {
    let userprofile = std::env::var_os("USERPROFILE").unwrap_or_default();
    let desktop = Path::new(&userprofile).join("Desktop");
    if desktop.exists() {
        desktop
    } else {
        Path::new(&userprofile).join("OneDrive").join("Desktop")
    }
}

fn get_start_menu_dir() -> PathBuf {
    std::env::var_os("APPDATA")
        .map(PathBuf::from)
        .map(|p| p.join("Microsoft").join("Windows").join("Start Menu").join("Programs"))
        .unwrap_or_else(|| {
            let userprofile = std::env::var_os("USERPROFILE").unwrap_or_default();
            Path::new(&userprofile)
                .join("AppData")
                .join("Roaming")
                .join("Microsoft")
                .join("Windows")
                .join("Start Menu")
                .join("Programs")
        })
}

fn show_msgbox(title: &str, message: &str, is_error: bool) {
    let icon = if is_error { "16" } else { "64" };
    let script = format!(
        "[System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms') | Out-Null; [System.Windows.Forms.MessageBox]::Show('{}', '{}', [System.Windows.Forms.MessageBoxButtons]::OK, {})",
        message.replace('\'', "''"),
        title.replace('\'', "''"),
        icon
    );
    let _ = Command::new("powershell")
        .args(["-NoProfile", "-NonInteractive", "-WindowStyle", "Hidden", "-Command", &script])
        .output();
}

fn create_shortcut(target_exe: &Path, shortcut_path: &Path) {
    let script = format!(
        "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('{}'); $s.TargetPath = '{}'; $s.WorkingDirectory = '{}'; $s.Description = 'Job Application Tracker and Career Hub'; $s.Save()",
        shortcut_path.to_string_lossy().replace('\'', "''"),
        target_exe.to_string_lossy().replace('\'', "''"),
        target_exe.parent().unwrap_or(target_exe).to_string_lossy().replace('\'', "''")
    );
    let _ = Command::new("powershell")
        .args(["-NoProfile", "-NonInteractive", "-WindowStyle", "Hidden", "-Command", &script])
        .output();
}

fn main() {
    let install_dir = get_local_app_data().join("Programs").join("Job Tracker");
    if let Err(e) = fs::create_dir_all(&install_dir) {
        show_msgbox("Installation Error", &format!("Could not create install folder: {}", e), true);
        return;
    }

    let target_exe = install_dir.join("JobTracker.exe");

    // If an existing instance is running, try to terminate gently or overwrite
    if let Err(e) = fs::write(&target_exe, APP_BYTES) {
        // Try killing existing JobTracker if it's currently running
        let _ = Command::new("taskkill")
            .args(["/F", "/IM", "JobTracker.exe"])
            .output();
        std::thread::sleep(std::time::Duration::from_millis(400));
        if let Err(retry_err) = fs::write(&target_exe, APP_BYTES) {
            show_msgbox("Installation Error", &format!("Could not install application file:\n{}\n\nTry closing any open Job Tracker windows and run setup again.", retry_err), true);
            return;
        }
    }

    // 1. Create Desktop Shortcut
    let desktop_dir = get_desktop_dir();
    if desktop_dir.exists() {
        let desktop_shortcut = desktop_dir.join("Job Tracker.lnk");
        create_shortcut(&target_exe, &desktop_shortcut);
    }

    // 2. Create Start Menu Shortcut
    let start_menu_dir = get_start_menu_dir();
    if start_menu_dir.exists() {
        let start_shortcut = start_menu_dir.join("Job Tracker.lnk");
        create_shortcut(&target_exe, &start_shortcut);
    }

    // 3. Register custom deep-link URI protocol (jobtracker://)
    let protocol_reg = format!(
        r#"$p = 'HKCU:\Software\Classes\jobtracker'; if (!(Test-Path $p)) {{ New-Item -Path $p -Force | Out-Null }}; Set-ItemProperty -Path $p -Name '(Default)' -Value 'URL:Job Tracker Protocol'; Set-ItemProperty -Path $p -Name 'URL Protocol' -Value ''; $cmd = "$p\shell\open\command"; if (!(Test-Path $cmd)) {{ New-Item -Path $cmd -Force | Out-Null }}; Set-ItemProperty -Path $cmd -Name '(Default)' -Value '"{}" "%1"'"#,
        target_exe.to_string_lossy().replace('\'', "''")
    );
    let _ = Command::new("powershell")
        .args(["-NoProfile", "-NonInteractive", "-WindowStyle", "Hidden", "-Command", &protocol_reg])
        .output();

    // 4. Register in Windows Registry (Add/Remove Programs)
    let uninstall_reg = format!(
        r#"$path = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\JobTracker'; if (!(Test-Path $path)) {{ New-Item -Path $path -Force | Out-Null }}; Set-ItemProperty -Path $path -Name 'DisplayName' -Value 'Job Tracker'; Set-ItemProperty -Path $path -Name 'DisplayVersion' -Value '0.2.0'; Set-ItemProperty -Path $path -Name 'Publisher' -Value 'Job Tracker Team'; Set-ItemProperty -Path $path -Name 'InstallLocation' -Value '{}'; Set-ItemProperty -Path $path -Name 'DisplayIcon' -Value '{}'"#,
        install_dir.to_string_lossy().replace('\'', "''"),
        target_exe.to_string_lossy().replace('\'', "''")
    );
    let _ = Command::new("powershell")
        .args(["-NoProfile", "-NonInteractive", "-WindowStyle", "Hidden", "-Command", &uninstall_reg])
        .output();

    // 4. Launch Installed Application
    let _ = Command::new(&target_exe).spawn();

    // 5. Success Notification
    show_msgbox(
        "Job Tracker Setup",
        "Job Tracker has been installed successfully!\n\nShortcuts have been added to your Desktop and Start Menu.",
        false
    );
}
