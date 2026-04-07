export const weekdayOrder = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const getDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getMonthKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

export const monthKeyToDate = (monthKey) => {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1);
};

export const addMonths = (monthKey, delta) => {
  const date = monthKeyToDate(monthKey);
  date.setMonth(date.getMonth() + delta);
  return getMonthKey(date);
};

export const getWeekdayFromDateKey = (dateKey) => {
  const date = new Date(`${dateKey}T00:00:00`);
  return weekdayOrder[(date.getDay() + 6) % 7];
};

export const formatDateLabel = (dateKey) => {
  const date = new Date(`${dateKey}T00:00:00`);
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
};

export const formatMonthLabel = (monthKey) => {
  const date = monthKeyToDate(monthKey);
  return date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
};

export const buildMonthCells = (monthKey) => {
  const [year, month] = monthKey.split("-").map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const daysInMonth = lastDay.getDate();
  const startOffset = (firstDay.getDay() + 6) % 7;
  const cells = [];

  for (let index = 0; index < startOffset; index += 1) {
    cells.push({ key: `blank-${index}`, blank: true });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({ key: dateKey, blank: false, dateKey, day });
  }

  return cells;
};

export const formatTimeLabel = (time) => {
  if (!time) {
    return "Any time";
  }

  const [hoursText, minutesText] = String(time).split(":");
  const hours = Number(hoursText);
  if (Number.isNaN(hours)) {
    return time;
  }

  const minutes = Number(minutesText || 0);
  const suffix = hours >= 12 ? "PM" : "AM";
  const normalizedHours = ((hours + 11) % 12) + 1;
  return `${normalizedHours}:${String(minutes).padStart(2, "0")} ${suffix}`;
};

export const formatTimeRangeLabel = (startTime, endTime, fallbackTime) => {
  const startLabel = formatTimeLabel(startTime);
  const endLabel = endTime ? formatTimeLabel(endTime) : "";

  if (startTime && endTime) {
    return `${startLabel} - ${endLabel}`;
  }

  if (startTime) {
    return startLabel;
  }

  if (fallbackTime) {
    return formatTimeLabel(fallbackTime);
  }

  return "Any time";
};
