import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request Interceptor placeholder (e.g., to attach Authorization header dynamically)
api.interceptors.request.use(
  (config) => {
    // In Phase 2, grab the token from state/cookie/localStorage and set it
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor placeholder (e.g., to handle token refresh automatically on 401)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // In Phase 2, handle access token refresh logic
    return Promise.reject(error);
  }
);

export default api;
