/**
 * Utility for Web Push Notifications on Mobile (Android & iOS PWA) and Desktop
 */

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Standardized authenticated JWT token resolver for push notifications.
 * Uses 'auth_token' with legacy fallback to 'job_tracker_token'.
 */
function getAuthToken(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem('auth_token') || localStorage.getItem('job_tracker_token');
}

/**
 * Resolves active authenticated user ID from input, profile cache, or JWT payload.
 */
function resolveUserId(fallback?: string): string | undefined {
  if (fallback) return String(fallback);
  if (typeof localStorage === 'undefined') return undefined;

  // 1. Check auth_user profile object in storage
  const rawUser = localStorage.getItem('auth_user');
  if (rawUser) {
    try {
      const user = JSON.parse(rawUser);
      if (user?.id) return String(user.id);
    } catch (_) {}
  }

  // 2. Fallback: decode JWT payload from auth_token
  const token = getAuthToken();
  if (token && token.includes('.')) {
    try {
      const parts = token.split('.');
      if (parts[1]) {
        let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
          base64 += '=';
        }
        const jsonPayload = decodeURIComponent(
          window.atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const decoded = JSON.parse(jsonPayload);
        if (decoded?.id) return String(decoded.id);
      }
    } catch (_) {}
  }
  return undefined;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    return reg;
  } catch (err) {
    console.warn('[SW Registration Error]:', err);
    return null;
  }
}

export async function isPushSupported(): Promise<boolean> {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (!(await isPushSupported())) return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    return await reg.pushManager.getSubscription();
  } catch (_) {
    return null;
  }
}

export async function subscribeToPush(userId?: string): Promise<{ success: boolean; error?: string }> {
  if (!(await isPushSupported())) {
    return { success: false, error: 'Push notifications are not supported by this browser' };
  }

  try {
    // 1. Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, error: 'Notification permission denied' };
    }

    // 2. Fetch VAPID public key
    const res = await fetch('/api/notifications/vapid-public-key');
    if (!res.ok) {
      throw new Error('Failed to retrieve notification public key');
    }
    const { publicKey } = await res.json();
    if (!publicKey) {
      throw new Error('VAPID public key missing from server');
    }

    // 3. Register service worker and subscribe
    const reg = await navigator.serviceWorker.ready;
    let subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as BufferSource
      });
    }

    // 4. Send subscription to server
    const token = getAuthToken();
    const effectiveUserId = resolveUserId(userId);
    const saveRes = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        userId: effectiveUserId,
        subscription: subscription.toJSON(),
        userAgent: navigator.userAgent
      })
    });

    if (!saveRes.ok) {
      throw new Error('Failed to store push subscription on server');
    }

    localStorage.setItem('job_tracker_push_active', '1');
    return { success: true };
  } catch (err: any) {
    console.error('[Push Subscription Error]:', err);
    return { success: false, error: err.message || 'Subscription failed' };
  }
}

export async function unsubscribeFromPush(userId?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();
    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();

      const token = getAuthToken();
      const effectiveUserId = resolveUserId(userId);
      await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ userId: effectiveUserId, endpoint })
      }).catch(() => {});
    }

    localStorage.removeItem('job_tracker_push_active');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Unsubscribe failed' };
  }
}

export async function checkServerPushStatus(userId?: string): Promise<{ hasPush: boolean; deviceCount: number }> {
  try {
    const token = getAuthToken();
    const effectiveUserId = resolveUserId(userId);
    const res = await fetch(`/api/notifications/status${effectiveUserId ? `?userId=${encodeURIComponent(effectiveUserId)}` : ''}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (_) {}
  return { hasPush: false, deviceCount: 0 };
}
