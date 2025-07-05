import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/register.css';

function Register() {
  const [email, setEmail] = useState('');
  const [firstname, setFirstname] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, firstname, password }),
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/');
    } else {
      alert(data.message || "Erreur lors de l'inscription");
    }
  };

  return (
    <form onSubmit={handleRegister}>
      <input type="text" value={firstname} onChange={e => setFirstname(e.target.value)} placeholder="Prénom" required />
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mot de passe" required />
      <button type="submit">Créer un compte</button>
    </form>
  );
}

export default Register;
