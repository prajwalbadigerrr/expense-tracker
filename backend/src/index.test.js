/**
 * Integration tests — uses an in-memory SQLite DB so nothing is persisted.
 * Run: npm test
 */
import request from "supertest";
import { jest } from "@jest/globals";

// Point DB to in-memory before importing app
process.env.DB_PATH = ":memory:";

const { default: app } = await import("./app.js"); // see note below

const BASE = { amount: "500.50", category: "Food", description: "Lunch", date: "2024-04-01" };

describe("POST /expenses", () => {
  test("creates an expense", async () => {
    const res = await request(app)
      .post("/expenses")
      .set("X-Idempotency-Key", "test-key-1")
      .send(BASE);
    expect(res.status).toBe(201);
    expect(res.body.amount).toBe("500.50");
    expect(res.body.category).toBe("Food");
  });

  test("returns same expense on retry (idempotency)", async () => {
    const key = "test-key-2";
    const r1 = await request(app).post("/expenses").set("X-Idempotency-Key", key).send(BASE);
    const r2 = await request(app).post("/expenses").set("X-Idempotency-Key", key).send(BASE);
    expect(r1.body.id).toBe(r2.body.id);
    expect(r2.status).toBe(200);
  });

  test("rejects negative amount", async () => {
    const res = await request(app)
      .post("/expenses")
      .set("X-Idempotency-Key", "test-key-3")
      .send({ ...BASE, amount: "-100" });
    expect(res.status).toBe(422);
  });

  test("rejects missing category", async () => {
    const res = await request(app)
      .post("/expenses")
      .set("X-Idempotency-Key", "test-key-4")
      .send({ ...BASE, category: "" });
    expect(res.status).toBe(422);
  });

  test("returns 400 without idempotency key", async () => {
    const res = await request(app).post("/expenses").send(BASE);
    expect(res.status).toBe(400);
  });
});

describe("GET /expenses", () => {
  test("returns list", async () => {
    const res = await request(app).get("/expenses");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("filters by category", async () => {
    await request(app)
      .post("/expenses")
      .set("X-Idempotency-Key", "cat-test-1")
      .send({ ...BASE, category: "Travel" });

    const res = await request(app).get("/expenses?category=Travel");
    expect(res.body.every((e) => e.category === "Travel")).toBe(true);
  });
});