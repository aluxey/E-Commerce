import { useState } from "react";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";
import { Link } from "react-router-dom";
import { useProduct } from "../context/ProductContext";
import { useAuth } from "../context/AuthContext";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { setToastMsg, setShowToast } = useProduct ();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await fetch("http://localhost:3001/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem("token", data.token);
      login(data.user);
      setToastMsg("🎉 Connexion réussie !");
      setShowToast(true);

      navigate("/");
    } else {
      setToastMsg("Email ou mot de passe invalide");
      setShowToast(true);
    }
  };

  return (
    <form onSubmit={handleLogin} className="login-form">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Mot de passe"
        required
      />
      <button type="submit">Se connecter</button>
      <Link to="/register">Créer un compte</Link>
    </form>
  );
}

export default Login;
