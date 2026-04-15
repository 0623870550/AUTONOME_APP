import { supabase } from 'lib/supabase';
import { useEffect, useState } from 'react';
import { SafeAreaView, Text } from 'react-native';
import { useSession } from '../../context/SupabaseSessionProvider';

import AgentDashboard from '../(dashboards)/AgentDashboard';

export default function AgentPage() {
  const { session } = useSession();
  const [agent, setAgent] = useState<any>(null);

  useEffect(() => {
    if (!session?.user) return;

    const fetchAgent = async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (!error) setAgent(data);
    };

    fetchAgent();
  }, [session]);

  if (!agent) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#fff' }}>Chargement…</Text>
      </SafeAreaView>
    );
  }

  return <AgentDashboard agent={agent} />;
}
