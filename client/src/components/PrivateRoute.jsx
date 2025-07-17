import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children, role }) {
  const { userData } = useAuth();

  if (!userData) return <Navigate to="/" />;
  if (role && userData.role !== role) return <Navigate to="/" />;
  return children;
}
