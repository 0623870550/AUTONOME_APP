import { supabase } from 'lib/supabase';
import { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from './SupabaseSessionProvider';

interface AgentPermissionContextType {
  role: 'agent' | 'delegue' | 'admin' | null;
  setRole: (r: 'agent' | 'delegue' | 'admin' | null) => void;
}

const AgentPermissionContext = createContext<AgentPermissionContextType>({
  role: null,
  setRole: () => {},
});

export const AgentPermissionProvider = ({ children }: { children: React.ReactNode }) => {
  const { session } = useSession();
  const [role, setRole] = useState<'agent' | 'delegue' | 'admin' | null>(null);

  useEffect(() => {
    if (!session?.user) {
      setRole(null);
      return;
    }

    const loadPermission = async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (!error && data?.role) {
        setRole(data.role);
      } else {
        setRole(null);
      }
    };

    loadPermission();
  }, [session]);

  return (
    <AgentPermissionContext.Provider value={{ role, setRole }}>
      {children}
    </AgentPermissionContext.Provider>
  );
};

export const useAgentPermission = () => useContext(AgentPermissionContext);
