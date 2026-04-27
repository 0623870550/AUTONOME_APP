import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useSession } from './SupabaseSessionProvider';

type AlertContextType = {
  alert: string | null;
  setAlert: (value: string | null) => void;
  pendingCount: number;
  refreshCount: () => void;
};

const AlertContext = createContext<AlertContextType>({
  alert: null,
  setAlert: () => {},
  pendingCount: 0,
  refreshCount: () => {},
});

export const AlertProvider = ({ children }: { children: React.ReactNode }) => {
  const [alert, setAlert] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const { session } = useSession();

  const fetchCount = async () => {
    if (!session) return;
    const { count, error } = await supabase
      .from('alerte')
      .select('*', { count: 'exact', head: true })
      .eq('statut', 'pending');
    
    if (!error) setPendingCount(count || 0);
  };

  useEffect(() => {
    if (session) {
      fetchCount();

      const channel = supabase
        .channel('db-alerte-count')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'alerte' }, () => {
          fetchCount();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [session]);

  return (
    <AlertContext.Provider value={{ 
      alert, 
      setAlert, 
      pendingCount, 
      refreshCount: fetchCount 
    }}>
      {children}
    </AlertContext.Provider>
  );
};

export const useAlert = () => useContext(AlertContext);
