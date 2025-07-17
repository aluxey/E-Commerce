import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase/supabaseClient";
import { useAuth } from "../context/AuthContext";
import "../styles/login.css"; // Assurez-vous d'avoir ce fichier CSS pour le style

const Login = () => {
  const { session } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      navigate("/");
    }
  };

  if (session) {
    navigate("/");
    return null;
  }

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
        <h2>Connexion</h2>

        <label>Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label>Mot de passe</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {errorMsg && <p className="error-msg">{errorMsg}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>
    </div>
  );
};

export default Login;
