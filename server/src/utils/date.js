export const weekdayOrder = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const normalizeWeekday = (value = "") => {
  const lower = String(value).trim().toLowerCase();
  return weekdayOrder.find((weekday) => weekday.toLowerCase() === lower) || "Monday";
};

export const getWeekdayIndex = (weekday) => weekdayOrder.indexOf(normalizeWeekday(weekday));

export const getLocalDateKey = (date = new Date()) => {
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

export const startOfMonth = (monthKey) => monthKeyToDate(monthKey);

export const endOfMonth = (monthKey) => {
  const date = monthKeyToDate(monthKey);
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

export const formatDateLabel = (dateKey) => {
  const date = new Date(`${dateKey}T00:00:00`);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};
