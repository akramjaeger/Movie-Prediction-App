/**
 * Client-side session helpers
 *
 * The auth cookie is httpOnly (set by the server), so it cannot be read via
 * document.cookie. Instead, the client calls /api/auth/me which validates the
 * cookie server-side and returns the current user.
 */

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

let cachedUser: CurrentUser | null = null;
let fetchPromise: Promise<CurrentUser | null> | null = null;

/**
 * Fetch the current user from the server (validates the httpOnly cookie).
 * Results are cached for the lifetime of the page to avoid redundant requests.
 */
export async function fetchCurrentUser(): Promise<CurrentUser | null> {
  if (cachedUser !== null) return cachedUser;
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store", credentials: "include" });
      if (!res.ok) {
        cachedUser = null;
        return null;
      }
      const json = await res.json();
      if (json.success && json.data?.user) {
        cachedUser = json.data.user;
        return cachedUser;
      }
      cachedUser = null;
      return null;
    } catch {
      cachedUser = null;
      return null;
    }
  })();

  return fetchPromise;
}

/**
 * Log out: call the server to clear the cookie, then reset local state.
 */
export async function logout(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
  } catch {}
  cachedUser = null;
  fetchPromise = null;
}

export function setCachedUser(user: CurrentUser | null): void {
  cachedUser = user;
}
