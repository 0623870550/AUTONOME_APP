import PageContainer from 'components/PageContainer';
import { useRouter } from 'expo-router';
import { supabase } from 'lib/supabase';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { useAgentPermission } from '../context/AgentPermissionContext';
import { useAgentRole } from '../context/AgentRoleContext';
import { useSession } from '../context/SupabaseSessionProvider';

export default function ToutesAlertesScreen() {
  const router = useRouter();

  const { session } = useSession();
  const { roleAgent } = useAgentRole();
  const { role } = useAgentPermission();

  const [alertes, setAlertes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user || !roleAgent || !role) return;

    const loadAlertes = async () => {
      setLoading(true);

      let query = supabase
        .from('alerte')
        .select('*')
        .order('inserted_at', { ascending: false });

      if (role === 'agent') {
        query = query.eq('role_agent', roleAgent);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erreur supabase loadAlertes:', error);
      } else {
        setAlertes(data || []);
      }
      setLoading(false);
    };

    loadAlertes();
  }, [session, roleAgent, role]);

  const badge = (statut: string) => {
    const styles: any = {
      en_cours: { color: '#FF9500', label: '🟠 En cours' },
      analyse: { color: '#007AFF', label: '🔵 Analyse' },
      cloturee: { color: '#34C759', label: '🟢 Clôturée' },
      nouvelle: { color: '#FFD500', label: '🟡 Nouvelle' },
    };

    const s = styles[statut] || styles['nouvelle'];

    return <Text style={{ color: s.color, fontWeight: 'bold' }}>{s.label}</Text>;
  };

  if (loading || !session?.user || !roleAgent || !role) {
    if (typeof window !== 'undefined') {
      console.log('[ToutesAlertes] Blocage sur le loader :', {
        loading,
        hasSession: !!session?.user,
        roleAgent,
        role
      });
    }

    return (
      <PageContainer>
        <View style={{ marginTop: 40, alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#FFD500" />
          <Text style={{ marginTop: 10 }}>Chargement…</Text>
        </View>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 26, fontWeight: 'bold', marginBottom: 20 }}>
          📢 Toutes les alertes
        </Text>

        {alertes.length === 0 && (
          <Text style={{ marginTop: 20, textAlign: 'center', color: '#666' }}>
            Aucune alerte pour le moment.
          </Text>
        )}

        {alertes.map((a) => (
          <Pressable
            key={a.id}
            onPress={() => router.push(`/alerte-agent/${a.id}`)}
            style={{
              padding: 15,
              borderWidth: 1,
              borderColor: '#ddd',
              borderRadius: 10,
              marginBottom: 15,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '600' }}>{a.type}</Text>

            <Text style={{ marginTop: 4 }}>
              {a.anonyme ? '👤 Anonyme' : '👥 Agent identifié'}
            </Text>

            <Text style={{ marginTop: 4 }}>{badge(a.statut)}</Text>

            <Text style={{ marginTop: 4, color: '#666' }}>
              {new Date(a.inserted_at).toLocaleString('fr-FR')}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </PageContainer>
  );
}
