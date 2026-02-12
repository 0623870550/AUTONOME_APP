import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { supabase } from 'lib/supabase';
import { useRouter } from 'expo-router';
import PageContainer from 'components/PageContainer';

import { useAgentRole } from 'context/AgentRoleContext';          // SPP / PATS
import { useAgentPermission } from 'context/AgentPermissionContext'; // agent / delegue / admin

export default function MesAlertesScreen() {
  const router = useRouter();

  const { roleAgent } = useAgentRole();
  const { role } = useAgentPermission();

  const [user, setUser] = useState<any>(null);
  const [alertes, setAlertes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger l'utilisateur connecté
  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user ?? null);
    };
    loadUser();
  }, []);

  // Charger les alertes selon le rôle
  useEffect(() => {
    if (!user || !roleAgent || !role) return;

    const loadAlertes = async () => {
      setLoading(true);

      let query = supabase
        .from('alerte')
        .select('*')
        .order('created_at', { ascending: false });

      // 🟨 Agent → uniquement ses alertes
      if (role === 'agent') {
        query = query.eq('created_by', user.id);
      }

      // 🟦 Délégué → toutes les alertes de sa catégorie
      if (role === 'delegue') {
        query = query.eq('role_agent', roleAgent);
      }

      // 🟥 Admin → toutes les alertes (pas de filtrage)

      const { data, error } = await query;

      if (!error) setAlertes(data || []);
      setLoading(false);
    };

    loadAlertes();
  }, [user, roleAgent, role]);

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

  if (loading || !user || !roleAgent || !role) {
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
          🔎 Mes alertes
        </Text>

        {alertes.length === 0 && (
          <Text style={{ marginTop: 20, textAlign: 'center', color: '#666' }}>
            Aucune alerte trouvée.
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
              {a.anonyme ? '👤 Anonyme' : '👥 Identifié'}
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
