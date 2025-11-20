import "../styles/status.css";

export const LoadingMessage = ({ message = "Chargement..." }) => (
  <div className="status-block" role="status" aria-live="polite">
    <div className="status-spinner" aria-hidden="true" />
    <p className="status-text">{message}</p>
  </div>
);

export const ErrorMessage = ({ title = "Ein Fehler ist aufgetreten", message, onRetry }) => (
  <div className="status-block status-block--error" role="alert">
    <p className="status-title">{title}</p>
    {message && <p className="status-text">{message}</p>}
    {onRetry && (
      <button className="btn btn-primary" type="button" onClick={onRetry}>
        Erneut versuchen
      </button>
    )}
  </div>
);
