const request = async (url, options = {}) => {
  const token = localStorage.getItem("daytask_token");
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Request failed");
  }

  return response.json();
};

export const fetchPlans = () => request("/api/plans");

export const savePlan = (weekday, plan) =>
  request(`/api/plans/${weekday}`, {
    method: "PUT",
    body: JSON.stringify(plan),
  });

export const copyPlan = ({ sourceWeekday, targetWeekday }) =>
  request("/api/plans/copy", {
    method: "POST",
    body: JSON.stringify({ sourceWeekday, targetWeekday }),
  });

export const fetchLogs = (month) => request(`/api/logs?month=${encodeURIComponent(month)}`);

export const saveLog = (dateKey, payload) =>
  request(`/api/logs/${dateKey}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const fetchSummary = (month) => request(`/api/summary?month=${encodeURIComponent(month)}`);

export const fetchDayDatabase = (dateKey) => request(`/api/database/${encodeURIComponent(dateKey)}`);

export const saveDayDatabase = (dateKey, payload) =>
  request(`/api/database/${encodeURIComponent(dateKey)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
