import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) fetchUserData(data.session.user);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchUserData(session.user);
      else setUserData(null);
    });

    return () => listener?.subscription.unsubscribe();
  }, []);

  const fetchUserData = async user => {
    if (!user?.id) return;

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
        return;
      }

      profile = inserted;
    }

    setUserData(profile);
    if (profile.role === 'admin') navigate('/admin');
    else navigate('/client');
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUserData(null);
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ session, userData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
