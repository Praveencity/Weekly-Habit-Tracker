import { useState, useEffect } from 'react';

export default function HabitSummary({ summary, dayStatus, completedCount, totalTasks }) {
  const progressText = totalTasks === 0 ? "No tasks planned" : `${completedCount}/${totalTasks} done today`;

  const [time, setTime] = useState(new Date());
  const [use24Hour, setUse24Hour] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: !use24Hour });
  const dateString = time.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <section className="stats-grid summary-grid">
      <article className="panel stat-card" style={{ position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ margin: 0 }}>Current time</p>
          <button 
            type="button" 
            onClick={() => setUse24Hour(!use24Hour)} 
            style={{ 
              background: 'none', 
              border: '1px solid var(--field-border)', 
              borderRadius: '4px', 
              padding: '2px 6px', 
              fontSize: '0.7rem', 
              color: 'var(--muted)',
              cursor: 'pointer'
            }}
            title={`Switch to ${use24Hour ? '12-hour' : '24-hour'} format`}
          >
            {use24Hour ? '12h' : '24h'}
          </button>
        </div>
        <strong>{timeString}</strong>
        <span>{dateString}</span>
      </article>

      <article className="panel stat-card accent-card">
        <p>Current streak</p>
        <strong>{summary.streak}</strong>
        <span>consecutive complete days</span>
      </article>

      <article className="panel stat-card">
        <p>Month completion</p>
        <strong>{summary.completionRate || 0}%</strong>
        <span>{summary.completedDays || 0} complete days</span>
      </article>

      <article className="panel stat-card">
        <p>Selected day</p>
        <strong className={`day-status day-${dayStatus}`}>{dayStatus}</strong>
        <span>{progressText}</span>
      </article>
    </section>
  );
}
