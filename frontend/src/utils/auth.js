import { useMemo, useSyncExternalStore } from "react";

// ---------------------------------------------------------------------------
// Login session (JWT + user), kept in localStorage.
//
// Everything that reads or changes the session goes through this file, so the
// UI (navbar, mobile menu, protected pages) updates the moment the user logs
// in or out — no page refresh needed.
// ---------------------------------------------------------------------------

const TOKEN_KEY = "rm_token";
const USER_KEY = "rm_user";
const CHANGE_EVENT = "rm-auth-change";

const readItem = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const notify = () => window.dispatchEvent(new Event(CHANGE_EVENT));

export const getToken = () => readItem(TOKEN_KEY);

export const getStoredUser = () => {
  try {
    const raw = readItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setSession = (token, user) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    /* storage blocked — the user will simply have to log in again */
  }
  notify();
};

export const clearSession = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    /* ignore */
  }
  notify();
};

const subscribe = (callback) => {
  window.addEventListener(CHANGE_EVENT, callback);
  // "storage" fires when ANOTHER tab logs in/out
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
};

// React hook: { isLoggedIn, token, user } — re-renders on login/logout.
export function useAuth() {
  const token = useSyncExternalStore(subscribe, getToken, () => null);
  const rawUser = useSyncExternalStore(
    subscribe,
    () => readItem(USER_KEY),
    () => null
  );

  const user = useMemo(() => {
    try {
      return rawUser ? JSON.parse(rawUser) : null;
    } catch {
      return null;
    }
  }, [rawUser]);

  return { isLoggedIn: Boolean(token), token, user };
}

// True when the logged-in account is a RepairMithra partner (technician).
export const isTechnician = (user) => user?.role === "technician";