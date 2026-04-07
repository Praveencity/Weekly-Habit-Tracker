const request = async (url, options = {}) => {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
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

export const fetchTasks = ({ status = "all", search = "" } = {}) => {
  const params = new URLSearchParams();

  if (status && status !== "all") {
    params.set("status", status);
  }

  if (search) {
    params.set("search", search);
  }

  const query = params.toString();
  return request(`/api/tasks${query ? `?${query}` : ""}`);
};

export const createTask = (task) => request("/api/tasks", {
  method: "POST",
  body: JSON.stringify(task),
});

export const updateTask = (id, task) => request(`/api/tasks/${id}`, {
  method: "PUT",
  body: JSON.stringify(task),
});

export const deleteTask = (id) => request(`/api/tasks/${id}`, {
  method: "DELETE",
});
