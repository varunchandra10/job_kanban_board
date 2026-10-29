import { Application, Learning, GamificationStats, UserProfile, ResumeVersion } from '../types';

export const isTauri = typeof window !== 'undefined' && (
  Boolean((window as any).__TAURI_INTERNALS__) ||
  Boolean((window as any).__TAURI__) ||
  window.location.protocol === 'tauri:' ||
  window.location.hostname === 'tauri.localhost' ||
  window.location.origin.includes('tauri.localhost')
);

const PROD_BASE = 'https://kanban-board-job.vercel.app';

function resolveServerBase(): string {
  if (!isTauri) return '';
  const override = localStorage.getItem('job_tracker_api_base');
  if (override) return override;
  return PROD_BASE;
}

export let SERVER_BASE = resolveServerBase();
export let API_BASE = `${SERVER_BASE}/api`;

if (isTauri && typeof window !== 'undefined') {
  // If local server is running on port 3000, smoothly connect to it; otherwise default to live cloud API
  fetch('http://127.0.0.1:3000/health', { signal: AbortSignal.timeout ? AbortSignal.timeout(600) : undefined })
    .then(r => {
      if (r.ok && !localStorage.getItem('job_tracker_force_cloud')) {
        SERVER_BASE = 'http://127.0.0.1:3000';
        API_BASE = 'http://127.0.0.1:3000/api';
      }
    })
    .catch(() => {
      // Local not running, smoothly stays on PROD_BASE
    });
}

