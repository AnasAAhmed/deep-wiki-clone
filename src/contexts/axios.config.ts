import axios from "axios";

// export const baseURL = "http://192.168.1.114:3000/api/v1";
export const baseURL = "/api/v1";

// Normal JSON requests ke liye
export const axiosInstance = axios.create({
  baseURL: baseURL,
  timeout: 50000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// File uploads / multipart ke liye
export const axiosFormInstance = axios.create({
  baseURL: baseURL,
  timeout: 50000,
  headers: {
    // ❌ "Content-Type" mat do yahan
    Accept: "application/json",
  },
});