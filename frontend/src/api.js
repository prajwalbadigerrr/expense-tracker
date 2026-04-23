const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export async function fetchExpenses({ category } = {}) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  const res = await fetch(`${BASE_URL}/expenses?${params}`);
  if (!res.ok) throw new Error("GET /expenses failed");
  return res.json();
}

export async function createExpense(payload, idempotencyKey) {
  const res = await fetch(`${BASE_URL}/expenses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw Object.assign(new Error("POST /expenses failed"), { data });
  return data;
}