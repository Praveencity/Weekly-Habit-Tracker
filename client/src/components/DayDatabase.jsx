import { formatDateLabel } from "../utils/date";

const createBlankItem = (order = 0) => ({
  _id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${order}-${Math.random()}`,
  title: "",
  type: "Task",
  notes: "",
  done: false,
  order,
});

export default function DayDatabase({ dateKey, data, saving, onChange, onSave }) {
  const items = Array.isArray(data.items) ? data.items : [];

  const updateItem = (itemId, field, value) => {
    onChange({
      ...data,
      items: items.map((item) => (item._id === itemId ? { ...item, [field]: value } : item)),
    });
  };

  const addRow = () => {
    onChange({
      ...data,
      items: [...items, createBlankItem(items.length)],
    });
  };

  const deleteRow = (itemId) => {
    onChange({
      ...data,
      items: items.filter((item) => item._id !== itemId),
    });
  };

  return (
    <section className="panel database-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Daily database</p>
          <h2>{formatDateLabel(dateKey)}</h2>
          <p className="muted-copy">Notion-like table for your custom entries.</p>
        </div>
        <button type="button" className="primary-button" onClick={onSave} disabled={saving}>
          {saving ? "Saving..." : "Save database"}
        </button>
      </div>

      <label className="planner-title-field">
        Database title
        <input
          value={data.title || ""}
          onChange={(event) => onChange({ ...data, title: event.target.value })}
          placeholder="Example: Monday Brain Dump"
        />
      </label>

      <div className="database-table-head">
        <span>Name</span>
        <span>Type</span>
        <span>Status</span>
        <span>Notes</span>
        <span>Action</span>
      </div>

      <div className="database-rows">
        {items.length === 0 ? <p className="empty-copy">No rows yet. Add one to start your day database.</p> : null}
        {items.map((item) => (
          <div key={item._id} className="database-row">
            <input
              value={item.title || ""}
              onChange={(event) => updateItem(item._id, "title", event.target.value)}
              placeholder="Entry name"
            />
            <input
              value={item.type || "Task"}
              onChange={(event) => updateItem(item._id, "type", event.target.value)}
              placeholder="Task / Note / Idea"
            />
            <label className="database-done">
              <input
                type="checkbox"
                checked={Boolean(item.done)}
                onChange={(event) => updateItem(item._id, "done", event.target.checked)}
              />
              Done
            </label>
            <input
              value={item.notes || ""}
              onChange={(event) => updateItem(item._id, "notes", event.target.value)}
              placeholder="Notes"
            />
            <button type="button" className="ghost-button danger" onClick={() => deleteRow(item._id)}>
              Delete
            </button>
          </div>
        ))}
      </div>

      <button type="button" className="ghost-button add-task-button" onClick={addRow}>
        Add row
      </button>
    </section>
  );
}
