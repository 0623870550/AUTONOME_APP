import PageContainer from '../../components/PageContainer';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { supabase } from '../../lib/supabase';

import { useAgentPermission } from '../../context/AgentPermissionContext';
import { useAgentRole } from '../../context/AgentRoleContext';
import { useSession } from '../../context/SupabaseSessionProvider';

export default function MesAlertesScreen() {
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
        .order('inserted_at', { ascending: false })
        .eq('agent_id', session.user.id);

      const { data, error } = await query;

      if (!error) setAlertes(data || []);
      setLoading(false);
    };

    loadAlertes();
  }, [session, roleAgent, role]);

  const badge = (statut: string) => {
    const styles: any = {
      en_cours: { color: '#FF9500', label: '🟠 En cours' },
      analyse: { color: '#007AFF', label: '🔵 En Analyse' },
      cloturee: { color: '#34C759', label: '🟢 Clôturée' },
      nouvelle: { color: '#FFD500', label: '🟡 Nouvelle' },
    };

    const s = styles[statut] || styles['nouvelle'];

    return (
      <Text style={{ color: s.color, fontWeight: 'bold', fontSize: 13 }}>
        {s.label}
      </Text>
    );
  };

  if (loading || !session?.user || !roleAgent || !role) {
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
        
        {/* BOUTON RETOUR */}
        <Pressable 
          onPress={() => router.push('/')} 
          style={{ backgroundColor: '#333', alignSelf: 'flex-start', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginBottom: 20 }}
        >
          <Text style={{ color: '#F8FF00', fontWeight: 'bold' }}>← Retour</Text>
        </Pressable>

        {/* EN-TÊTE */}
        <Text style={{ color: '#F8FF00', fontSize: 26, fontWeight: '700', marginBottom: 6 }}>
          Mes Alertes
        </Text>
        <Text style={{ color: '#ccc', fontSize: 14, marginBottom: 25 }}>
          {role === 'delegue' 
            ? `Suivi des alertes déclarées par les agents (${roleAgent})` 
            : 'Historique et suivi de vos alertes déclarées.'}
        </Text>

        {alertes.length === 0 && (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 20, backgroundColor: '#111', padding: 30, borderRadius: 16, borderWidth: 1, borderColor: '#333', borderStyle: 'dashed' }}>
            <Text style={{ fontSize: 45, marginBottom: 15 }}>📋</Text>
            <Text style={{ color: '#FFD500', fontSize: 20, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>
              Aucune alerte
            </Text>
            <Text style={{ color: '#aaa', textAlign: 'center', fontSize: 14, lineHeight: 22, marginBottom: 25 }}>
              Il n'y a actuellement aucune alerte à afficher dans cette section.
            </Text>
            <Pressable
              onPress={() => router.push('/alerte')}
              style={{ backgroundColor: '#F8FF00', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 24 }}
            >
              <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 15 }}>
                🚨 Déclarer une alerte
              </Text>
            </Pressable>
          </View>
        )}

        {alertes.map((a) => (
          <Pressable
            key={a.id}
            onPress={() => router.push(`/alerte-agent/${a.id}`)}
            style={{
              backgroundColor: '#111',
              padding: 16,
              borderRadius: 12,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.1)',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 6 }}>
                {a.type}
              </Text>
              
              <Text style={{ color: '#aaa', fontSize: 13, marginBottom: 8 }}>
                {a.anonyme ? '👤 Annonyme' : '👥 Identifié'} • {new Date(a.inserted_at).toLocaleDateString('fr-FR')}
              </Text>
              
              <View style={{ alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 }}>
                {badge(a.statut)}
              </View>
            </View>
            <Text style={{ color: '#FFD500', fontSize: 20, marginLeft: 10 }}>➔</Text>
          </Pressable>
        ))}
      </ScrollView>
    </PageContainer>
  );
}
