import { useState, useEffect, useCallback } from "react";
import ExpenseForm from "./components/ExpenseForm";
import ExpenseTable from "./components/ExpenseTable";
import FilterBar from "./components/FilterBar";
import SummaryBar from "./components/SummaryBar";
import { fetchExpenses } from "./api";

export default function App() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filterCategory, setFilterCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchExpenses({ category: filterCategory });
      setExpenses(data);
      setCategories((prev) => {
        const all = Array.from(new Set([...prev, ...data.map((e) => e.category)])).sort();
        return all;
      });
    } catch (err) {
      setError("Failed to load expenses. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [filterCategory]);

  useEffect(() => { loadExpenses(); }, [loadExpenses]);

  const handleAdded = (newExpense) => {
    loadExpenses();
    setCategories((prev) => Array.from(new Set([...prev, newExpense.category])).sort());
  };

  return (
    <div className="app">
      <header><h1>💸 Expense Tracker</h1></header>
      <main>
        <section className="card form-section">
          <h2>Add Expense</h2>
          <ExpenseForm categories={categories} onAdded={handleAdded} />
        </section>
        <section className="card list-section">
          <div className="list-header">
            <h2>Expenses</h2>
            <FilterBar categories={categories} value={filterCategory} onChange={setFilterCategory} />
          </div>
          {error && <p className="error-msg">{error}</p>}
          {loading && <p className="loading-msg">Loading…</p>}
          {!loading && !error && (
            <>
              <SummaryBar expenses={expenses} filterCategory={filterCategory} />
              <ExpenseTable expenses={expenses} />
            </>
          )}
        </section>
      </main>
    </div>
  );
}