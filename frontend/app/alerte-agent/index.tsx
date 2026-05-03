import PageContainer from '../../components/PageContainer';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

const getStatusInfo = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'nouvelle':
    case 'pending':
      return { label: 'Nouvelle', color: '#888', icon: 'fiber-new', bg: 'rgba(255, 255, 255, 0.05)' };
    case 'en cours':
    case 'en_cours':
      return { label: 'En cours', color: '#FF9500', icon: 'play-circle-outline', bg: 'rgba(255, 149, 0, 0.1)' };
    case 'analyse':
      return { label: 'Analyse', color: '#F8FF00', icon: 'search', bg: 'rgba(248, 255, 0, 0.1)' };
    case 'traitée':
    case 'cloturee':
    case 'treated':
      return { label: 'Traitée', color: '#4CAF50', icon: 'check-circle', bg: 'rgba(76, 175, 80, 0.1)' };
    default:
      return { label: status || 'Inconnu', color: '#666', icon: 'help', bg: 'rgba(255, 255, 255, 0.05)' };
  }
};

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

      // Utilisation de created_by pour correspondre à la table alerte
      let query = supabase
        .from('alerte')
        .select('*')
        .order('inserted_at', { ascending: false })
        .eq('created_by', session.user.id);

      const { data, error } = await query;

      if (!error) setAlertes(data || []);
      setLoading(false);
    };

    loadAlertes();
  }, [session, roleAgent, role]);



  if (loading || !session?.user || !roleAgent || !role) {
    return (
      <PageContainer>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#FFD500" />
          <Text style={{ marginTop: 10, color: '#fff' }}>Chargement…</Text>
        </View>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ScrollView contentContainerStyle={{ padding: 20 }}>

        <Pressable
          onPress={() => router.push('/')}
          style={styles.backButton}
        >
          <Text style={{ color: '#F8FF00', fontWeight: 'bold' }}>← Retour</Text>
        </Pressable>

        <Text style={styles.title}>Mes Alertes</Text>
        <Text style={styles.subtitle}>
          {role === 'delegue'
            ? `Suivi des alertes déclarées par les agents (${roleAgent})`
            : 'Historique et suivi de vos alertes déclarées.'}
        </Text>

        {alertes.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 45, marginBottom: 15 }}>📋</Text>
            <Text style={styles.emptyTitle}>Aucune alerte</Text>
            <Text style={styles.emptyText}>
              Il n'y a actuellement aucune alerte à afficher dans cette section.
            </Text>
            <Pressable
              onPress={() => router.push('/alerte')}
              style={styles.ctaButton}
            >
              <Text style={{ color: '#000', fontWeight: 'bold' }}>🚨 Déclarer une alerte</Text>
            </Pressable>
          </View>
        )}

        {alertes.map((a) => {
          const status = getStatusInfo(a.statut);
          // Extraction de la note admin
          const adminNote = a.comment_interne?.includes('contact_oui | ')
            ? a.comment_interne.split('contact_oui | ')[1]
            : (a.comment_interne !== 'contact_oui' ? a.comment_interne : null);

          return (
            <Pressable
              key={a.id}
              onPress={() => router.push(`/alerte-agent/${a.id}`)}
              style={styles.card}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.cardType}>{a.type}</Text>

                <Text style={styles.cardMeta}>
                  {a.anonyme ? '👤 Anonyme' : '👥 Identifié'} • {new Date(a.inserted_at).toLocaleDateString('fr-FR')}
                </Text>

                <View style={[styles.statusBadge, { borderColor: status.color, backgroundColor: status.bg, flexDirection: 'row', alignItems: 'center', gap: 5 }]}>
                  <MaterialIcons name={status.icon as any} size={14} color={status.color} />
                  <Text style={[styles.statusText, { color: status.color }]}>
                    {status.label.toUpperCase()}
                  </Text>
                </View>

                {adminNote && (
                  <View style={styles.noteBox}>
                    <Text style={styles.noteLabel}>💬 Note de l'administration :</Text>
                    <Text style={styles.noteText}>{adminNote}</Text>
                  </View>
                )}
              </View>
              <Text style={{ color: '#FFD500', fontSize: 20, marginLeft: 10 }}>➔</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  backButton: { backgroundColor: '#333', alignSelf: 'flex-start', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginBottom: 20 },
  title: { color: '#F8FF00', fontSize: 26, fontWeight: '700', marginBottom: 6 },
  subtitle: { color: '#ccc', fontSize: 14, marginBottom: 25 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 20, backgroundColor: '#111', padding: 30, borderRadius: 16, borderWidth: 1, borderColor: '#333', borderStyle: 'dashed' },
  emptyTitle: { color: '#FFD500', fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  emptyText: { color: '#aaa', textAlign: 'center', fontSize: 14, lineHeight: 22, marginBottom: 25 },
  ctaButton: { backgroundColor: '#F8FF00', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 24 },
  card: { backgroundColor: '#111', padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#222', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardType: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 6, textTransform: 'capitalize' },
  cardMeta: { color: '#666', fontSize: 12, marginBottom: 10 },
  statusBadge: { alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.05)' },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  noteBox: { marginTop: 15, padding: 10, backgroundColor: '#1a1a1a', borderRadius: 8, borderLeftWidth: 3, borderLeftColor: '#FFD500' },
  noteLabel: { color: '#FFD500', fontSize: 10, fontWeight: 'bold', marginBottom: 4, textTransform: 'uppercase' },
  noteText: { color: '#eee', fontSize: 13, lineHeight: 18 }
});
