export default function SummaryBar({ expenses, filterCategory }) {
  const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const byCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + parseFloat(e.amount);
    return acc;
  }, {});
  const fmt = (n) => "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="summary-bar">
      <span className="total">
        Total{filterCategory ? ` · ${filterCategory}` : ""}: <strong>{fmt(total)}</strong>
        <span className="count"> ({expenses.length} {expenses.length === 1 ? "entry" : "entries"})</span>
      </span>
      {!filterCategory && Object.keys(byCategory).length > 1 && (
        <div className="category-breakdown">
          {Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
            <span key={cat} className="cat-chip">{cat}: {fmt(amt)}</span>
          ))}
        </div>
      )}
    </div>
  );
}