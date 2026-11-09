import { AI_API_URL } from "../config/constants.js";

/** Firebase ID token authenticates the request; the backend checks admin access. */
export function requestDesignEvaluation(token, payload) {
  return fetch(`${AI_API_URL}/api/evaluate-design`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}
