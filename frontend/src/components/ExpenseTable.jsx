export default function ExpenseTable({ expenses }) {
  const fmt = (n) => "₹" + parseFloat(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (!expenses.length) return <p className="empty-msg">No expenses yet. Add one above!</p>;

  return (
    <div className="table-wrapper">
      <table className="expense-table">
        <thead>
          <tr>
            <th>Date</th><th>Category</th><th>Description</th><th className="amount-col">Amount</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((e) => (
            <tr key={e.id}>
              <td className="date-col">{e.date}</td>
              <td><span className="badge">{e.category}</span></td>
              <td className="desc-col">{e.description}</td>
              <td className="amount-col">{fmt(e.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}