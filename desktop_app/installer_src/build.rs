fn main() {
    if std::env::var("CARGO_CFG_TARGET_OS").unwrap_or_default() == "windows" {
        let mut res = winres::WindowsResource::new();
        res.set_icon("../src-tauri/icons/icon.ico");
        res.set("FileDescription", "Job Tracker Setup");
        res.set("ProductName", "Job Tracker");
        res.set("OriginalFilename", "Job-Tracker-Setup.exe");
        res.set("CompanyName", "Job Tracker");
        res.set("LegalCopyright", "Copyright © 2026 Job Tracker");
        res.set("Comments", "Job Application Tracker and Career Management Hub");
        res.set_version_info(winres::VersionInfo::PRODUCTVERSION, 0x0001000000000000);
        res.set_version_info(winres::VersionInfo::FILEVERSION, 0x0001000000000000);
        if let Err(e) = res.compile() {
            eprintln!("Warning: Failed to compile windows resource: {}", e);
        }
    }
}
