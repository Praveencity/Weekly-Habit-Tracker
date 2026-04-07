import { useEffect, useState } from "react";
import { Lock, Play, Clock, ArrowRight } from "lucide-react";
import { toast } from "react-hot-toast";
import { formatDateLabel, formatTimeRangeLabel, getDateKey } from "../utils/date";

const parseTimeToDate = (timeStr, baseDate) => {
  if (!timeStr) return null;
  const [hours, minutes] = String(timeStr).split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) return null;
  const d = new Date(baseDate.getTime());
  d.setHours(hours, minutes, 0, 0);
  return d;
};

const getTaskTimingInfo = (task, now) => {
  if (!task.startTime || !task.endTime) return null;
  
  const start = parseTimeToDate(task.startTime, now);
  let end = parseTimeToDate(task.endTime, now);
  
  if (!start || !end) return null;
  
  if (end < start) {
    end.setDate(end.getDate() + 1);
  }
  
  const durationMs = end.getTime() - start.getTime();
  const marginMs = durationMs * 0.10; // 10%
  
  return {
    start,
    end,
    marginMs,
    durationMs
  };
};

export const canStartTask = (task, now) => {
  const timing = getTaskTimingInfo(task, now);
  if (!timing) return { allowed: true }; // No restrictions if missing times
  
  const allowedStartLimit = new Date(timing.start.getTime() + timing.marginMs);
  
  if (now < timing.start) return { allowed: false, reason: "Too early to start this task." };
  if (now > allowedStartLimit) return { allowed: false, reason: "You missed the 10% starting window." };
  
  return { allowed: true };
};

export const canEndTask = (task, now) => {
  const timing = getTaskTimingInfo(task, now);
  if (!timing) return { allowed: true };
  
  const allowedEndStart = new Date(timing.end.getTime() - timing.marginMs);
  
  if (now < allowedEndStart) return { allowed: false, reason: "Too early to complete this task (must be in final 10%)." };
  if (now > timing.end) return { allowed: false, reason: "You missed the ending window." };
  
  return { allowed: true };
};

function NextTaskCounter({ tasks, dateKey, completedTaskIds }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todayKey = getDateKey(now);
  if (dateKey !== todayKey) return null;

  let nextTask = null;
  let targetMs = 0;
  let isAlert = false;

  for (const task of tasks) {
    if (completedTaskIds.has(task._id)) continue;
    
    const timing = getTaskTimingInfo(task, now);
    if (!timing) continue;

    const start = timing.start;
    const expireStartMs = start.getTime() + timing.marginMs;

    if (now.getTime() >= start.getTime() && now.getTime() < expireStartMs) {
      if (!nextTask || !isAlert || expireStartMs < targetMs) {
        nextTask = task;
        targetMs = expireStartMs;
        isAlert = true;
      }
    } else if (start.getTime() > now.getTime() && !isAlert) {
      if (!nextTask || start.getTime() < targetMs) {
        nextTask = task;
        targetMs = start.getTime();
      }
    }
  }

  if (!nextTask) return null;

  const msLeft = targetMs - now.getTime();
  const hoursLeft = Math.floor(msLeft / 3600000);
  const minsLeft = Math.floor((msLeft % 3600000) / 60000);
  const secsLeft = Math.floor((msLeft % 60000) / 1000);

  const timeStrParts = [];
  if (hoursLeft > 0) timeStrParts.push(`${hoursLeft}h`);
  if (minsLeft > 0 || hoursLeft > 0) timeStrParts.push(`${minsLeft}m`);
  timeStrParts.push(`${secsLeft}s`);

  return (
    <div className={`next-task-counter ${isAlert ? "alert" : ""}`} style={{ 
      padding: "12px", 
      background: isAlert ? "var(--danger)" : "var(--ghost-bg)", 
      borderRadius: "8px", 
      marginBottom: "16px", 
      display: "flex", 
      alignItems: "center", 
      gap: "12px", 
      color: isAlert ? "#fff" : "var(--text)" 
    }}>
      <Clock size={18} color={isAlert ? "#fff" : "var(--accent-2)"} />
      <div>
        <strong style={{ display: "block", fontSize: "0.95rem" }}>
          {isAlert ? `ALERT: Start ${nextTask.title} now!` : `Coming Up: ${nextTask.title}`}
        </strong>
        <span style={{ fontSize: "0.85rem", color: isAlert ? "rgba(255,255,255,0.9)" : "var(--muted)" }}>
          {isAlert ? `Start window expires in ${timeStrParts.join(" ")}!` : `Starting in ${timeStrParts.join(" ")} (at ${nextTask.startTime})`}
        </span>
      </div>
    </div>
  );
}

