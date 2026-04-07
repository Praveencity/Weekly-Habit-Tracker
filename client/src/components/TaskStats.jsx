const statLabels = [
  { key: "total", label: "Total tasks" },
  { key: "todo", label: "To do" },
  { key: "inProgress", label: "In progress" },
  { key: "done", label: "Done" },
];

export default function TaskStats({ tasks }) {
  const stats = tasks.reduce(
    (accumulator, task) => {
      accumulator.total += 1;
      if (task.status === "todo") accumulator.todo += 1;
      if (task.status === "in-progress") accumulator.inProgress += 1;
      if (task.status === "done") accumulator.done += 1;
      return accumulator;
    },
    { total: 0, todo: 0, inProgress: 0, done: 0 }
  );

  return (
    <section className="stats-grid">
      {statLabels.map((stat) => (
        <article key={stat.key} className="panel stat-card">
          <p>{stat.label}</p>
          <strong>{stats[stat.key]}</strong>
        </article>
      ))}
    </section>
  );
}
