import { useEffect, useState } from "react";

const emptyTask = {
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
  dueDate: "",
  tags: "",
};

export default function TaskForm({ activeTask, onSave, onCancel }) {
  const [form, setForm] = useState(emptyTask);

  useEffect(() => {
    if (activeTask) {
      setForm({
        title: activeTask.title || "",
        description: activeTask.description || "",
        status: activeTask.status || "todo",
        priority: activeTask.priority || "medium",
        dueDate: activeTask.dueDate ? activeTask.dueDate.slice(0, 10) : "",
        tags: Array.isArray(activeTask.tags) ? activeTask.tags.join(", ") : "",
      });
      return;
    }

    setForm(emptyTask);
  }, [activeTask]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave({
      ...form,
      dueDate: form.dueDate || null,
    });
    if (!activeTask) {
      setForm(emptyTask);
    }
  };

  return (
    <section className="panel form-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Plan your day</p>
          <h2>{activeTask ? "Edit task" : "Create task"}</h2>
        </div>
        {activeTask ? (
          <button type="button" className="ghost-button" onClick={onCancel}>
            Cancel edit
          </button>
        ) : null}
      </div>

      <form className="task-form" onSubmit={handleSubmit}>
        <label>
          Title
          <input name="title" value={form.title} onChange={handleChange} placeholder="Prepare release notes" required />
        </label>

        <label>
          Description
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Add context, outcomes, or checklist items."
            rows="4"
          />
        </label>

        <div className="grid-2">
          <label>
            Status
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="todo">To do</option>
              <option value="in-progress">In progress</option>
              <option value="done">Done</option>
            </select>
          </label>

          <label>
            Priority
            <select name="priority" value={form.priority} onChange={handleChange}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
        </div>

        <div className="grid-2">
          <label>
            Due date
            <input name="dueDate" type="date" value={form.dueDate} onChange={handleChange} />
          </label>

          <label>
            Tags
            <input name="tags" value={form.tags} onChange={handleChange} placeholder="work, focus, personal" />
          </label>
        </div>

        <button type="submit" className="primary-button">
          {activeTask ? "Save changes" : "Add task"}
        </button>
      </form>
    </section>
  );
}
