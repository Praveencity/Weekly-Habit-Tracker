import { weekdayOrder } from "../utils/date";

export default function WeekdayTabs({ activeWeekday, onSelect }) {
  return (
    <div className="weekday-tabs" role="tablist" aria-label="Weekday planner">
      {weekdayOrder.map((weekday) => (
        <button
          key={weekday}
          type="button"
          role="tab"
          aria-selected={activeWeekday === weekday}
          className={`weekday-tab ${activeWeekday === weekday ? "active" : ""}`}
          onClick={() => onSelect(weekday)}
        >
          {weekday.slice(0, 3)}
        </button>
      ))}
    </div>
  );
}
