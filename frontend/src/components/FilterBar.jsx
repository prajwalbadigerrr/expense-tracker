export default function FilterBar({ categories, value, onChange }) {
  return (
    <div className="filter-bar">
      <label>Filter by category:</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">All categories</option>
        {categories.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
    </div>
  );
}