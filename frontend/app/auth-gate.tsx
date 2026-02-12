import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import LoaderAutonome from 'components/ui/LoaderAutonome';
import { useSession } from 'context/SupabaseSessionProvider';
import { supabase } from 'lib/supabase';

import { useAgentRole } from 'context/AgentRoleContext';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const session = useSession();

  const { setRoleAgent } = useAgentRole();

  const [mounted, setMounted] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (session === undefined) return;

    if (session === null) {
      router.replace('/signup');
      return;
    }

    loadRoles();
  }, [session, mounted]);

  const loadRoles = async () => {
    if (!session?.user) return;

    const { data, error } = await supabase
      .from('agents')
      .select('role_agent')
      .eq('id', session.user.id)
      .single();

    if (!error && data) {
      setRoleAgent(data.role_agent);
    } else {
      console.log("Erreur chargement rôle agent :", error);
    }

    setLoadingRoles(false);
  };

  if (!mounted || session === undefined || session === null || loadingRoles) {
    return <LoaderAutonome />;
  }

  return <>{children}</>;
}
