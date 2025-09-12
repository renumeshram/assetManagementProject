import axios from "axios";
import {toast} from 'react-hot-toast';

const api = axios.create({
  baseURL: "http://localhost:3000/api",
  withCredentials: true,
});

// Add token properly
api.interceptors.request.use(
  (config) => {
    const user = sessionStorage.getItem("asset_manager_user");
    if (user) {
      const { token } = JSON.parse(user);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && err.response?.data?.msg.includes("Session expired")) {
      // clear token
      sessionStorage.removeItem("token");
      // ✅ Show toast
      toast.error("Session expired. Please log in again.");

      // ✅ Redirect after a short delay (so toast is visible)
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    }
    return Promise.reject(err);
  }
);


export default api;
