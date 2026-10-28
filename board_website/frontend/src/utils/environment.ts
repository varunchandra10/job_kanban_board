export type StorageMode = 'local_storage' | 'g_drive';

export const isDesktopApp = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!(
    (window as any).__TAURI__ ||
    (window as any).__TAURI_INTERNALS__ ||
    window.location.protocol === 'tauri:' ||
    window.location.hostname === 'tauri.localhost' ||
    navigator.userAgent.includes('JobTracker') ||
    navigator.userAgent.includes('Tauri')
  );
};

export const getInitialStorageMode = (): StorageMode => {
  if (typeof window === 'undefined') return 'g_drive';
  const saved = localStorage.getItem('job_tracker_storage_preference');
  if (saved === 'local_storage' || saved === 'g_drive') {
    return saved;
  }
  // Default to Google Drive for all environments so users can easily sync and access files
  return 'g_drive';
};
