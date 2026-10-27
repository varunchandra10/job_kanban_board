const GOOGLE_CLIENT_ID = '836791560954-04nmefe9kd3vnej9c5l9c36u5thr5je8.apps.googleusercontent.com';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

export function getStoredGoogleDriveToken(): string | null {
  return localStorage.getItem('google_drive_access_token');
}

export function isGoogleDriveConnected(): boolean {
  return !!getStoredGoogleDriveToken();
}

export function requestGoogleDriveAccess(): Promise<string> {
  return new Promise((resolve, reject) => {
    const google = (window as any).google;
    if (!google?.accounts?.oauth2) {
      return reject(
        new Error('Google Identity Services is loading. Please check your internet connection and try again.')
      );
    }

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
