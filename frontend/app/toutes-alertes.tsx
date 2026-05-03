import PageContainer from 'components/PageContainer';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View, Alert, Platform, TextInput, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from 'lib/supabase';
import { useAgentPermission } from '../context/AgentPermissionContext';
import { useAgentRole } from '../context/AgentRoleContext';
import { useSession } from '../context/SupabaseSessionProvider';

// 1. Fonction utilitaire pour les statuts et couleurs
const getStatusInfo = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'nouvelle':
    case 'pending':
      return { label: 'Nouvelle', color: '#888', icon: 'fiber-new' as any, bg: 'rgba(255, 255, 255, 0.05)' };
    case 'en cours':
    case 'en_cours':
      return { label: 'En cours', color: '#FF9500', icon: 'play-circle-outline' as any, bg: 'rgba(255, 149, 0, 0.1)' };
    case 'analyse':
      return { label: 'Analyse', color: '#F8FF00', icon: 'search' as any, bg: 'rgba(248, 255, 0, 0.1)' };
    case 'traitée':
    case 'cloturee':
    case 'treated':
    case 'traitée':
      return { label: 'Traitée', color: '#4CAF50', icon: 'check-circle' as any, bg: 'rgba(76, 175, 80, 0.1)' };
    default:
      return { label: status || 'Inconnu', color: '#666', icon: 'help' as any, bg: 'rgba(255, 255, 255, 0.05)' };
  }
};

