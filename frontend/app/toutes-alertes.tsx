import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import PageContainer from '../components/PageContainer';
import { useAgentRole } from '@/context/AgentRoleContext';
import { useAgentPermission } from '@/context/AgentPermissionContext';

export default function ToutesAlertesScreen() {
  const router = useRouter();

  const { roleAgent } = useAgentRole();          // SPP / PATS
  const { role } = useAgentPermission();         // agent / delegue / admin

  const [alertes, setAlertes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roleAgent || !role) return; // On attend les deux rôles

    const loadAlertes = async () => {
      setLoading(true);

      // Base query
      let query = supabase
        .from('alerte')
        .select('*')
        .order('created_at', { ascending: false });

      // 🟨 Agents → filtrage SPP/PATS
      if (role === 'agent') {
        query = query.eq('role_agent', roleAgent);
      }

      // 🟦 Délégués & Admins → accès total (pas de filtrage)

      const { data, error } = await query;

      if (!error) setAlertes(data || []);
      setLoading(false);
    };

    loadAlertes();
  }, [roleAgent, role]);

  const badge = (statut: string) => {
    const styles: any = {
      en_cours: { color: '#FF9500', label: '🟠 En cours' },
      analyse: { color: '#007AFF', label: '🔵 Analyse' },
      cloturee: { color: '#34C759', label: '🟢 Clôturée' },
      nouvelle: { color: '#FFD500', label: '🟡 Nouvelle' },
    };

    const s = styles[statut] || styles['nouvelle'];

    return (
      <Text style={{ color: s.color, fontWeight: 'bold' }}>
        {s.label}
      </Text>
    );
  };

  if (loading || !roleAgent || !role) {
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
              {new Date(a.created_at).toLocaleString('fr-FR')}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </PageContainer>
  );
}