const isTaskExpired = (task, dateKey, now) => {
  const todayKey = getDateKey(now);
  
  if (dateKey < todayKey) return true; // Past dates are locked immediately
  if (dateKey > todayKey) return false; // Future tasks aren't locked

  const limitStr = task.endTime || task.startTime || task.time;
  if (!limitStr) return false; // If no time is configured, never lock

  const [hours, minutes] = String(limitStr).split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) return false;

  const deadline = new Date(now.getTime());
  deadline.setHours(hours, minutes, 0, 0);

  // If there's a start time and an end time, and end is before start, it crosses midnight.
  if (task.startTime && task.endTime) {
    const [startHours, startMinutes] = String(task.startTime).split(":").map(Number);
    if (!isNaN(startHours) && !isNaN(startMinutes)) {
      if (hours < startHours || (hours === startHours && minutes < startMinutes)) {
        // Deadline is actually tomorrow, so it can't be expired today
        return false;
      }
    }
  }

  return now > deadline; // Lock if current time passes the limit
};

const statusLabels = {
  none: "No tasks done",
  partial: "Some tasks done",
  complete: "All tasks done",
};

export default function DailyChecklist({ dateKey, weekday, tasks, log, onToggleTask, onEditPlan, activeTimerTask, onStartTimer }) {
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    // Check every 60 seconds to lock tasks in real-time
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const completedTaskIds = new Set(log?.completedTaskIds || []);
  const completedCount = completedTaskIds.size;
  const totalTasks = tasks.length;
  const status = log?.status || "none";

  return (
    <section className="panel checklist-panel">
      <div className="panel-heading checklist-heading">
        <div>
          <p className="eyebrow">Daily view</p>
          <h2>{formatDateLabel(dateKey)}</h2>
          <p className="muted-copy">{weekday} plan</p>
        </div>
        <div className={`status-badge status-${status}`}>
          {statusLabels[status]}
        </div>
      </div>

      <div className="checklist-actions">
        <button type="button" className="ghost-button" onClick={onEditPlan}>
          Edit plan
        </button>
      </div>

      <NextTaskCounter tasks={tasks} dateKey={dateKey} completedTaskIds={completedTaskIds} />

      <div className="checklist-progress">
        <strong>{completedCount}/{totalTasks}</strong>
        <span>tasks completed</span>
      </div>

      <div className="timing-instruction" style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "1rem", lineHeight: "1.4" }}>
        <strong>Task Timing:</strong> Tasks must be started within their first 10% duration and can only be completed in their final 10%. They expire if missed. You can also start a timer for auto-completion (the 80% rule: tasks auto-complete when focused time reaches 80% of duration)!
      </div>

      {tasks.length === 0 ? (
        <p className="empty-copy">No tasks are scheduled for this weekday yet.</p>
      ) : (
        <div className="daily-task-list">
          {tasks.map((task) => {
            const checked = completedTaskIds.has(task._id);
            const expired = !checked && isTaskExpired(task, dateKey, currentTime);
            const isActiveTimer = activeTimerTask && activeTimerTask._id === task._id;

            return (
              <label 
                key={task._id} 
                className={`daily-task ${checked ? "checked" : ""} ${expired ? "expired" : ""} ${isActiveTimer ? "timer-running" : ""}`}
                style={expired ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
              >
                {expired ? (
                  <div style={{ padding: "3px 0 0 2px", color: "var(--muted)" }}>
                    <Lock size={14} />
                  </div>
                ) : (
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      if (!checked) {
                        const timing = getTaskTimingInfo(task, currentTime);
                        if (timing) {
                          const today = getDateKey(currentTime);
                          if (dateKey === today) {
                            const allowedEndStart = new Date(timing.end.getTime() - timing.marginMs);
                            if (currentTime.getTime() < allowedEndStart.getTime()) {
                              toast.error("Too early to complete. Wait for the final 10% of the session!");
                              return;
                            }
                          }
                        }
                      }
                      onToggleTask(task);
                    }}
                    disabled={expired || isActiveTimer}
                  />
                )}
                <span className="daily-task-text">
                  <strong>{task.title}</strong>
                  <span>{formatTimeRangeLabel(task.startTime, task.endTime, task.time) + (expired ? " · Missed" : "") + (task.notes ? ` · ${task.notes}` : "")}</span>
                </span>
                {!checked && !expired && !isActiveTimer && onStartTimer && (
                  <button 
                    type="button" 
                    className="play-timer-button" 
                    title="Start Focused Timer"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                            const timing = getTaskTimingInfo(task, currentTime);
                        if (timing) {
                          const today = getDateKey(currentTime);
                          if (dateKey === today) {
                            const allowedStartEnd = new Date(timing.start.getTime() + timing.marginMs);
                            if (currentTime.getTime() < timing.start.getTime()) {
                              toast.error("Too early to start this task.");
                              return;
                            }
                            if (currentTime.getTime() > allowedStartEnd.getTime()) {
                              toast.error("You missed the initial 10% starting window.");
                              return;
                            }
                          }
                        }
                        onStartTimer(task);
                      }}
                  >
                    <Play size={16} fill="currentColor" />
                  </button>
                )}
              </label>
            );
          })}
        </div>
      )}
    </section>
  );
}