export default function ToutesAlertesScreen() {
  const router = useRouter();
  const { session } = useSession();
  const { roleAgent } = useAgentRole();
  const { role } = useAgentPermission();

  const [alertes, setAlertes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<{ [key: string]: string }>({});

  const loadAlertes = async () => {
    if (!session?.user || !roleAgent || !role) return;
    setLoading(true);
    try {
      let query = supabase.from('alerte').select('*').order('inserted_at', { ascending: false });
      if (role === 'agent') query = query.eq('role_agent', roleAgent);

      const { data, error } = await query;
      if (error) throw error;

      if (data) {
        const agentIds = data.map(a => a.agent_id || a.created_by).filter(Boolean);
        if (agentIds.length > 0) {
          const { data: agentsData } = await supabase.from('agents').select('id, nom, prenom').in('id', agentIds);
          if (agentsData) {
            data.forEach(a => {
              const idToFind = a.agent_id || a.created_by;
              a.agents = agentsData.find(ag => ag.id === idToFind) || null;
            });
          }
        }
        setAlertes(data);
        const initialNotes: any = {};
        data.forEach(a => {
          const raw = a.comment_interne || '';
          initialNotes[a.id] = raw.replace('contact_oui | ', '').replace('contact_oui', '');
        });
        setNotes(initialNotes);
      }
    } catch (err: any) {
      console.error("Erreur fetch:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAlertes(); }, [session, roleAgent, role]);

  const updateStatut = async (id: string, nouveauStatut: string) => {
    const { error } = await supabase.from('alerte').update({ statut: nouveauStatut }).eq('id', id);
    if (error) {
      Alert.alert("Erreur", "Impossible de mettre à jour le statut.");
    } else {
      setAlertes(prev => prev.map(a => a.id === id ? { ...a, statut: nouveauStatut } : a));
    }
  };

  const saveNote = async (id: string, currentComment: string) => {
    const note = notes[id] || '';
    const prefix = currentComment?.includes('contact_oui') ? 'contact_oui | ' : '';
    const finalComment = prefix + note;
    const { error } = await supabase.from('alerte').update({ comment_interne: finalComment }).eq('id', id);

    if (error) {
      Alert.alert("Erreur", "Impossible de sauvegarder.");
    } else {
      if (Platform.OS === 'web') alert("Réponse enregistrée.");
      else Alert.alert("Succès", "La réponse a été enregistrée.");
      loadAlertes();
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <View style={styles.centered}><ActivityIndicator size="large" color="#F8FF00" /></View>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Pressable onPress={() => router.push('/admin')} style={styles.backButton}>
          <Text style={{ color: '#F8FF00', fontWeight: 'bold' }}>← Retour Admin</Text>
        </Pressable>

        <Text style={styles.title}>📢 Gestion des alertes</Text>

        {alertes.map((a) => {
          const statusInfo = getStatusInfo(a.statut);
          const needsContact = a.comment_interne?.includes('contact_oui');

          return (
            <View key={a.id} style={styles.card}>
              {needsContact && (
                <View style={styles.contactBadge}>
                  <Text style={styles.contactBadgeText}>📞 CONTACT SOUHAITÉ</Text>
                </View>
              )}

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <Text style={styles.cardType}>{a.type}</Text>
                    <View style={[styles.statusBadge, { borderColor: statusInfo.color, backgroundColor: statusInfo.bg }]}>
                      <MaterialIcons name={statusInfo.icon} size={12} color={statusInfo.color} />
                      <Text style={[styles.statusBadgeText, { color: statusInfo.color }]}>{statusInfo.label.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardAuthor}>
                    {a.anonyme ? `👤 Anonyme (${a.agents?.prenom || ''} ${a.agents?.nom || ''})` : `👥 ${a.agents?.prenom || ''} ${a.agents?.nom || ''}`}
                  </Text>
                </View>
              </View>

              <Text style={styles.cardDate}>{new Date(a.inserted_at).toLocaleString('fr-FR')}</Text>
              <Text style={styles.cardDesc} numberOfLines={2}>{a.description}</Text>

              <View style={styles.adminSection}>
                <Text style={styles.adminLabel}>Modifier le statut :</Text>
                <View style={styles.statusButtons}>
                  <Pressable
                    onPress={() => updateStatut(a.id, 'en cours')}
                    style={[styles.statusBtn, (a.statut === 'en cours' || a.statut === 'en_cours') && { borderColor: '#FF9500', backgroundColor: 'rgba(255,149,0,0.1)' }]}
                  >
                    <Text style={[styles.statusBtnText, (a.statut === 'en cours' || a.statut === 'en_cours') && { color: '#FF9500' }]}>En cours</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => updateStatut(a.id, 'analyse')}
                    style={[styles.statusBtn, a.statut === 'analyse' && { borderColor: '#F8FF00', backgroundColor: 'rgba(248,255,0,0.1)' }]}
                  >
                    <Text style={[styles.statusBtnText, a.statut === 'analyse' && { color: '#F8FF00' }]}>Analyse</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => updateStatut(a.id, 'traitée')}
                    style={[styles.statusBtn, (a.statut === 'traitée' || a.statut === 'treated' || a.statut === 'cloturee') && { borderColor: '#4CAF50', backgroundColor: 'rgba(76,175,80,0.1)' }]}
                  >
                    <Text style={[styles.statusBtnText, (a.statut === 'traitée' || a.statut === 'treated' || a.statut === 'cloturee') && { color: '#4CAF50' }]}>Traitée</Text>
                  </Pressable>
                </View>

                <Text style={styles.adminLabel}>Note de réponse à l'agent :</Text>
                <View style={styles.noteContainer}>
                  <TextInput
                    value={notes[a.id] || ''}
                    onChangeText={(val) => setNotes({ ...notes, [a.id]: val })}
                    placeholder="Ecrire une réponse..."
                    placeholderTextColor="#666"
                    style={styles.noteInput}
                    multiline
                  />
                  <Pressable onPress={() => saveNote(a.id, a.comment_interne)} style={styles.saveBtn}>
                    <Text style={styles.saveBtnText}>OK</Text>
                  </Pressable>
                </View>
              </View>

              <Pressable onPress={() => router.push(`/alerte-agent/${a.id}`)} style={styles.detailLink}>
                <Text style={styles.detailLinkText}>Voir le détail complet ➔</Text>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  backButton: { backgroundColor: '#333', alignSelf: 'flex-start', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 25, color: '#fff' },
  card: { backgroundColor: '#111', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#222' },
  contactBadge: { backgroundColor: '#F8FF00', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginBottom: 12 },
  contactBadgeText: { color: '#000', fontSize: 10, fontWeight: 'bold' },
  cardType: { color: '#fff', fontSize: 18, fontWeight: 'bold', textTransform: 'capitalize' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusBadgeText: { fontSize: 10, fontWeight: 'bold' },
  cardAuthor: { color: '#aaa', fontSize: 13, marginTop: 2 },
  cardDate: { color: '#666', fontSize: 11, marginTop: 4 },
  cardDesc: { color: '#ccc', marginTop: 10, fontSize: 14, lineHeight: 20 },
  adminSection: { marginTop: 20, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#222' },
  adminLabel: { color: '#888', fontSize: 11, fontWeight: 'bold', marginBottom: 10, textTransform: 'uppercase' },
  statusButtons: { flexDirection: 'row', gap: 4, marginBottom: 20, width: '100%' },
  statusBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#333', minWidth: 0 },
  statusBtnText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  noteContainer: { flexDirection: 'row', gap: 8 },
  noteInput: { flex: 1, backgroundColor: '#000', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, color: '#fff', fontSize: 13, borderWidth: 1, borderColor: '#333', minHeight: 45 },
  saveBtn: { backgroundColor: '#F8FF00', paddingHorizontal: 15, justifyContent: 'center', borderRadius: 8 },
  saveBtnText: { color: '#000', fontWeight: 'bold' },
  detailLink: { marginTop: 15, alignSelf: 'flex-end' },
  detailLinkText: { color: '#F8FF00', fontSize: 13, fontWeight: '600' }
});