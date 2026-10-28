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
    if install_dir.is_file() {
        let _ = fs::remove_file(&install_dir);
    }
    if !install_dir.is_dir() {
        if let Err(e) = fs::create_dir_all(&install_dir) {
            show_msgbox("Installation Error", &format!("Could not create install folder: {}", e), true);
            return;
        }
    }

    let target_exe = install_dir.join("JobTracker.exe");
    let uninstall_bat = install_dir.join("uninstall.bat");

    // 1. Terminate any running instances of JobTracker before writing
    let _ = Command::new("taskkill")
        .args(["/F", "/IM", "JobTracker.exe", "/IM", "app.exe"])
        .output();
    std::thread::sleep(std::time::Duration::from_millis(300));

    // 2. Write application binary
    if let Err(e) = fs::write(&target_exe, APP_BYTES) {
        show_msgbox("Installation Error", &format!("Could not install application file:\n{}\n\nTry closing any open Job Tracker windows and run setup again.", e), true);
        return;
    }

    // 3. Write uninstaller script
    let uninstall_script = format!(
        "@echo off\r\n\
        echo Closing Job Tracker...\r\n\
        taskkill /F /IM JobTracker.exe /IM app.exe >nul 2>&1\r\n\
        echo Removing shortcuts and registry settings...\r\n\
        powershell -NoProfile -Command \"Remove-Item -Force '$([Environment]::GetFolderPath('Desktop'))\\Job Tracker.lnk' -ErrorAction SilentlyContinue; Remove-Item -Force '$([Environment]::GetFolderPath('Programs'))\\Job Tracker.lnk' -ErrorAction SilentlyContinue; Remove-Item -Force '$([Environment]::GetFolderPath('Programs'))\\Uninstall Job Tracker.lnk' -ErrorAction SilentlyContinue; Remove-Item -Force -Recurse 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\JobTracker' -ErrorAction SilentlyContinue; Remove-Item -Force -Recurse 'HKCU:\\Software\\Classes\\jobtracker' -ErrorAction SilentlyContinue;\"\r\n\
        echo Cleaning installation directory...\r\n\
        start /b \"\" cmd /c \"timeout /t 1 /nobreak >nul & rmdir /s /q \\\"{}\\\"\"\r\n\
        powershell -NoProfile -Command \"[System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms') | Out-Null; [System.Windows.Forms.MessageBox]::Show('Job Tracker has been uninstalled successfully.', 'Job Tracker Uninstalled', [System.Windows.Forms.MessageBoxButtons]::OK, 64)\"\r\n\
        exit /b 0\r\n",
        install_dir.to_string_lossy().replace('\"', "")
    );
    let _ = fs::write(&uninstall_bat, uninstall_script);

    // 4. Create Desktop Shortcut
    let desktop_dir = get_desktop_dir();
    if desktop_dir.exists() {
        let desktop_shortcut = desktop_dir.join("Job Tracker.lnk");
        create_shortcut(&target_exe, &desktop_shortcut);
    }

    // 5. Create Start Menu Shortcuts
    let start_menu_dir = get_start_menu_dir();
    if start_menu_dir.exists() {
        let start_shortcut = start_menu_dir.join("Job Tracker.lnk");
        create_shortcut(&target_exe, &start_shortcut);

        let uninstall_shortcut = start_menu_dir.join("Uninstall Job Tracker.lnk");
        create_shortcut(&uninstall_bat, &uninstall_shortcut);
    }

    // 6. Register custom deep-link URI protocol (jobtracker://)
    let protocol_reg = format!(
        r#"$p = 'HKCU:\Software\Classes\jobtracker'; if (!(Test-Path $p)) {{ New-Item -Path $p -Force | Out-Null }}; Set-ItemProperty -Path $p -Name '(Default)' -Value 'URL:Job Tracker Protocol'; Set-ItemProperty -Path $p -Name 'URL Protocol' -Value ''; $cmd = "$p\shell\open\command"; if (!(Test-Path $cmd)) {{ New-Item -Path $cmd -Force | Out-Null }}; Set-ItemProperty -Path $cmd -Name '(Default)' -Value '"{}" "%1"'"#,
        target_exe.to_string_lossy().replace('\'', "''")
    );
    let _ = Command::new("powershell")
        .args(["-NoProfile", "-NonInteractive", "-WindowStyle", "Hidden", "-Command", &protocol_reg])
        .output();

    // 7. Register in Windows Registry (Add/Remove Programs with working Uninstall button)
    let uninstall_reg = format!(
        r#"$path = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\JobTracker'; if (!(Test-Path $path)) {{ New-Item -Path $path -Force | Out-Null }}; Set-ItemProperty -Path $path -Name 'DisplayName' -Value 'Job Tracker'; Set-ItemProperty -Path $path -Name 'DisplayVersion' -Value '0.2.0'; Set-ItemProperty -Path $path -Name 'Publisher' -Value 'Job Tracker Team'; Set-ItemProperty -Path $path -Name 'InstallLocation' -Value '{}'; Set-ItemProperty -Path $path -Name 'DisplayIcon' -Value '{}'; Set-ItemProperty -Path $path -Name 'UninstallString' -Value 'cmd.exe /c \"{}\"'; Set-ItemProperty -Path $path -Name 'QuietUninstallString' -Value 'cmd.exe /c \"{}\"'"#,
        install_dir.to_string_lossy().replace('\'', "''"),
        target_exe.to_string_lossy().replace('\'', "''"),
        uninstall_bat.to_string_lossy().replace('\'', "''"),
        uninstall_bat.to_string_lossy().replace('\'', "''")
    );
    let _ = Command::new("powershell")
        .args(["-NoProfile", "-NonInteractive", "-WindowStyle", "Hidden", "-Command", &uninstall_reg])
        .output();

    // 8. Launch Installed Application
    let _ = Command::new(&target_exe).spawn();

    // 9. Success Notification
    show_msgbox(
        "Job Tracker Setup",
        "Job Tracker has been installed successfully!\n\nShortcuts have been added to your Desktop and Start Menu.\nTo uninstall in the future, use Windows Installed Apps or the uninstaller in the app folder.",
        false
    );
}
