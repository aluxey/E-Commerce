// components/AuthForm.jsx
import { useState } from "react";
import { supabase } from "../supabase/supabaseClient";
import "../styles/Authform.css"; // Assurez-vous d'avoir ce fichier CSS pour le style

export default function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const { data, error } = await supabase.auth.signUp({ email, password });
    console.log("Signup result:", { data, error });

    if (error) {
      setErrorMsg(error.message);
    } else {
      alert("Check your email to confirm registration.");
    }

    setLoading(false);
  };

  return (
    <form className="auth-form" onSubmit={handleSignup}>
      <h2>Inscription</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Mot de passe"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={6}
      />
      <button type="submit" disabled={loading}>
        {loading ? "Chargement..." : "S'inscrire"}
      </button>
      {errorMsg && <p className="error">{errorMsg}</p>}
    </form>
  );
}
