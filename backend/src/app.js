import express from "express";
import cors from "cors";
import { randomUUID } from "crypto";
import initSqlJs from "sql.js";
import fs from "fs";
import path from "path";

const DB_PATH = process.env.DB_PATH || "expenses.db";

// Load or create DB file
const SQL = await initSqlJs();
let db;
if (fs.existsSync(DB_PATH)) {
  const fileBuffer = fs.readFileSync(DB_PATH);
  db = new SQL.Database(fileBuffer);
} else {
  db = new SQL.Database();
}

// Save DB to disk helper
function saveDb() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// Setup tables
db.run(`
  CREATE TABLE IF NOT EXISTS expenses (
    id            TEXT PRIMARY KEY,
    amount_paise  INTEGER NOT NULL CHECK(amount_paise > 0),
    category      TEXT NOT NULL,
    description   TEXT NOT NULL,
    date          TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);
db.run(`
  CREATE TABLE IF NOT EXISTS idempotency_keys (
    key         TEXT PRIMARY KEY,
    expense_id  TEXT NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);
db.run(`CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);`);
db.run(`CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);`);
saveDb();

const app = express();
app.use(cors());
app.use(express.json());

// Helper: run SELECT and return rows as objects
function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function queryOne(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows[0] || null;
}

// POST /expenses
app.post("/expenses", (req, res) => {
  const key = req.headers["x-idempotency-key"];
  if (!key) return res.status(400).json({ error: "X-Idempotency-Key header required" });

  const existing = queryOne("SELECT expense_id FROM idempotency_keys WHERE key = ?", [key]);
  if (existing) {
    const expense = queryOne("SELECT * FROM expenses WHERE id = ?", [existing.expense_id]);
    return res.status(200).json(fmt(expense));
  }

  const { amount, category, description, date } = req.body;
  const errors = [];
  const parsed = parseFloat(amount);
  if (amount === undefined || amount === "" || isNaN(parsed) || parsed <= 0)
    errors.push("amount must be a positive number");
  if (!category?.trim()) errors.push("category is required");
  if (!description?.trim()) errors.push("description is required");
  if (!date) errors.push("date is required");
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) errors.push("date must be YYYY-MM-DD");
  if (errors.length) return res.status(422).json({ errors });

  const amountPaise = Math.round(parsed * 100);
  const id = randomUUID();
  const now = new Date().toISOString().replace("T", " ").substring(0, 19);

  db.run(
    `INSERT INTO expenses (id, amount_paise, category, description, date, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [id, amountPaise, category.trim(), description.trim(), date, now]
  );
  db.run(`INSERT INTO idempotency_keys (key, expense_id, created_at) VALUES (?, ?, ?)`, [key, id, now]);
  saveDb();

  const expense = queryOne("SELECT * FROM expenses WHERE id = ?", [id]);
  return res.status(201).json(fmt(expense));
});

// GET /expenses
app.get("/expenses", (req, res) => {
  const { category } = req.query;
  let q = "SELECT * FROM expenses WHERE 1=1";
  const p = [];
  if (category?.trim()) { q += " AND category = ?"; p.push(category.trim()); }
  q += " ORDER BY date DESC, created_at DESC";
  res.json(queryAll(q, p).map(fmt));
});

// GET /expenses/categories
app.get("/expenses/categories", (_req, res) => {
  res.json(queryAll("SELECT DISTINCT category FROM expenses ORDER BY category").map(r => r.category));
});

// Health check
app.get("/health", (_req, res) => res.json({ status: "ok" }));

function fmt(row) {
  return {
    id: row.id,
    amount: (row.amount_paise / 100).toFixed(2),
    amount_paise: row.amount_paise,
    category: row.category,
    description: row.description,
    date: row.date,
    created_at: row.created_at,
  };
}

export default app;