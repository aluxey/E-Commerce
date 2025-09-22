// components/AuthForm.jsx
import { useState, useCallback, useMemo } from 'react';
import { supabase } from '../supabase/supabaseClient';
import '../styles/Authform.css';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthForm({ onSuccess }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const isEmailValid = emailRegex.test(form.email.trim());
  const isPasswordValid = form.password.length >= 6;
  const canSubmit = isEmailValid && isPasswordValid && !loading;

  const handleChange = useCallback(e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }, []);

  const handleBlur = useCallback(e => {
    const { name } = e.target;
    setTouched(t => ({ ...t, [name]: true }));
  }, []);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(v => !v);
  }, []);

  const getPasswordStrength = useMemo(() => {
    const pwd = form.password;
    if (!pwd) return { score: 0, label: 'Vide' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    const labels = ['Très faible', 'Faible', 'Moyen', 'Bon', 'Fort', 'Excellent'];
    return { score, label: labels[score] || 'Très faible' };
  }, [form.password]);

  const normalizeEmail = email => email.trim().toLowerCase();

  const mapSupabaseError = error => {
    // Tu peux étendre selon les codes que tu observes
    if (!error) return '';
    if (error.message?.toLowerCase().includes('already registered')) {
      return 'Cet email est déjà utilisé.';
    }
    if (error.message?.toLowerCase().includes('invalid email')) {
      return "Format d'email invalide.";
    }
    // fallback générique
    return "Échec de l'inscription. Réessaie plus tard.";
  };

  const handleSignup = useCallback(
    async e => {
      e.preventDefault();
      if (loading) return;
      if (!canSubmit) {
        setTouched({ email: true, password: true });
        return;
      }
      setLoading(true);
      setErrorMsg('');

      const emailNormalized = normalizeEmail(form.email);

      try {
        const { data, error } = await supabase.auth.signUp({
          email: emailNormalized,
          password: form.password,
        });

        if (error) {
          setErrorMsg(mapSupabaseError(error));
        } else {
          const user = data?.user;
          const hasSession = !!data?.session;

          if (user && hasSession) {
            const profilePayload = {
              id: user.id,
              email: emailNormalized,
              role: 'client',
            };

            const { error: profileError } = await supabase
              .from('users')
              .upsert(profilePayload, { onConflict: 'id' });

            if (profileError) {
              console.error('Erreur insertion profil utilisateur:', profileError);
            }
          }

          setErrorMsg('');
          onSuccess?.();
        }
      } catch (err) {
        console.error('Signup unexpected error:', err);
        setErrorMsg('Une erreur inattendue est survenue.');
      } finally {
        setLoading(false);
      }
    },
    [form, loading, canSubmit, onSuccess]
  );

  return (
    <div className="auth-wrapper">
      <form className="auth-form" onSubmit={handleSignup} noValidate aria-describedby="form-error">
        <h2>Inscription</h2>

        <label htmlFor="email">Adresse email</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="email@example.com"
          value={form.email}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          aria-invalid={touched.email && !isEmailValid}
          aria-describedby={touched.email && !isEmailValid ? 'email-error' : undefined}
          autoComplete="email"
        />
        <p className="muted" id="email-help">Nous ne partagerons jamais votre email.</p>
        {touched.email && !isEmailValid && (
          <p id="email-error" className="field-error" role="alert">
            Format d'email invalide.
          </p>
        )}

        <label htmlFor="password">Mot de passe</label>
        <div className="input-with-toggle">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            minLength={6}
            aria-invalid={touched.password && !isPasswordValid}
            aria-describedby="password-strength"
            autoComplete="new-password"
          />
          <button
            type="button"
            className="password-toggle"
            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            onClick={togglePasswordVisibility}
          >
            {showPassword ? 'Masquer' : 'Afficher'}
          </button>
        </div>
        {touched.password && !isPasswordValid && (
          <p id="password-error" className="field-error" role="alert">
            Le mot de passe doit contenir au moins 6 caractères.
          </p>
        )}

        <div
          id="password-strength"
          className="password-strength"
          aria-live="polite"
          data-score={getPasswordStrength.score}
        >
          <progress
            max={5}
            value={getPasswordStrength.score}
            aria-valuemin={0}
            aria-valuemax={5}
            aria-valuenow={getPasswordStrength.score}
          />
          <span>{getPasswordStrength.label}</span>
        </div>

        <button type="submit" disabled={!canSubmit}>
          {loading ? (
            <>
              <span className="spinner" aria-hidden="true" />
              <span className="sr-only">Chargement...</span>
            </>
          ) : (
            "S'inscrire"
          )}
        </button>

        <div aria-live="assertive">
          {errorMsg && (
            <p id="form-error" className="error" role="alert">
              {errorMsg}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
