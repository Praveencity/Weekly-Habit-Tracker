const request = async (url, options = {}) => {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
};

export const login = (credentials) => request("/api/auth/login", {
  method: "POST",
  body: JSON.stringify(credentials),
});

export const register = (payload) => request("/api/auth/register", {
  method: "POST",
  body: JSON.stringify(payload),
});

export const me = (token) => request("/api/auth/me", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
