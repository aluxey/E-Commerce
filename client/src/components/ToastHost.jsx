import { useEffect, useState } from "react";
import "../styles/toast.css";
import { listeners as toastListeners } from "../utils/toast";

const ToastHost = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const add = toast => {
      setToasts(prev => [...prev, toast]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toast.id)), toast.duration || 3000);
    };
    toastListeners.push(add);
    return () => {
      const index = toastListeners.indexOf(add);
      if (index > -1) {
        toastListeners.splice(index, 1);
      }
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
