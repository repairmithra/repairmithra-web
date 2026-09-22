import { clearSession, getToken } from "./auth";

// In development, "/api/..." is proxied to the Express server (see
// vite.config.js), so VITE_API_URL should be left EMPTY. For a production
// build served from another domain, set VITE_API_URL to the backend's address
// (e.g. https://api.repairmithra.com) in frontend/.env.
//
// Every request path already starts with "/api", so a trailing slash or a
// trailing "/api" on the setting is removed — otherwise requests would go to
// "/api/api/..." and fail with 404.
const normalizeBase = (value) =>
  (value || "").trim().replace(/\/+$/, "").replace(/\/api$/i, "");

export const API_BASE = normalizeBase(import.meta.env.VITE_API_URL);

export class ApiError extends Error {
  constructor(message, status = 0, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status; // HTTP status; 0 = could not reach the server
    this.data = data;
  }
}

// True when the server rejected our login token (missing/expired/invalid)
export const isAuthError = (error) =>
  error instanceof ApiError && error.status === 401;

// ---------------------------------------------------------------------------
// apiFetch("/api/services")
// apiFetch("/api/bookings", { method: "POST", body: {...}, auth: true })
//
// • Sends JSON and parses the JSON reply.
// • auth: true adds the "Authorization: Bearer <token>" header. If the server
//   answers 401 the stored session is cleared (the token has expired).
// • Throws ApiError with a user-friendly message on any failure.
// ---------------------------------------------------------------------------
export async function apiFetch(
  path,
  { method = "GET", body, auth = false, signal } = {}
) {
  const headers = {};

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = getToken();

    if (!token) {
      throw new ApiError("Please log in to continue.", 401);
    }

    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") throw error;

    throw new ApiError(
      "Could not reach the server. Please check your connection and try again.",
      0
    );
  }

  let data = null;

  try {
    data = await response.json();
  } catch {
    /* body was not JSON */
  }

  if (!response.ok || data?.success === false) {
    if (response.status === 401 && auth) {
      clearSession();
    }

    throw new ApiError(
      data?.message || `Something went wrong (error ${response.status}).`,
      response.status,
      data
    );
  }

  if (data === null) {
    throw new ApiError("Unexpected response from the server.", response.status);
  }

  return data;
}