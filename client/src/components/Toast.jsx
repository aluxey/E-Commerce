import '../styles/toast.css';

export default function Toast({ message }) {
  if (!message) return null;
  return <div className="toast-notif">{message}</div>;
}
