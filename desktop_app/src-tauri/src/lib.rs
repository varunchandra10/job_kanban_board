mod commands;

use tauri::{
    menu::{Menu, MenuItem, Submenu},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() -> tauri::Result<()> {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_store::Builder::default().build())
    .plugin(tauri_plugin_opener::init())
    .plugin(tauri_plugin_updater::Builder::new().build())
    .invoke_handler(tauri::generate_handler![
      commands::export_csv,
      commands::save_file_from_bytes,
      commands::get_app_data_path,
      commands::open_data_folder,
      commands::open_in_file_manager,
      commands::select_folder,
      commands::check_for_updates,
      commands::toggle_devtools,
      commands::get_log_dir,
      commands::open_log_folder,
      commands::show_fatal_error
    ])
    .setup(|app| {
      app.handle().plugin(
        tauri_plugin_log::Builder::new()
          .targets([
            tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Stdout),
            tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::LogDir { file_name: Some("jobtracker".to_string()) }),
            tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Webview),
          ])
          .rotation_strategy(tauri_plugin_log::RotationStrategy::KeepSome(5))
          .max_file_size(2 * 1024 * 1024)
          .level(log::LevelFilter::Info)
          .build(),
      )?;

      log::info!("Job Tracker Desktop initialized. Rotating file logging active in LogDir.");

      let handle = app.handle();

      // 1. Application Window Menu
      let file_open_data = MenuItem::with_id(handle, "menu_open_data", "Open Data Folder", true, None::<&str>)?;
      let file_open_logs = MenuItem::with_id(handle, "menu_open_logs", "Open Log Folder", true, None::<&str>)?;
      let file_quit = MenuItem::with_id(handle, "menu_quit", "Quit Job Tracker", true, Some("CmdOrCtrl+Q"))?;
      let file_menu = Submenu::with_items(handle, "File", true, &[&file_open_data, &file_open_logs, &file_quit])?;

      let view_reload = MenuItem::with_id(handle, "menu_reload", "Reload View", true, Some("CmdOrCtrl+R"))?;
      let view_devtools = MenuItem::with_id(handle, "menu_devtools", "Toggle Developer Tools", true, Some("CmdOrCtrl+Shift+I"))?;
      let view_menu = Submenu::with_items(handle, "View", true, &[&view_reload, &view_devtools])?;

      let help_update = MenuItem::with_id(handle, "menu_update", "Check for Updates...", true, None::<&str>)?;
      let help_about = MenuItem::with_id(handle, "menu_about", "About Job Tracker", true, None::<&str>)?;
      let help_menu = Submenu::with_items(handle, "Help", true, &[&help_update, &help_about])?;

      let app_menu = Menu::with_items(handle, &[&file_menu, &view_menu, &help_menu])?;
      let _ = handle.set_menu(app_menu);

      handle.on_menu_event(move |app, event| {
        match event.id().as_ref() {
          "menu_open_data" => {
            #[cfg(target_os = "windows")]
            {
              let appdata = std::env::var("APPDATA").unwrap_or_default();
              let target_dir = std::path::Path::new(&appdata).join("JobTracker");
              let _ = std::process::Command::new("explorer").arg(target_dir).spawn();
            }
          }
          "menu_open_logs" => {
            if let Ok(log_dir) = app.path().app_log_dir() {
              if !log_dir.exists() {
                let _ = std::fs::create_dir_all(&log_dir);
              }
              #[cfg(target_os = "windows")]
              {
                let _ = std::process::Command::new("explorer").arg(log_dir).spawn();
              }
            }
          }
          "menu_reload" => {
            if let Some(win) = app.get_webview_window("main") {
              let _ = win.eval("window.location.reload()");
            }
          }
          "menu_devtools" => {
            if let Some(win) = app.get_webview_window("main") {
              if win.is_devtools_open() {
                win.close_devtools();
              } else {
                win.open_devtools();
              }
            }
          }
          "menu_update" => {
            use tauri_plugin_dialog::DialogExt;
            use tauri_plugin_updater::UpdaterExt;
            let handle = app.clone();
            tauri::async_runtime::spawn(async move {
              match handle.updater() {
                Ok(updater) => match updater.check().await {
                  Ok(Some(update)) => {
                    let notes = update.body.as_deref().unwrap_or("No release notes provided.");
                    let msg = format!("A new update is available!\nVersion: {}\n\nRelease Notes:\n{}", update.version, notes);
                    handle.dialog().message(msg).title("Update Available").blocking_show();
                  }
                  Ok(None) => {
                    handle.dialog().message("You are already using the latest version of Job Tracker (v0.2.0).").title("Up to Date").blocking_show();
                  }
                  Err(e) => {
                    handle.dialog().message(format!("Could not reach update server:\n{}", e)).title("Update Check").blocking_show();
                  }
                },
                Err(e) => {
                  handle.dialog().message(format!("Updater error:\n{}", e)).title("Updater Error").blocking_show();
                }
              }
            });
          }
          "menu_about" => {
            use tauri_plugin_dialog::DialogExt;
            app.dialog()
              .message("Job Tracker Desktop Edition v0.2.0\nHigh-performance career management hub with embedded SQLite.")
              .title("About Job Tracker")
              .blocking_show();
          }
          "menu_quit" => {
            app.exit(0);
          }
          _ => {}
        }
      });

      // 2. System Tray & Context Menu
      let tray_show = MenuItem::with_id(handle, "tray_show", "Show Window", true, None::<&str>)?;
      let tray_hide = MenuItem::with_id(handle, "tray_hide", "Hide to Tray", true, None::<&str>)?;
      let tray_open_data = MenuItem::with_id(handle, "tray_open_data", "Open Data Folder", true, None::<&str>)?;
      let tray_open_logs = MenuItem::with_id(handle, "tray_open_logs", "Open Log Folder", true, None::<&str>)?;
      let tray_quit = MenuItem::with_id(handle, "tray_quit", "Quit Job Tracker", true, None::<&str>)?;

      let tray_menu = Menu::with_items(
        handle,
        &[&tray_show, &tray_hide, &tray_open_data, &tray_open_logs, &tray_quit],
      )?;

      let mut tray_builder = TrayIconBuilder::new()
        .menu(&tray_menu)
        .show_menu_on_left_click(false)
        .tooltip("Job Tracker - Career Hub");

      if let Some(icon) = app.default_window_icon() {
        tray_builder = tray_builder.icon(icon.clone());
      }

      let _tray = tray_builder
        .on_menu_event(|app, event| {
          match event.id().as_ref() {
            "tray_show" => {
              if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
              }
            }
            "tray_hide" => {
              if let Some(window) = app.get_webview_window("main") {
                let _ = window.hide();
              }
            }
            "tray_open_data" => {
              #[cfg(target_os = "windows")]
              {
                let appdata = std::env::var("APPDATA").unwrap_or_default();
                let target_dir = std::path::Path::new(&appdata).join("JobTracker");
                let _ = std::process::Command::new("explorer").arg(target_dir).spawn();
              }
            }
            "tray_open_logs" => {
              if let Ok(log_dir) = app.path().app_log_dir() {
                if !log_dir.exists() {
                  let _ = std::fs::create_dir_all(&log_dir);
                }
                #[cfg(target_os = "windows")]
                {
                  let _ = std::process::Command::new("explorer").arg(log_dir).spawn();
                }
              }
            }
            "tray_quit" => {
              app.exit(0);
            }
            _ => {}
          }
        })
        .on_tray_icon_event(|tray, event| {
          if let TrayIconEvent::Click {
            button: MouseButton::Left,
            button_state: MouseButtonState::Up,
            ..
          } = event
          {
            let app = tray.app_handle();
            if let Some(window) = app.get_webview_window("main") {
              if let Ok(visible) = window.is_visible() {
                if visible {
                  let _ = window.hide();
                } else {
                  let _ = window.show();
                  let _ = window.set_focus();
                }
              }
            }
          }
        })
        .build(app)?;

      // 3. Clean Window Close (Terminates process cleanly, preventing ghost background processes)
      if let Some(main_win) = app.get_webview_window("main") {
        let app_handle = app.handle().clone();
        main_win.on_window_event(move |event| {
          if let tauri::WindowEvent::CloseRequested { .. } = event {
            app_handle.exit(0);
          }
        });
      }

      Ok(())
    })
    // Generate context embedding current dist bundle
    .run(tauri::generate_context!())
}
