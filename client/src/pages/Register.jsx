import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/register.css"; 
import { useAuth  } from "../context/AuthContext";
import { useProduct } from "../context/ProductContext";

function Register() {
  const [email, setEmail] = useState("");
  const [firstname, setFirstname] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { setToastMsg, setShowToast } = useProduct ();
  const { login } = useAuth();

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:3001/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: firstname, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        login(data.user);
        setToastMsg("🎉 Connexion réussie !");
        setShowToast(true);
        navigate("/");
      } else {
        setToastMsg("Erreur lors de l'inscription");
        setShowToast(true);
      }
    } catch (err) {
      console.error("Erreur réseau ou serveur :", err);
      alert("Impossible de se connecter au serveur.");
    }
  };

  return (
    <form onSubmit={handleRegister}>
      <input
        type="text"
        value={firstname}
        onChange={(e) => setFirstname(e.target.value)}
        placeholder="Prénom"
        required
      />
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
      <button type="submit">Créer un compte</button>
    </form>
  );
}

export default Register;
