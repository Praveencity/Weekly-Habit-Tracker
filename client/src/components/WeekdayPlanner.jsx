import WeekdayTabs from "./WeekdayTabs";
import { weekdayOrder } from "../utils/date";
import { Copy, Plus, Save, Clock, FileText, ListTodo, Tag, Trash2, ArrowRight } from "lucide-react";

const createBlankTask = (order = 0) => ({
  _id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${order}-${Math.random()}`,
  title: "",
  type: "General",
  time: "",
  startTime: "",
  endTime: "",
  notes: "",
  order,
});

const toTimeInputValue = (value) => {
  const time = String(value || "").trim();
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time) ? time : "";
};

export default function WeekdayPlanner({
  selectedWeekday,
  plan,
  saving,
  onSelectWeekday,
  onChangePlan,
  onSavePlan,
  onCopyPlan,
}) {
  const tasks = Array.isArray(plan.tasks) ? plan.tasks : [];

  const updateTask = (taskId, field, value) => {
    onChangePlan({
      ...plan,
      tasks: tasks.map((task) => (task._id === taskId ? { ...task, [field]: value } : task)),
    });
  };

  const addTask = () => {
    onChangePlan({
      ...plan,
      tasks: [...tasks, createBlankTask(tasks.length)],
    });
  };

  const removeTask = (taskId) => {
    onChangePlan({
      ...plan,
      tasks: tasks.filter((task) => task._id !== taskId),
    });
  };

  const handleCopy = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const sourceWeekday = String(formData.get("sourceWeekday") || "Monday");
    onCopyPlan(sourceWeekday);
  };

  return (
    <section className="panel planner-panel">
      <div className="panel-heading planner-header">
        <div>
          <p className="eyebrow">Weekday database</p>
          <h2>{selectedWeekday}</h2>
        </div>
      </div>

      <WeekdayTabs activeWeekday={selectedWeekday} onSelect={onSelectWeekday} />

      <label className="planner-title-field">
        Day label
        <input
          value={plan.title || `${selectedWeekday} Plan`}
          onChange={(event) => onChangePlan({ ...plan, title: event.target.value })}
          placeholder={`${selectedWeekday} Plan`}
        />
      </label>

      <div className="planner-copy-bar">
        <span>Copy tasks from</span>
        <form className="planner-copy-form" onSubmit={handleCopy}>
          <select name="sourceWeekday" defaultValue="Monday">
            {weekdayOrder.map((weekday) => (
              <option key={weekday} value={weekday}>
                {weekday}
              </option>
            ))}
          </select>
          <button type="submit" className="ghost-button">
            <Copy size={16} />
            Copy into {selectedWeekday}
          </button>
        </form>
      </div>

      <div className="planner-task-list">
        <div className="planner-table-head">
          <span className="planner-table-head-item"><ListTodo size={14} /> Task</span>
          <span className="planner-table-head-item"><Tag size={14} /> Type</span>
          <span className="planner-table-head-item"><Clock size={14} /> Start / End</span>
          <span className="planner-table-head-item"><FileText size={14} /> Notes</span>
          <span className="planner-table-head-item">Action</span>
        </div>

        {tasks.length === 0 ? <p className="empty-copy">No tasks added for this weekday yet.</p> : null}

        {tasks.map((task) => (
          <article key={task._id} className="planner-task-row">
            <input
              value={task.title || ""}
              onChange={(event) => updateTask(task._id, "title", event.target.value)}
              placeholder="Drink water and stretch"
            />

            <input
              list="task-types"
              value={task.type || ""}
              onChange={(event) => updateTask(task._id, "type", event.target.value)}
              placeholder="Type (e.g. Work, Gym)"
            />

            <div className="task-time-range">
              <input
                type="time"
                step="60"
                value={toTimeInputValue(task.startTime || task.time)}
                onChange={(event) => {
                  const value = event.target.value;
                  updateTask(task._id, "startTime", value);
                  updateTask(task._id, "time", value);
                }}
                className="task-time-input"
                aria-label="Start time"
              />
              <span className="time-separator"><ArrowRight size={14} /></span>
              <input
                type="time"
                step="60"
                value={toTimeInputValue(task.endTime)}
                onChange={(event) => updateTask(task._id, "endTime", event.target.value)}
                className="task-time-input"
                aria-label="End time"
              />
            </div>

            <input
              value={task.notes || ""}
              onChange={(event) => updateTask(task._id, "notes", event.target.value)}
              placeholder="Notes"
            />

            <button type="button" className="ghost-button danger" onClick={() => removeTask(task._id)} aria-label="Remove task">
              <Trash2 size={16} />
            </button>
          </article>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '16px' }}>
        <button type="button" className="ghost-button add-task-button" onClick={addTask} style={{ margin: 0 }}>
          <Plus size={18} />
          Add task
        </button>

        <button type="button" className="primary-button save-button" onClick={onSavePlan} disabled={saving} style={{ marginLeft: 'auto' }}>
          <Save size={18} />
          {saving ? "Saving..." : "Save weekday"}
        </button>
      </div>

      <datalist id="task-types">
        <option value="General" />
        <option value="College" />
        <option value="Dev" />
        <option value="DSA" />
        <option value="Personal" />
      </datalist>
    </section>
  );
}
