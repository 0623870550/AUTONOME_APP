import { useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';

import LoaderAutonome from 'components/ui/LoaderAutonome';
import { supabase } from 'lib/supabase';
import { useAgentRole } from '../context/AgentRoleContext';
import { useSession } from '../context/SupabaseSessionProvider';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const { session } = useSession();
  const { setRoleAgent } = useAgentRole();

  const [loadingRoles, setLoadingRoles] = useState(true);

  // 1) Chargement du rôle dès qu'on a la session
  useEffect(() => {
    if (session === undefined) return;

    if (session === null) {
      setRoleAgent(null);
      setLoadingRoles(false);
      return;
    }

    const loadRoles = async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('role_agent')
        .eq('id', session.user.id)
        .single();

      if (!error && data) {
        setRoleAgent(data.role_agent);
      } else {
        console.log('Erreur chargement rôle agent :', error);
        setRoleAgent(null);
      }
      setLoadingRoles(false);
    };

    loadRoles();
  }, [session, setRoleAgent]);

  // 2) Redirection quand le router est prêt et que le chargement est fini
  useEffect(() => {
    if (!navigationState?.key) return; // Attendre que le routeur soit monté
    if (session === undefined || loadingRoles) return;

    const inAppGroup = segments[0] === '(app)';
    const inDashboardsGroup = segments[0] === '(dashboards)';
    const isProtected = inAppGroup || inDashboardsGroup;

    if (session === null && isProtected) {
      router.replace('/login');
    } else if (session && !isProtected) {
      // Redirection après login réussi (vers l'entrée de l'app)
      router.replace('/(app)/tabs');
    }
  }, [session, loadingRoles, segments, navigationState, router]);

  const showLoader = session === undefined || loadingRoles;

  return (
    <View style={{ flex: 1 }}>
      {children}
      {showLoader && (
        <View style={StyleSheet.absoluteFillObject}>
          <LoaderAutonome />
        </View>
      )}
    </View>
  );
}
