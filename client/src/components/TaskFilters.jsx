export default function TaskFilters({ filters, onChange }) {
  const handleChange = (event) => {
    const { name, value } = event.target;
    onChange((current) => ({ ...current, [name]: value }));
  };

  return (
    <section className="panel filters-panel">
      <div className="panel-heading compact">
        <div>
          <p className="eyebrow">View controls</p>
          <h2>Filters</h2>
        </div>
      </div>

      <div className="filters">
        <label>
          Search
          <input
            name="search"
            value={filters.search}
            onChange={handleChange}
            placeholder="Search title or description"
          />
        </label>

        <label>
          Status
          <select name="status" value={filters.status} onChange={handleChange}>
            <option value="all">All</option>
            <option value="todo">To do</option>
            <option value="in-progress">In progress</option>
            <option value="done">Done</option>
          </select>
        </label>
      </div>
    </section>
  );
}
