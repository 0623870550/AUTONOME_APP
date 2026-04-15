import { supabase } from 'lib/supabase';
import { createContext, useContext, useEffect, useState } from 'react';

type SessionContextType = {
  session: any | null | undefined; // undefined = en cours de chargement
  user: any | null;
};

const SessionContext = createContext<SessionContextType>({
  session: undefined,
  user: null,
});

export const SupabaseSessionProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<any | null | undefined>(undefined);

  useEffect(() => {
    let mounted = true;

    // 1) Charger la session initiale
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session ?? null);
      }
    });

    // 2) Écouter les changements d'état (login, logout, refresh)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (mounted) {
        setSession(newSession ?? null);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const user = session?.user ?? null;

  return (
    <SessionContext.Provider value={{ session, user }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => useContext(SessionContext);
