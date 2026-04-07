import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

export default function CurrentTaskTimer({ activeTimerTask, activeTimerStart, isTimerPaused, pausedTimerDuration }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!activeTimerTask || !activeTimerStart || isTimerPaused) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [activeTimerTask, activeTimerStart, isTimerPaused]);

  if (!activeTimerTask || (!activeTimerStart && !isTimerPaused)) return null;

  const msElapsed = isTimerPaused 
                    ? pausedTimerDuration 
                    : pausedTimerDuration + (now - activeTimerStart);
  const totalSeconds = Math.max(0, Math.floor(msElapsed / 1000));
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hText = hours > 0 ? String(hours).padStart(2, "0") + ":" : "";
  const mText = String(minutes).padStart(2, "0") + ":";
  const sText = String(seconds).padStart(2, "0");
  const timeString = hText + mText + sText;

  return (
    <div className="timer-widget panel timer-active" style={{ paddingRight: 16 }}>
      <div className="timer-icon">
        <Clock size={28} />
      </div>
      <div className="timer-details">
        <span className="timer-label">Focusing On</span>
        <h3 className="timer-title">{activeTimerTask.title}</h3>
      </div>
      <div className="timer-countdown">
        {timeString}
      </div>
    </div>
  );
}
