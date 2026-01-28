import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';

type Session = Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session'];

const SessionContext = createContext<Session | undefined>(undefined);

export function SupabaseSessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | undefined>(undefined);
  const router = useRouter();

  useEffect(() => {
    // Récupération initiale
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    // Écoute des changements
    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);

      // 🔥 Gestion de la récupération de mot de passe
      if (event === 'PASSWORD_RECOVERY') {
        router.replace('/reset-password');
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
