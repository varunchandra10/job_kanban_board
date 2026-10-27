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

  async googleAuth(profile: { email: string; name?: string; picture?: string; sub?: string }): Promise<{ ok: number; token: string; user: any }> {
    const res = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile }),
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

  async pollDesktopGoogleAuth(sessionId: string): Promise<{ ok: number; ready: boolean; token?: string; user?: any }> {
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
    appId?: number
  ): Promise<{
    ok: number;
    fullPath: string;
    path: string;
    relativePath?: string;
    name: string;
    size?: number;
    isGoogleDrive?: boolean;
    fileId?: string;
    rootFolderId?: string;
    folderId?: string;
  }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
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
    return data;
  },

  getDocumentUrl(filePath: string): string {
    if (!filePath) return '';
    if (/^https?:\/\//i.test(filePath)) return filePath;
    if (filePath.startsWith('/api/')) return getApiEndpoint(filePath);
    return `${API_BASE}/file-content?path=${encodeURIComponent(filePath)}`;
  },
};

