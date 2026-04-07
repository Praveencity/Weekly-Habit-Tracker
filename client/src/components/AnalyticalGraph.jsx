import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

const parseTimeToMs = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, minutes] = String(timeStr).split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return 0;
  return (hours * 60 * 60 * 1000) + (minutes * 60 * 1000);
};

export default function AnalyticalGraph({ logs, plans }) {
  let completed = 0;
  let misses = 0;
  let totalTimeGivenMins = 0;

  logs.forEach(log => {
      const completedCount = Array.isArray(log.completedTaskIds) ? log.completedTaskIds.length : 0;
      const totalCount = log.totalTasks || 0;
      
      completed += completedCount;
      misses += Math.max(0, totalCount - completedCount);

      const planTasks = plans[log.weekday]?.tasks || [];
      if (Array.isArray(log.completedTaskIds)) {
          log.completedTaskIds.forEach(taskId => {
              const task = planTasks.find(t => t._id === taskId);
              if (task && task.startTime && task.endTime) {
                  const startMs = parseTimeToMs(task.startTime);
                  let endMs = parseTimeToMs(task.endTime);
                  if (endMs < startMs) endMs += 24 * 60 * 60 * 1000;
                  totalTimeGivenMins += (endMs - startMs) / (60 * 1000);
              }
          });
      }
  });

  const totalTimeHours = (totalTimeGivenMins / 60).toFixed(1);

  const data = [
    { name: 'Completed', value: completed, color: 'var(--success)', label: 'Tasks' },
    { name: 'Misses', value: misses, color: 'var(--danger)', label: 'Tasks' },
    { name: 'Time Given', value: parseFloat(totalTimeHours), color: 'var(--primary)', label: 'Hours' }
  ];

  return (
    <section className="panel stats-chart-panel" style={{ marginTop: '24px', padding: '24px' }}>
      <div style={{ marginBottom: '16px' }}>
        <p className="eyebrow">Monthly Analytics</p>
        <h3 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 600 }}>Performance Graph</h3>
      </div>
      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="name" tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip 
              cursor={{ fill: 'transparent' }}
              contentStyle={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '8px', color: '#000000' }}
              itemStyle={{ color: '#000000' }}
              formatter={(value, name, props) => [`${value} ${props.payload.label}`, props.payload.name]}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
