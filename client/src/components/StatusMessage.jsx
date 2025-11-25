import { useTranslation } from "react-i18next";
import "../styles/status.css";

export const LoadingMessage = ({ message }) => {
  const { t } = useTranslation();
  return (
    <div className="status-block" role="status" aria-live="polite">
      <div className="status-spinner" aria-hidden="true" />
      <p className="status-text">{message || t('status.loading')}</p>
    </div>
  );
};

export const ErrorMessage = ({ title, message, onRetry }) => {
  const { t } = useTranslation();
  const resolvedTitle = title || t('status.error');
  return (
    <div className="status-block status-block--error" role="alert">
      <p className="status-title">{resolvedTitle}</p>
      {message && <p className="status-text">{message}</p>}
      {onRetry && (
        <button className="btn btn-primary" type="button" onClick={onRetry}>
          {t('status.retry')}
        </button>
      )}
    </div>
  );
};
