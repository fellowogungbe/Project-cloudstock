import { config } from "../config.js";

// Shared HTTP helper for real microservice API mode.
export async function request(path, options = {}) {
  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(`API request failed (${response.status})${message ? `: ${message}` : ""}`);
  }
  if (response.status === 204) return null;
  return response.json();
}