export function getApiEndpoint(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${SERVER_BASE}${cleanPath}`;
}


function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

let cachedFileToken: { token: string; expiresAt: number } | null = null;

export const api = {
  // State bundle
  async getState(): Promise<{
    apps: Application[];
    companies: Array<{ name: string; city: string; country: string }>;
    roles: string[];
    profile: UserProfile | null;
    versions: ResumeVersion[];
    settings: Record<string, string>;
  }> {
    const res = await fetch(`${API_BASE}/state`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  // Applications
  async createApplication(data: Partial<Application>): Promise<Application> {
    const res = await fetch(`${API_BASE}/applications`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async updateApplication(id: number, data: Partial<Application>): Promise<{ ok: number }> {
    const res = await fetch(`${API_BASE}/applications/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async deleteApplication(id: number): Promise<{ ok: number }> {
    const res = await fetch(`${API_BASE}/applications/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async moveApplication(id: number, stage: string, before?: number): Promise<{ ok: number }> {
    const res = await fetch(`${API_BASE}/applications/${id}/move`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ stage, before }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  // Learnings
  async getLearnings(): Promise<Learning[]> {
    const res = await fetch(`${API_BASE}/learnings`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async createLearning(data: Partial<Learning>): Promise<Learning> {
    const res = await fetch(`${API_BASE}/learnings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async updateLearning(id: number, data: Partial<Learning>): Promise<{ ok: number }> {
    const res = await fetch(`${API_BASE}/learnings/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async deleteLearning(id: number): Promise<{ ok: number }> {
    const res = await fetch(`${API_BASE}/learnings/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async getGamification(): Promise<GamificationStats> {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const res = await fetch(`${API_BASE}/gamification?tz=${encodeURIComponent(tz)}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  // Profile & Settings
  async updateProfile(data: Partial<UserProfile>): Promise<{ ok: number }> {
    const res = await fetch(`${API_BASE}/profile`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async getStorageStatus(): Promise<{
    ok: number;
    connected: boolean;
    folderId: string | null;
    serviceAccountReady: boolean;
    userEmail: string | null;
  }> {
    const res = await fetch(`${API_BASE}/storage/status`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async testDriveConnection(folderId: string): Promise<{ ok: number; message: string; folderName: string }> {
    const res = await fetch(`${API_BASE}/storage/test-connection`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ folderId }),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) throw new Error(json.error || 'Connection failed');
    return json;
  },

  async connectDriveFolder(folderId: string): Promise<{ ok: number; folderId: string }> {
    const res = await fetch(`${API_BASE}/storage/connect-drive`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ folderId }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async shutdown(): Promise<{ ok: number; message: string }> {
    const res = await fetch(`${API_BASE}/shutdown`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async login(email?: string, password?: string): Promise<{ ok: number; token: string; user: any }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  async googleAuth(payload: { credential?: string; accessToken?: string; profile?: { email: string; name?: string; picture?: string; sub?: string } }): Promise<{ ok: number; token: string; user: any }> {
    const res = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  async startDesktopGoogleAuth(): Promise<{ ok: number; sessionId: string; url: string }> {
    const res = await fetch(`${API_BASE}/auth/google/desktop/start`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  async pollDesktopGoogleAuth(sessionId: string): Promise<{ ok: number; ready: boolean; token?: string; user?: any; googleAccessToken?: string }> {
    const res = await fetch(`${API_BASE}/auth/google/desktop/poll?sessionId=${encodeURIComponent(sessionId)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  async forgotPassword(email: string): Promise<{ ok: number; message: string }> {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    return data;
  },

  async resetPassword(email: string, code: string, newPassword: string): Promise<{ ok: number; message: string; token: string; user: any }> {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, newPassword }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    return data;
  },

  async logout(): Promise<{ ok: number }> {
    const res = await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async deleteDocument(appId: number, type: 'resume' | 'cover_letter', url?: string): Promise<{ ok: number }> {
    const res = await fetch(`${API_BASE}/delete-document`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ appId, type, url }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async uploadDocument(
    file: File,
    type: 'resume' | 'cover_letter',
    appId?: number,
    storageMode?: 'local_storage' | 'g_drive'
  ): Promise<{
    ok: number;
    fullPath: string;
    path: string;
    relativePath?: string;
    name: string;
    size?: number;
    isGoogleDrive?: boolean;
    isLocalStorage?: boolean;
    docId?: string;
    fileId?: string;
    rootFolderId?: string;
    folderId?: string;
    savedDiskPath?: string;
    localDiskPath?: string;
  }> {
    const activeMode = storageMode || localStorage.getItem('job_tracker_storage_preference') || 'g_drive';
    const customLocalDir = typeof window !== 'undefined' ? localStorage.getItem('job_tracker_custom_local_dir') : null;

    let savedLocalPath: string | undefined = undefined;

    // 1. If in Tauri desktop app and local storage mode, physically save file into local resumes/cover_letter folder!
    if (activeMode === 'local_storage' && typeof window !== 'undefined' && (window as any).__TAURI__?.core?.invoke) {
      try {
        const buffer = await file.arrayBuffer();
        const bytes = Array.from(new Uint8Array(buffer));
        const tauriRes = await (window as any).__TAURI__.core.invoke('save_uploaded_document', {
          folderPath: customLocalDir || null,
          docType: type,
          fileName: file.name,
          bytes,
        });
        if (tauriRes && tauriRes.path) {
          savedLocalPath = tauriRes.path;
          console.log('[Tauri Desktop] Document saved to local disk:', savedLocalPath);
          return {
            ok: 1,
            fullPath: savedLocalPath,
            path: savedLocalPath,
            relativePath: savedLocalPath,
            name: tauriRes.filename || file.name,
            size: tauriRes.size || file.size,
            isGoogleDrive: false,
            isLocalStorage: true,
            savedDiskPath: savedLocalPath,
            localDiskPath: savedLocalPath,
          };
        }
      } catch (tauriErr: any) {
        console.error('[Tauri Desktop] Failed to save document to local disk:', tauriErr);
        throw new Error(typeof tauriErr === 'string' ? tauriErr : (tauriErr?.message || 'Failed to save document to local disk'));
      }
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    formData.append('storageMode', activeMode);
    if (customLocalDir) {
      formData.append('customDir', customLocalDir);
    }
    if (appId) {
      formData.append('appId', String(appId));
    }
    const savedFolder = localStorage.getItem('gdrive_folder_id');
    if (savedFolder) {
      formData.append('folderId', savedFolder);
    }

    const headers = getAuthHeaders();
    delete headers['Content-Type'];

    const gDriveToken = localStorage.getItem('google_drive_access_token');
    if (gDriveToken) {
      headers['x-google-access-token'] = gDriveToken;
    }

    try {
      const res = await fetch(`${API_BASE}/upload-document`, {
        method: 'POST',
        headers,
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401 || (data.error && /invalid_token|invalid_grant|unauthorized/i.test(data.error))) {
          localStorage.removeItem('google_drive_access_token');
        }
        throw new Error(data.error || `Upload failed (HTTP ${res.status})`);
      }
      if (data.rootFolderId) {
        localStorage.setItem('gdrive_folder_id', data.rootFolderId);
      }
      if (savedLocalPath) {
        data.savedDiskPath = savedLocalPath;
        data.localDiskPath = savedLocalPath;
      }
      return data;
    } catch (fetchErr: any) {
      if (activeMode === 'local_storage') {
        console.warn('[uploadDocument] Server upload unreachable, operating in offline local mode:', fetchErr);
        return {
          ok: 1,
          fullPath: file.name,
          path: file.name,
          relativePath: file.name,
          name: file.name,
          size: file.size,
          isGoogleDrive: false,
          isLocalStorage: true,
        };
      }
      throw fetchErr;
    }
  },

  async getScopedFileToken(): Promise<string> {
    const now = Date.now();
    if (cachedFileToken && cachedFileToken.expiresAt > now + 60000) {
      return cachedFileToken.token;
    }
    try {
      const res = await fetch(`${API_BASE}/file-token`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.token) {
          cachedFileToken = { token: data.token, expiresAt: now + 50 * 60 * 1000 };
          return data.token;
        }
      }
    } catch (_) {}
    return '';
  },

  getDocumentUrl(filePath: string): string {
    if (!filePath) return '';
    if (/^https?:\/\//i.test(filePath)) return filePath;

    // Use short-lived scoped file token if cached; NEVER expose primary auth_token in URL query parameters
    const scopedToken = (cachedFileToken && cachedFileToken.expiresAt > Date.now()) ? cachedFileToken.token : '';
    const tokenParam = scopedToken ? `token=${encodeURIComponent(scopedToken)}` : '';

    if (filePath.startsWith('/api/')) {
      const url = getApiEndpoint(filePath);
      if (!tokenParam) return url;
      return url.includes('?') ? `${url}&${tokenParam}` : `${url}?${tokenParam}`;
    }

    const base = `${API_BASE}/file-content?path=${encodeURIComponent(filePath)}`;
    if (!tokenParam) return base;
    return base.includes('?') ? `${base}&${tokenParam}` : `${base}?${tokenParam}`;
  },

  async fetchDocumentBlob(filePath: string): Promise<Blob> {
    const cleanPath = filePath.replace(/[?&]token=[^&]+/g, '');
    const url = cleanPath.startsWith('/api/')
      ? getApiEndpoint(cleanPath)
      : `${API_BASE}/file-content?path=${encodeURIComponent(cleanPath)}`;

    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch document (HTTP ${res.status})`);
    }
    return await res.blob();
  },

  async openDocument(filePath: string): Promise<void> {
    if (!filePath) return;
    if (/^https?:\/\//i.test(filePath)) {
      window.open(filePath, '_blank', 'noopener,noreferrer');
      return;
    }

    // 0. If in Tauri desktop app, use native OS opener!
    if (typeof window !== 'undefined' && (window as any).__TAURI__?.core?.invoke) {
      try {
        const opened = await this.openLocalFile(filePath);
        if (opened) return;
      } catch (tauriErr) {
        console.warn('[Tauri Desktop] openLocalFile failed, falling back to browser preview:', tauriErr);
      }
    }

    // 1. Prefer safe blob URL viewing (Bearer token sent via HTTP headers, not exposed in query parameters)
    try {
      const blob = await this.fetchDocumentBlob(filePath);
      const objectUrl = URL.createObjectURL(blob);
      const win = window.open(objectUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
      if (win) return;
    } catch (e) {
      console.warn('[Document Preview] Blob fetch failed, falling back to scoped token URL:', e);
    }

    // 2. Fallback: ensure scoped token is loaded and open scoped URL
    const scopedToken = await this.getScopedFileToken();
    const tokenParam = scopedToken ? `token=${encodeURIComponent(scopedToken)}` : '';
    const url = filePath.startsWith('/api/')
      ? getApiEndpoint(filePath)
      : `${API_BASE}/file-content?path=${encodeURIComponent(filePath)}`;
    const finalUrl = tokenParam ? (url.includes('?') ? `${url}&${tokenParam}` : `${url}?${tokenParam}`) : url;
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
  },

  async getLocalStorageInfo(): Promise<{
    ok: number;
    isDesktop: boolean;
    activeDir: string;
    defaultDir: string;
    customDir: string | null;
    canOpenFolder: boolean;
  }> {
    let cached = typeof window !== 'undefined' ? localStorage.getItem('job_tracker_custom_local_dir') : null;

    if (!cached && typeof window !== 'undefined' && (window as any).__TAURI__?.core?.invoke) {
      try {
        const tauriCustom = await (window as any).__TAURI__.core.invoke('get_custom_storage_dir');
        if (tauriCustom) {
          cached = tauriCustom;
          localStorage.setItem('job_tracker_custom_local_dir', tauriCustom);
        }
      } catch (_) {}
    }

    try {
      const res = await fetch(`${API_BASE}/storage/local-info`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (cached && (data.activeDir === '/tmp/documents' || !data.customDir)) {
          data.activeDir = cached;
          data.customDir = cached;
        }
        return data;
      }
    } catch (_) {}

    return {
      ok: 1,
      isDesktop: isTauri,
      activeDir: cached || 'AppData\\Roaming\\JobTracker\\documents',
      defaultDir: 'AppData\\Roaming\\JobTracker\\documents',
      customDir: cached || null,
      canOpenFolder: isTauri,
    };
  },

  async openLocalFolder(folderPath?: string): Promise<{ ok: number; opened: boolean; path: string }> {
    const target = folderPath || (typeof window !== 'undefined' ? localStorage.getItem('job_tracker_custom_local_dir') : undefined);
    if (typeof window !== 'undefined' && (window as any).__TAURI__?.core?.invoke) {
      try {
        if (target) {
          await (window as any).__TAURI__.core.invoke('open_in_file_manager', { path: target });
          return { ok: 1, opened: true, path: target };
        } else {
          const opened = await (window as any).__TAURI__.core.invoke('open_data_folder');
          return { ok: 1, opened: true, path: opened };
        }
      } catch (err) {
        console.warn('Tauri open folder fallback:', err);
      }
    }

    try {
      const res = await fetch(`${API_BASE}/storage/open-local-folder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ folderPath: target }),
      });
      if (!res.ok) throw new Error('Failed to open folder');
      return res.json();
    } catch (e: any) {
      console.warn('Backend open-local-folder unreachable:', e);
      return { ok: 1, opened: false, path: target || '' };
    }
  },

  async openLocalFile(filePath: string): Promise<boolean> {
    if (typeof window !== 'undefined' && (window as any).__TAURI__?.core?.invoke) {
      try {
        await (window as any).__TAURI__.core.invoke('open_file', { path: filePath });
        return true;
      } catch (err) {
        console.warn('Tauri open_file fallback to open_in_file_manager:', err);
        try {
          await (window as any).__TAURI__.core.invoke('open_in_file_manager', { path: filePath });
          return true;
        } catch (_) {}
      }
    }
    return false;
  },

  async setLocalFolder(folderPath: string): Promise<{ ok: number; folderPath: string; message: string }> {
    const trimmed = String(folderPath).trim();
    if (typeof window !== 'undefined') {
      localStorage.setItem('job_tracker_custom_local_dir', trimmed);
    }

    if (typeof window !== 'undefined' && (window as any).__TAURI__?.core?.invoke) {
      try {
        await (window as any).__TAURI__.core.invoke('set_custom_storage_dir', { path: trimmed });
      } catch (err) {
        console.warn('Tauri set_custom_storage_dir note:', err);
      }
    }

    try {
      const res = await fetch(`${API_BASE}/storage/set-local-folder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ folderPath: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) return data;
    } catch (_) {}

    return { ok: 1, folderPath: trimmed, message: 'Local storage folder updated successfully' };
  },

  async syncDocuments(
    applications: Array<{ id: number; company: string; resume_path?: string | null; cover_letter_path?: string | null }>,
    onProgress?: (progress: { current: number; total: number; message: string }) => void
  ): Promise<{ uploadedToDrive: number; downloadedToLocal: number; errors: string[] }> {
    const isDriveLink = (p?: string | null) => !!p && (/drive\.google\.com|docs\.google\.com/i.test(p));
    const isLocalPath = (p?: string | null) => !!p && !isDriveLink(p) && p.trim().toUpperCase() !== 'NA';

    const errors: string[] = [];
    let uploadedToDrive = 0;
    let downloadedToLocal = 0;

    const toUploadToDrive: Array<{ appId: number; docType: 'resume' | 'cover_letter'; path: string; company: string }> = [];
    const toDownloadToLocal: Array<{ appId: number; docType: 'resume' | 'cover_letter'; path: string; company: string }> = [];

    for (const app of applications) {
      if (isLocalPath(app.resume_path)) {
        toUploadToDrive.push({ appId: app.id, docType: 'resume', path: app.resume_path!, company: app.company });
      } else if (isDriveLink(app.resume_path) && typeof window !== 'undefined' && (window as any).__TAURI__?.core?.invoke) {
        toDownloadToLocal.push({ appId: app.id, docType: 'resume', path: app.resume_path!, company: app.company });
      }

      if (isLocalPath(app.cover_letter_path)) {
        toUploadToDrive.push({ appId: app.id, docType: 'cover_letter', path: app.cover_letter_path!, company: app.company });
      } else if (isDriveLink(app.cover_letter_path) && typeof window !== 'undefined' && (window as any).__TAURI__?.core?.invoke) {
        toDownloadToLocal.push({ appId: app.id, docType: 'cover_letter', path: app.cover_letter_path!, company: app.company });
      }
    }

    const totalTasks = toUploadToDrive.length + toDownloadToLocal.length;
    let completed = 0;

    // 1. Upload local files to Google Drive
    for (const task of toUploadToDrive) {
      completed++;
      onProgress?.({
        current: completed,
        total: totalTasks,
        message: `Uploading ${task.company} ${task.docType} to Google Drive...`,
      });

      try {
        let file: File | null = null;
        if (typeof window !== 'undefined' && (window as any).__TAURI__?.core?.invoke) {
          const res = await (window as any).__TAURI__.core.invoke('read_local_document', { path: task.path });
          if (res && res.bytes) {
            const blob = new Blob([new Uint8Array(res.bytes)], { type: 'application/pdf' });
            file = new File([blob], res.filename || 'document.pdf', { type: 'application/pdf' });
          }
        }

        if (file) {
          const driveRes = await this.uploadDocument(file, task.docType, task.appId, 'g_drive');
          if (driveRes && (driveRes.fullPath || driveRes.path)) {
            const updatedPath = driveRes.fullPath || driveRes.path;
            await this.updateApplication(task.appId, {
              [task.docType === 'resume' ? 'resume_path' : 'cover_letter_path']: updatedPath,
            });
            uploadedToDrive++;
          }
        }
      } catch (err: any) {
        console.warn(`[Sync] Failed to mirror ${task.path} to Drive:`, err);
        errors.push(`${task.company}: ${err.message || 'Upload failed'}`);
      }
    }

    // 2. Download Drive files to Local Storage (if in Tauri)
    const customLocalDir = typeof window !== 'undefined' ? localStorage.getItem('job_tracker_custom_local_dir') : null;
    for (const task of toDownloadToLocal) {
      completed++;
      onProgress?.({
        current: completed,
        total: totalTasks,
        message: `Downloading ${task.company} ${task.docType} to Local PC...`,
      });

      try {
        const blob = await this.fetchDocumentBlob(task.path);
        const buffer = await blob.arrayBuffer();
        const bytes = Array.from(new Uint8Array(buffer));
        const rawName = `${task.company.replace(/[^a-zA-Z0-9_-]/g, '_')}_${task.docType}.pdf`;
        const tauriRes = await (window as any).__TAURI__.core.invoke('save_uploaded_document', {
          folderPath: customLocalDir || null,
          docType: task.docType,
          fileName: rawName,
          bytes,
        });
        if (tauriRes && tauriRes.path) {
          downloadedToLocal++;
        }
      } catch (err: any) {
        console.warn(`[Sync] Failed to download ${task.path} locally:`, err);
        errors.push(`${task.company}: ${err.message || 'Download failed'}`);
      }
    }

    return { uploadedToDrive, downloadedToLocal, errors };
  },
};

