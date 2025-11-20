import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import { LoadingMessage } from "./StatusMessage";

export default function PrivateRoute({ children, role }) {
  const { userData, loading } = useAuth();

  if (loading) {
    return <LoadingMessage message="Authentifizierung... / Authentification..." />;
  }

  if (!userData) return <Navigate to="/" />;
  if (role && userData.role !== role) return <Navigate to="/" />;
  return children;
}
