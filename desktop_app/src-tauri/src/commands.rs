use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use tauri_plugin_dialog::DialogExt;

/// Native command to export CSV content with an OS file-picker save dialog.
#[tauri::command]
pub async fn export_csv(
    app: AppHandle,
    content: String,
    default_filename: Option<String>,
) -> Result<Option<String>, String> {
    let filename = default_filename.unwrap_or_else(|| "job-applications.csv".to_string());

    let file_path = app
        .dialog()
        .file()
        .set_file_name(&filename)
        .add_filter("CSV Files (*.csv)", &["csv"])
        .blocking_save_file();

    if let Some(path) = file_path {
        let path_buf: PathBuf = path.into_path().map_err(|e| e.to_string())?;
        fs::write(&path_buf, content.as_bytes()).map_err(|e| format!("Failed to save CSV: {}", e))?;
        Ok(Some(path_buf.to_string_lossy().to_string()))
    } else {
        Ok(None) // User cancelled dialog
    }
}

/// Native command to save an arbitrary file (e.g. SQLite database backup or ZIP).
#[tauri::command]
pub async fn save_file_from_bytes(
    app: AppHandle,
    bytes: Vec<u8>,
    default_filename: String,
    filter_label: String,
    filter_ext: String,
) -> Result<Option<String>, String> {
    let file_path = app
        .dialog()
        .file()
        .set_file_name(&default_filename)
        .add_filter(&filter_label, &[&filter_ext])
        .blocking_save_file();

    if let Some(path) = file_path {
        let path_buf: PathBuf = path.into_path().map_err(|e| e.to_string())?;
        fs::write(&path_buf, &bytes).map_err(|e| format!("Failed to save file: {}", e))?;
        Ok(Some(path_buf.to_string_lossy().to_string()))
    } else {
        Ok(None)
    }
}

/// Native command to select a folder via OS dialog.
#[tauri::command]
pub async fn select_folder(app: AppHandle) -> Result<Option<String>, String> {
    let folder_path = app
        .dialog()
        .file()
        .blocking_pick_folder();

    if let Some(path) = folder_path {
        let path_buf: PathBuf = path.into_path().map_err(|e| e.to_string())?;
        Ok(Some(path_buf.to_string_lossy().to_string()))
    } else {
        Ok(None)
    }
}

/// Ensures the user-selected folder and resumes/cover_letter subfolders exist on the system.
#[tauri::command]
pub async fn ensure_storage_dirs(folder_path: String) -> Result<(), String> {
    let p = std::path::Path::new(&folder_path);
    if !p.exists() {
        let _ = std::fs::create_dir_all(p);
    }
    let resumes = p.join("resumes");
    if !resumes.exists() {
        let _ = std::fs::create_dir_all(resumes);
    }
    let cover_letter = p.join("cover_letter");
    if !cover_letter.exists() {
        let _ = std::fs::create_dir_all(cover_letter);
    }
    Ok(())
}

/// Resolves the operating system's application data folder for Job Tracker.
#[tauri::command]
pub async fn get_app_data_path(app: AppHandle) -> Result<String, String> {
    let path = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    Ok(path.to_string_lossy().to_string())
}

/// Opens the Job Tracker application data folder in Windows File Explorer.
#[tauri::command]
pub async fn open_data_folder(app: AppHandle) -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        let _ = &app;
        let appdata = std::env::var("APPDATA").unwrap_or_else(|_| "".to_string());
        let target_dir = std::path::Path::new(&appdata).join("JobTracker");
        if !target_dir.exists() {
            let _ = std::fs::create_dir_all(&target_dir);
        }
        let path_str = target_dir.to_string_lossy().to_string();
        let _ = std::process::Command::new("explorer")
            .arg(&path_str)
            .spawn();
        Ok(path_str)
    }

    #[cfg(not(target_os = "windows"))]
    {
        let path = app.path().app_data_dir().map_err(|e| e.to_string())?;
        Ok(path.to_string_lossy().to_string())
    }
}

