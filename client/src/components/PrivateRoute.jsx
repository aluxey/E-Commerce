import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import { LoadingMessage } from "./StatusMessage";
import { useTranslation } from "react-i18next";

export default function PrivateRoute({ children, role }) {
  const { userData, loading } = useAuth();
  const { t } = useTranslation();

  if (loading) {
    return <LoadingMessage message={t('status.loading')} />;
  }

  if (!userData) return <Navigate to="/" />;
  if (role && userData.role !== role) return <Navigate to="/" />;
  return children;
}
