# Expense Tracker

A full-stack personal expense tracker built with production-quality patterns.

**Live app:** https://your-app.vercel.app  
**API:** https://expense-tracker-backend-h9ud.onrender.com

## Stack

| Layer | Choice |
|---|---|
| Backend | Node.js + Express |
| Database | SQLite (sql.js) |
| Frontend | React + Vite |
| Deploy (API) | Render |
| Deploy (UI) | Vercel |

## Features
- Add expenses with category, description, date
- Filter by category
- Summary bar with totals
- Idempotency keys to prevent duplicate submissions
- Money stored as integer paise (no floating point errors)
- Client + server side validation