/// Opens a path in Windows Explorer (or system file manager).
#[tauri::command]
pub async fn open_in_file_manager(path: String) -> Result<(), String> {
    let p = std::path::Path::new(&path);
    if !p.exists() {
        return Err(format!("Path does not exist: {}", path));
    }

    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        if p.is_file() {
            Command::new("explorer")
                .arg(format!("/select,\"{}\"", path))
                .spawn()
                .map_err(|e| e.to_string())?;
        } else {
            Command::new("explorer")
                .arg(&path)
                .spawn()
                .map_err(|e| e.to_string())?;
        }
        Ok(())
    }

    #[cfg(not(target_os = "windows"))]
    {
        Ok(())
    }
}

#[derive(serde::Serialize)]
pub struct UpdateCheckResult {
    pub available: bool,
    pub current_version: String,
    pub latest_version: String,
    pub notes: String,
}

/// Checks GitHub releases for application updates.
#[tauri::command]
pub async fn check_for_updates(app: AppHandle) -> Result<UpdateCheckResult, String> {
    use tauri_plugin_updater::UpdaterExt;

    let updater = app.updater().map_err(|e| format!("Updater initialization error: {}", e))?;
    let update = updater.check().await.map_err(|e| format!("Failed to check for updates: {}", e))?;

    if let Some(update) = update {
        Ok(UpdateCheckResult {
            available: true,
            current_version: update.current_version.clone(),
            latest_version: update.version.clone(),
            notes: update.body.unwrap_or_default(),
        })
    } else {
        Ok(UpdateCheckResult {
            available: false,
            current_version: "0.2.0".to_string(),
            latest_version: "0.2.0".to_string(),
            notes: "You are already using the latest version of Job Tracker.".to_string(),
        })
    }
}

/// Toggles the Developer Tools console for debugging.
#[tauri::command]
pub async fn toggle_devtools(window: tauri::WebviewWindow) -> Result<(), String> {
    if window.is_devtools_open() {
        window.close_devtools();
    } else {
        window.open_devtools();
    }
    Ok(())
}

/// Resolves the file system path for application diagnostic logs.
#[tauri::command]
pub async fn get_log_dir(app: AppHandle) -> Result<String, String> {
    let dir = app
        .path()
        .app_log_dir()
        .map_err(|e| format!("Failed to get app log dir: {}", e))?;
    Ok(dir.to_string_lossy().to_string())
}

/// Opens the Job Tracker application log folder in Windows File Explorer.
#[tauri::command]
pub async fn open_log_folder(app: AppHandle) -> Result<String, String> {
    let log_dir = app
        .path()
        .app_log_dir()
        .map_err(|e| format!("Failed to get app log dir: {}", e))?;
    if !log_dir.exists() {
        let _ = fs::create_dir_all(&log_dir);
    }
    let path_str = log_dir.to_string_lossy().to_string();

    #[cfg(target_os = "windows")]
    {
        let _ = std::process::Command::new("explorer").arg(&path_str).spawn();
    }

    Ok(path_str)
}

/// Displays a modal native error dialog for fatal or catastrophic application states.
#[tauri::command]
pub async fn show_fatal_error(app: AppHandle, title: String, message: String) -> Result<(), String> {
    app.dialog()
        .message(message)
        .title(title)
        .blocking_show();
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_csv_formatting_and_headless_export() {
        let temp_dir = std::env::temp_dir();
        let target_file = temp_dir.join("test_job_export.csv");
        let sample_csv = "Company,Role,Status,Salary\nAcme Corp,Frontend Engineer,Applied,$120k\n";

        let write_res = fs::write(&target_file, sample_csv.as_bytes());
        assert!(write_res.is_ok(), "Failed to write CSV in headless test");

        let read_back = fs::read_to_string(&target_file).expect("Failed to read back CSV");
        assert_eq!(read_back, sample_csv);

        let _ = fs::remove_file(&target_file);
    }
}


