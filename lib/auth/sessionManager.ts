// Session Management Utility
// Handles session validation, invalidation, auto-logout, and expiration messaging.

const SESSION_EXPIRED_STORAGE_KEY = 'seekers_session_expired';
const TOKEN_KEY = 'seekers_auth_token';
const USER_KEY = 'seekers_auth_user';

let isHandlingExpiry = false;

/**
 * Checks whether an error message or status indicates an invalid or expired user session.
 */
export function isSessionExpiredMessage(message: string, status?: number): boolean {
  if (!message && !status) return false;
  
  const normalized = (message || '').toLowerCase().trim();
  
  if (
    normalized === 'user session invalid or expired' ||
    normalized.includes('user session invalid or expired') ||
    normalized.includes('session invalid or expired') ||
    normalized.includes('session invalid') ||
    normalized.includes('session expired') ||
    normalized.includes('jwt expired') ||
    normalized.includes('invalid token') ||
    normalized.includes('token expired')
  ) {
    return true;
  }

  // 401 Unauthorized with auth-related messages
  if (status === 401 && (
    normalized.includes('unauthorized') ||
    normalized.includes('no authorization token') ||
    normalized.includes('token') ||
    normalized.includes('session')
  )) {
    return true;
  }

  return false;
}

/**
 * Handles automatic logout, clears cached operator tokens, dispatches events,
 * and redirects to the login screen with an expired session warning.
 */
export function handleSessionExpired(reason: string = 'User session invalid or expired'): void {
  if (typeof window === 'undefined') return;

  // Deduplicate simultaneous expired calls (e.g. parallel requests failing at once)
  if (isHandlingExpiry) return;
  isHandlingExpiry = true;
  setTimeout(() => {
    isHandlingExpiry = false;
  }, 2000);

  console.warn(`[Auth Session] Expired or invalid session detected: "${reason}". Logging out...`);

  // 1. Clear credentials
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch (e) {
    console.error('Error clearing localStorage auth keys:', e);
  }

  // 2. Set session expired notice for login screen
  try {
    sessionStorage.setItem(
      SESSION_EXPIRED_STORAGE_KEY,
      reason === 'User session invalid or expired'
        ? 'Your session is invalid or has expired. Please log in again to continue.'
        : reason
    );
  } catch (e) {
    console.error('Error setting sessionStorage expired key:', e);
  }

  // 3. Dispatch system events
  window.dispatchEvent(
    new CustomEvent('seekers_session_expired', {
      detail: { message: reason },
    })
  );
  window.dispatchEvent(new Event('seekers_auth_changed'));

  // 4. Redirect to login if not already on the login page
  const currentPath = window.location.pathname;
  if (!currentPath.startsWith('/login')) {
    window.location.href = '/login';
  }
}

/**
 * Retrieves and clears any pending session expired message for display on the login page.
 */
export function consumeSessionExpiredMessage(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const msg = sessionStorage.getItem(SESSION_EXPIRED_STORAGE_KEY);
    if (msg) {
      sessionStorage.removeItem(SESSION_EXPIRED_STORAGE_KEY);
      return msg;
    }
  } catch {}
  return null;
}
