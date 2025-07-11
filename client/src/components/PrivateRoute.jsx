import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PrivateRoute = ({ children }) => {
  const { user } = useAuth(); // on récupère l’utilisateur via le hook

  // si pas de user on redirige vers /login, sinon on rend les enfants
  return user ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
