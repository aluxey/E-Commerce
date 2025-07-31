// components/Login.jsx
import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/supabaseClient';
import { useAuth } from '../context/AuthContext';
import '../styles/login.css';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const mapSupabaseError = error => {
  if (!error) return '';
  const msg = error.message?.toLowerCase();
  if (msg.includes('invalid login credentials') || msg.includes('invalid password')) {
    return 'Email ou mot de passe incorrect.';
  }
  if (msg.includes('user not found')) {
    return 'Aucun compte associé à cet email.';
  }
  // fallback générique
  return 'Échec de la connexion. Réessaie plus tard.';
};

export default function Login({ onSuccess }) {
  const { session } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // redirect if already logged in
  useEffect(() => {
    if (session) {
      navigate('/', { replace: true });
    }
  }, [session, navigate]);

  const isEmailValid = emailRegex.test(form.email.trim());
  const isPasswordValid = form.password.length > 0;
  const canSubmit = isEmailValid && isPasswordValid && !loading;

  const handleChange = useCallback(e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }, []);

  const handleBlur = useCallback(e => {
    const { name } = e.target;
    setTouched(t => ({ ...t, [name]: true }));
  }, []);

  const normalizeEmail = email => email.trim().toLowerCase();

  const handleLogin = useCallback(
    async e => {
      e.preventDefault();
      if (loading) return;
      if (!canSubmit) {
        setTouched({ email: true, password: true });
        return;
      }

      setLoading(true);
      setErrorMsg('');

      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: normalizeEmail(form.email),
          password: form.password,
        });

        if (error) {
          setErrorMsg(mapSupabaseError(error));
        } else {
          onSuccess?.();
          navigate('/', { replace: true });
        }
      } catch (err) {
        console.error('Login unexpected error:', err);
        setErrorMsg('Une erreur inattendue est survenue.');
      } finally {
        setLoading(false);
      }
    },
    [form, loading, canSubmit, navigate, onSuccess]
  );

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin} noValidate aria-describedby="form-error">
        <h2>Connexion</h2>

        <label htmlFor="email">Adresse email</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="email@example.com"
          required
          value={form.email}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={touched.email && !isEmailValid}
          aria-describedby={touched.email && !isEmailValid ? 'email-error' : undefined}
          autoComplete="email"
        />
        {touched.email && !isEmailValid && (
          <p id="email-error" className="field-error">
            Format d'email invalide.
          </p>
        )}

        <label htmlFor="password">Mot de passe</label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          required
          value={form.password}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={touched.password && !isPasswordValid}
          aria-describedby={touched.password && !isPasswordValid ? 'password-error' : undefined}
          autoComplete="current-password"
        />
        {touched.password && !isPasswordValid && (
          <p id="password-error" className="field-error">
            Le mot de passe ne peut pas être vide.
          </p>
        )}

        <div aria-live="polite">
          {errorMsg && (
            <p id="form-error" className="error-msg">
              {errorMsg}
            </p>
          )}
        </div>

        <button type="submit" disabled={!canSubmit}>
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
    </div>
  );
}
