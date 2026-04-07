import React from 'react';
import { ArrowLeft, Clock, Tag } from 'lucide-react';
import { weekdayOrder } from '../utils/date';

const toTimeInputValue = (value) => {
  const time = String(value || "").trim();
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time) ? time : "";
};

export default function TimeTable({ plans, onBack }) {
  return (
    <div className="timetable-view" style={{ padding: '0 20px', width: '100%', animation: 'fadeIn 0.3s ease-in-out' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
        <button className="ghost-button" onClick={onBack}>
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
        <h2 style={{ margin: 0 }}>Weekly Time Table</h2>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(7, minmax(260px, 1fr))', 
        gap: '16px', 
        paddingBottom: '24px',
        overflowX: 'auto',
        alignItems: 'start'
      }}>
        {weekdayOrder.map((day) => {
          const dayPlan = plans[day];
          const tasks = dayPlan?.tasks || [];

          return (
            <div key={day} className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>      
                {day}
              </h3>

              {tasks.length === 0 ? (
                <p className="muted-copy" style={{ fontSize: '0.9rem' }}>No tasks scheduled.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {tasks
                    .sort((a, b) => (toTimeInputValue(a.startTime || a.time) > toTimeInputValue(b.startTime || b.time) ? 1 : -1))
                    .map((task) => (
                    <div key={task._id} style={{
                      background: 'var(--surface-2)',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column'
                    }}>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', wordBreak: 'break-word', overflowWrap: 'anywhere', lineHeight: '1.4' }}>
                        {task.title || 'Untitled Task'}
                      </h4>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '4px' }}>      
                        <Clock size={14} style={{ flexShrink: 0 }} />
                        <span style={{ whiteSpace: 'nowrap' }}>
                          {toTimeInputValue(task.startTime || task.time) || '?'} - {toTimeInputValue(task.endTime) || '?'}
                        </span>
                      </div>

                      {task.type && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--primary)' }}>
                          <Tag size={12} style={{ flexShrink: 0 }} />
                          <span style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                            {task.type}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
