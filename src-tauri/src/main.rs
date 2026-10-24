// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
  if let Err(err) = app_lib::run() {
    eprintln!("Fatal error in Job Tracker: {err}");

    #[cfg(target_os = "windows")]
    {
      let clean_err = format!("{}", err).replace('\'', "''");
      let script = format!(
        "[System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms'); [System.Windows.Forms.MessageBox]::Show('Job Tracker encountered an unrecoverable startup error:\n\n{}', 'Job Tracker - Fatal Error', 'OK', 'Error')",
        clean_err
      );
      let _ = std::process::Command::new("powershell")
        .args(["-NoProfile", "-WindowStyle", "Hidden", "-Command", &script])
        .status();
    }

    std::process::exit(1);
  }
}
