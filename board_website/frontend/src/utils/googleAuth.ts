import { isDesktopApp } from './environment';

export const GOOGLE_CLIENT_ID = '836791560954-04nmefe9kd3vnej9c5l9c36u5thr5je8.apps.googleusercontent.com';
export const GOOGLE_DESKTOP_CLIENT_ID = '836791560954-ttg8psif4aqp8m4enpajbjab23hua8lc.apps.googleusercontent.com';
export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

export function getStoredGoogleDriveToken(): string | null {
  return typeof window !== 'undefined' ? localStorage.getItem('google_drive_access_token') : null;
}

export function isGoogleDriveConnected(): boolean {
  return !!getStoredGoogleDriveToken();
}

export function loadGsiScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if ((window as any).google?.accounts?.oauth2) return Promise.resolve();
  return new Promise((resolve, reject) => {
    if (document.getElementById('googleGsiScript')) {
      let checks = 0;
      const interval = setInterval(() => {
        checks++;
        if ((window as any).google?.accounts?.oauth2) {
          clearInterval(interval);
          resolve();
        } else if (checks > 35) {
          clearInterval(interval);
          reject(new Error('Google Identity Services script timed out.'));
        }
      }, 100);
      return;
    }
    const s = document.createElement('script');
    s.id = 'googleGsiScript';
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load Google Sign-In script. Check connection.'));
    document.head.appendChild(s);
  });
}

export async function requestGoogleDriveAccess(): Promise<string> {
  // If running inside desktop app shell, use full Desktop OAuth flow with system browser
  if (isDesktopApp()) {
    const { api } = await import('../services/api');
    const startRes = await api.startDesktopGoogleAuth();
    const sessionId = startRes.sessionId;
    let attempts = 0;
    const maxAttempts = 120;
    return new Promise((resolve, reject) => {
      const pollInterval = setInterval(async () => {
        attempts++;
        if (attempts > maxAttempts) {
          clearInterval(pollInterval);
          reject(new Error('Google Drive authorization timed out. Please try again.'));
          return;
        }
        try {
          const pollRes = await api.pollDesktopGoogleAuth(sessionId);
          if (pollRes.ready) {
            clearInterval(pollInterval);
            if (pollRes.googleAccessToken) {
              localStorage.setItem('google_drive_access_token', pollRes.googleAccessToken);
              resolve(pollRes.googleAccessToken);
            } else {
              resolve('authorized');
            }
          }
        } catch (_) {}
      }, 1000);
    });
  }

  // Web mode: load GSI script and open Google popup
  await loadGsiScript();
  const google = (window as any).google;
  if (!google?.accounts?.oauth2) {
    throw new Error('Google Identity Services is loading. Please check your internet connection and try again.');
  }

  return new Promise((resolve, reject) => {
    try {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: DRIVE_SCOPE,
        callback: (response: any) => {
          if (response.error) {
            return reject(
              new Error(response.error_description || response.error || 'Google Drive authorization was denied.')
            );
          }
          if (response.access_token) {
            localStorage.setItem('google_drive_access_token', response.access_token);
            resolve(response.access_token);
          } else {
            reject(new Error('No access token received from Google.'));
          }
        },
      });

      client.requestAccessToken({ prompt: '' });
    } catch (err: any) {
      reject(err);
    }
  });
}

export async function ensureGoogleDriveToken(): Promise<string> {
  const existing = getStoredGoogleDriveToken();
  if (existing) {
    return existing;
  }
  return await requestGoogleDriveAccess();
}
