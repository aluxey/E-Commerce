import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const currentSession = supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) fetchUserData(data.session.user.id);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchUserData(session.user.id);
      else setUserData(null);
    });

    return () => listener?.subscription.unsubscribe();
  }, []);

  const fetchUserData = async (id) => {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', id)
      .single();

    if (!error) {
      setUserData(data);
      if (data.role === 'admin') navigate('/admin');
      else navigate('/client');
    }
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
