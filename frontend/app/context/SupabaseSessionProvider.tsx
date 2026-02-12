import { supabase } from 'lib/supabase';
import { createContext, useContext, useEffect, useState } from 'react';

type SessionContextType = {
  session: any;
  user: any | null;
};

const SessionContext = createContext<SessionContextType>({
  session: null,
  user: null,
});

export const SupabaseSessionProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const user = session?.user ?? null;

  return (
    <SessionContext.Provider value={{ session, user }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => useContext(SessionContext);
