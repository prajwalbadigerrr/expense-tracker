import { useState, useRef } from "react";
import { createExpense } from "../api";

const PRESET_CATEGORIES = ["Food", "Transport", "Housing", "Healthcare", "Shopping", "Entertainment", "Other"];
const today = () => new Date().toISOString().slice(0, 10);

export default function ExpenseForm({ categories, onAdded }) {
  const [form, setForm] = useState({ amount: "", category: "", description: "", date: today() });
  const [customCategory, setCustomCategory] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Stable idempotency key per form fill — regenerated only on success
  const idempotencyKey = useRef(crypto.randomUUID());

  const allCategories = Array.from(new Set([...PRESET_CATEGORIES, ...categories])).sort();

  const validate = () => {
    const e = {};
    const amount = parseFloat(form.amount);
    if (!form.amount) e.amount = "Amount is required";
    else if (isNaN(amount) || amount <= 0) e.amount = "Must be a positive number";
    else if (!/^\d+(\.\d{1,2})?$/.test(form.amount)) e.amount = "Max 2 decimal places";

    const cat = form.category === "__custom__" ? customCategory.trim() : form.category;
    if (!cat) e.category = "Category is required";

    if (!form.description.trim()) e.description = "Description is required";
    if (!form.date) e.date = "Date is required";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    const category = form.category === "__custom__" ? customCategory.trim() : form.category;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const expense = await createExpense(
        { amount: form.amount, category, description: form.description.trim(), date: form.date },
        idempotencyKey.current
      );
      onAdded(expense);
      // Reset form + generate new idempotency key
      setForm({ amount: "", category: "", description: "", date: today() });
      setCustomCategory("");
      idempotencyKey.current = crypto.randomUUID();
    } catch (err) {
      const msgs = err.data?.errors;
      setSubmitError(msgs ? msgs.join(", ") : "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const field = (key) => ({
    value: form[key],
    onChange: (e) => setForm((p) => ({ ...p, [key]: e.target.value })),
  });

  return (
    <div className="expense-form">
      <div className="form-row">
        <div className="form-group">
          <label>Amount (₹)</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            {...field("amount")}
            className={errors.amount ? "input-error" : ""}
          />
          {errors.amount && <span className="field-error">{errors.amount}</span>}
        </div>

        <div className="form-group">
          <label>Category</label>
          <select
            {...field("category")}
            className={errors.category ? "input-error" : ""}
          >
            <option value="">Select…</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
            <option value="__custom__">+ Custom…</option>
          </select>
          {form.category === "__custom__" && (
            <input
              type="text"
              placeholder="Enter category"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              className={errors.category ? "input-error" : ""}
              style={{ marginTop: 6 }}
            />
          )}
          {errors.category && <span className="field-error">{errors.category}</span>}
        </div>

        <div className="form-group">
          <label>Date</label>
          <input
            type="date"
            max={today()}
            {...field("date")}
            className={errors.date ? "input-error" : ""}
          />
          {errors.date && <span className="field-error">{errors.date}</span>}
        </div>
      </div>

      <div className="form-group">
        <label>Description</label>
        <input
          type="text"
          placeholder="What was this for?"
          maxLength={200}
          {...field("description")}
          className={errors.description ? "input-error" : ""}
        />
        {errors.description && <span className="field-error">{errors.description}</span>}
      </div>

      {submitError && <p className="error-msg">{submitError}</p>}

      <button
        className="btn-primary"
        onClick={handleSubmit}
        disabled={submitting}
      >
        {submitting ? "Saving…" : "Add Expense"}
      </button>
    </div>
  );
}