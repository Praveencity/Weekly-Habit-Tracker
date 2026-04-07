import { buildMonthCells, formatMonthLabel, weekdayOrder } from "../utils/date";

const statusMeta = {
  none: { label: "Cross", symbol: "×" },
  partial: { label: "Tick", symbol: "✓" },
  complete: { label: "Green tick", symbol: "✓" },
};

export default function HabitCalendar({ monthKey, logsByDate, selectedDate, onSelectDate, onPreviousMonth, onNextMonth }) {
  const cells = buildMonthCells(monthKey);

  const getStatus = (dateKey) => logsByDate[dateKey]?.status || "none";

  return (
    <section className="panel calendar-panel">
      <div className="panel-heading calendar-heading">
        <div>
          <p className="eyebrow">Calendar</p>
          <h2>{formatMonthLabel(monthKey)}</h2>
        </div>
        <div className="calendar-nav">
          <button type="button" className="ghost-button" onClick={onPreviousMonth}>
            Previous
          </button>
          <button type="button" className="ghost-button" onClick={onNextMonth}>
            Next
          </button>
        </div>
      </div>

      <div className="calendar-legend">
        <span><i className="legend-dot none" /> No task done</span>
        <span><i className="legend-dot partial" /> Some tasks done</span>
        <span><i className="legend-dot complete" /> All tasks done</span>
      </div>

      <div className="calendar-grid weekday-row">
        {weekdayOrder.map((weekday) => (
          <div key={weekday} className="weekday-label">
            {weekday.slice(0, 3)}
          </div>
        ))}
      </div>

      <div className="calendar-grid month-grid">
        {cells.map((cell) => {
          if (cell.blank) {
            return <div key={cell.key} className="calendar-cell blank" />;
          }

          const status = getStatus(cell.dateKey);
          const meta = statusMeta[status];
          const isSelected = cell.dateKey === selectedDate;

          return (
            <button
              key={cell.key}
              type="button"
              className={`calendar-cell status-${status} ${isSelected ? "selected" : ""}`}
              onClick={() => onSelectDate(cell.dateKey)}
            >
              <span className="calendar-day-number">{cell.day}</span>
              <span className="calendar-status-symbol" aria-label={meta.label}>
                {meta.symbol}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
