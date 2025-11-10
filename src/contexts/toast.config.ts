"use client";
import toast from "react-hot-toast";

// You can include <Toaster /> once in your root layout or _app.js

export const showMessage = (title:string, status = "default", description = null) => {
  const message = description ? `${title} — ${description}` : title;

  switch (status) {
    case "success":
      toast.success(message);
      break;
    case "danger":
    case "error":
      toast.error(message);
      break;
    case "warning":
      toast(message, { icon: "⚠️" });
      break;
    default:
      toast(message);
  }
};

export const successMessage = (title:string, description = null) => {
  toast.success(description ? `${title} — ${description}` : title);
};

export const errorMessage = (title:string, description = null) => {
  toast.error(description ? `${title} — ${description}` : title);
};

export const warningMessage = (title:string, description = null) => {
  toast(description ? `${title} — ${description}` : title, { icon: "⚠️" });
};