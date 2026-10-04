import { apiFetch } from "../../utils/api";

// Thin wrappers around apiFetch for every /api/partner/* endpoint, so the
// page components stay focused on UI instead of request plumbing.

export const sendPartnerOtp = (email) =>
  apiFetch("/api/partner/send-otp", { method: "POST", body: { email } });

export const verifyPartnerOtp = (email, otp) =>
  apiFetch("/api/partner/verify-otp", { method: "POST", body: { email, otp } });

export const registerPartner = (payload) =>
  apiFetch("/api/partner/register", { method: "POST", body: payload });

export const loginPartner = (identifier, password) =>
  apiFetch("/api/partner/login", { method: "POST", body: { identifier, password } });

export const getPartnerDashboard = (signal) =>
  apiFetch("/api/partner/dashboard", { auth: true, signal });

export const getPartnerProfile = (signal) =>
  apiFetch("/api/partner/profile", { auth: true, signal });

export const updatePartnerProfile = (payload) =>
  apiFetch("/api/partner/profile", { method: "PATCH", body: payload, auth: true });

export const getPartnerJobs = (status, signal) =>
  apiFetch(`/api/partner/jobs${status ? `?status=${status}` : ""}`, { auth: true, signal });

export const getPartnerJobById = (id, signal) =>
  apiFetch(`/api/partner/jobs/${id}`, { auth: true, signal });

export const acceptPartnerJob = (id) =>
  apiFetch(`/api/partner/jobs/${id}/accept`, { method: "POST", auth: true });

export const rejectPartnerJob = (id) =>
  apiFetch(`/api/partner/jobs/${id}/reject`, { method: "POST", auth: true });

export const updatePartnerJobStatus = (id, action, amount) =>
  apiFetch(`/api/partner/jobs/${id}/status`, {
    method: "POST",
    body: { action, ...(amount !== undefined ? { amount } : {}) },
    auth: true,
  });

export const getPartnerEarnings = (signal) =>
  apiFetch("/api/partner/earnings", { auth: true, signal });

export const getServices = (signal) => apiFetch("/api/services", { signal });