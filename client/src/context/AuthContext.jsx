/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabase/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const fetchUserData = useCallback(async user => {
    if (!user?.id) return;
    setAuthError(null);

    const { data, error } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Erreur récupération profil utilisateur:', error);
      return;
    }

    let profile = data || null;

    if (!profile) {
      const payload = {
        id: user.id,
        email: user.email,
        role: 'client',
      };

      const { data: inserted, error: insertError } = await supabase
        .from('users')
        .upsert(payload, { onConflict: 'id' })
        .select('id, email, role')
        .single();

      if (insertError) {
        console.error('Erreur création profil utilisateur:', insertError);
        setAuthError(insertError.message);
        return;
      }

      profile = inserted;
    }

    setUserData(profile);
    // Ne pas forcer la navigation ici pour éviter des redirections
    // indésirables quand l'utilisateur visite une page spécifique.
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        setAuthError(error.message);
        setLoading(false);
        return;
      }
      setSession(data.session);
      if (data.session) {
        fetchUserData(data.session.user).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoading(true);
      setSession(session);
      if (session) {
        fetchUserData(session.user).finally(() => setLoading(false));
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => listener?.subscription.unsubscribe();
  }, [fetchUserData]);

  return (
    <AuthContext.Provider value={{ session, userData, loading, authError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
