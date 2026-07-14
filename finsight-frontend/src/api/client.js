import axios from "axios";

const client = axios.create({
  baseURL: "http://localhost:8080/api",
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing = null; // dedupe concurrent refreshes

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    // Try a silent refresh exactly once per request
    if ((status === 401 || status === 403) && !original._retried
        && !original.url.includes("/auth/")) {
      original._retried = true;
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        try {
          refreshing = refreshing ?? axios.post(
            "http://localhost:8080/api/auth/refresh", { refreshToken });
          const { data } = await refreshing;
          refreshing = null;
          localStorage.setItem("token", data.token);
          localStorage.setItem("refreshToken", data.refreshToken);
          original.headers.Authorization = `Bearer ${data.token}`;
          return client(original); // retry the original request
        } catch {
          refreshing = null;
        }
      }
      // Refresh failed -> real logout
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default client;