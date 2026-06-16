const API_BASE = "http://127.0.0.1:8000/api/v1";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "API request failed");
  }
  return response.json();
}

export const api = {
  getDashboard: () => request("/analytics/dashboard"),
  getEvaluation: () => request("/analytics/evaluation"),
  simulatePayment: (payload) =>
    request("/transactions/simulate", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getHistory: () => request("/transactions/history?limit=100"),
  faceVerify: (transactionId) => request(`/transactions/${transactionId}/face-verify`, { method: "POST" }),
  deleteTransaction: (transactionId) => request(`/transactions/${transactionId}`, { method: "DELETE" }),
};
