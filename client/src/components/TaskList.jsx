const statusLabels = {
  todo: "To do",
  "in-progress": "In progress",
  done: "Done",
};

const priorityLabels = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export default function TaskList({ tasks, onEdit, onDelete, onToggleStatus }) {
  if (tasks.length === 0) {
    return (
      <section className="panel empty-state">
        <h3>No tasks found</h3>
        <p>Create a task or adjust your filters to see results here.</p>
      </section>
    );
  }

  return (
    <section className="task-list">
      {tasks.map((task) => (
        <article key={task._id} className="panel task-card">
          <div className="task-card-top">
            <div>
              <p className={`status-pill status-${task.status}`}>{statusLabels[task.status]}</p>
              <h3>{task.title}</h3>
            </div>
            <div className="task-actions">
              <button type="button" className="ghost-button" onClick={() => onEdit(task)}>
                Edit
              </button>
              <button type="button" className="ghost-button danger" onClick={() => onDelete(task._id)}>
                Delete
              </button>
            </div>
          </div>

          {task.description ? <p className="task-description">{task.description}</p> : null}

          <div className="task-meta">
            <span className={`priority-pill priority-${task.priority}`}>{priorityLabels[task.priority]}</span>
            {task.dueDate ? <span>Due {new Date(task.dueDate).toLocaleDateString()}</span> : <span>No due date</span>}
            {Array.isArray(task.tags) && task.tags.length > 0 ? (
              <span>{task.tags.join(" · ")}</span>
            ) : (
              <span>No tags</span>
            )}
          </div>

          <div className="task-footer">
            <select value={task.status} onChange={(event) => onToggleStatus(task, event.target.value)}>
              <option value="todo">Move to to do</option>
              <option value="in-progress">Move to in progress</option>
              <option value="done">Move to done</option>
            </select>
          </div>
        </article>
      ))}
    </section>
  );
}
