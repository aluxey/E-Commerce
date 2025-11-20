import { useEffect, useState } from "react";
import "../styles/toast.css";

let listeners = [];
let counter = 0;

export const pushToast = (payload) => {
  const id = ++counter;
  const toast = { id, ...payload };
  listeners.forEach(fn => fn(toast));
  return id;
};

const ToastHost = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const add = toast => {
      setToasts(prev => [...prev, toast]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toast.id)), toast.duration || 3000);
    };
    listeners.push(add);
    return () => {
      listeners = listeners.filter(fn => fn !== add);
    };
  }, []);

  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast--${toast.variant || "info"}`}>
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
};

export default ToastHost;
