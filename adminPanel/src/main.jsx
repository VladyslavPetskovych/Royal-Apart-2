/* eslint-disable no-unused-vars */
import React from "react";
import ReactDOM from "react-dom/client";
import axios from "axios";
import App from "./App.jsx";
import "./index.css";

// Send the admin token (saved by Header.jsx after login) with every call to our API
const API_BASES = ["https://royalapart.online/api", "http://localhost:3000"];
const isOurApi = (url) => API_BASES.some((base) => String(url || "").startsWith(base));
const getToken = () => {
  const token = localStorage.getItem("token");
  return token && token !== "null" && token !== "undefined" ? token : null;
};

axios.interceptors.request.use((config) => {
  const token = getToken();
  if (token && isOurApi(config.url)) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Expired/invalid session: ask to log in again (not for the login request itself)
let sessionExpiredShown = false;
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = String(error?.config?.url || "");
    if (error?.response?.status === 401 && isOurApi(url) && !url.includes("/auth/login")) {
      localStorage.removeItem("token");
      if (!sessionExpiredShown) {
        sessionExpiredShown = true;
        alert("Сесія завершилась. Увійдіть знову.");
        window.location.reload();
      }
    }
    return Promise.reject(error);
  }
);

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
