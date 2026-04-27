import PageContainer from 'components/PageContainer';
import { useRouter } from 'expo-router';
import { supabase } from 'lib/supabase';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View, Alert, Platform, TextInput, StyleSheet } from 'react-native';

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
  const [notes, setNotes] = useState<{ [key: string]: string }>({});

  const loadAlertes = async () => {
    if (!session?.user || !roleAgent || !role) return;

    setLoading(true);
    try {
      let query = supabase
        .from('alerte')
        .select('*')
        .order('inserted_at', { ascending: false });

      if (role === 'agent') {
        query = query.eq('role_agent', roleAgent);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (data) {
        const agentIds = data.map(a => a.agent_id || a.created_by).filter(Boolean);
        if (agentIds.length > 0) {
          const { data: agentsData } = await supabase
            .from('agents')
            .select('id, nom, prenom')
            .in('id', agentIds);

          if (agentsData) {
            data.forEach(a => {
              const idToFind = a.agent_id || a.created_by;
              a.agents = agentsData.find(ag => ag.id === idToFind) || null;
            });
          }
        }
        setAlertes(data);

        // Initialisation des notes locales
        const initialNotes: any = {};
        data.forEach(a => {
          const raw = a.comment_interne || '';
          initialNotes[a.id] = raw.replace('contact_oui | ', '').replace('contact_oui', '');
        });
        setNotes(initialNotes);
      }
    } catch (err: any) {
      console.error('Erreur loadAlertes:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlertes();
  }, [session, roleAgent, role]);

  const updateStatut = async (id: string, nouveauStatut: string) => {
    const { error } = await supabase
      .from('alerte')
      .update({ statut: nouveauStatut })
      .eq('id', id);

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

    const { error } = await supabase
      .from('alerte')
      .update({ comment_interne: finalComment })
      .eq('id', id);

    if (error) {
      Alert.alert("Erreur", "Impossible de sauvegarder la note.");
    } else {
      if (Platform.OS === 'web') alert("Note enregistrée avec succès.");
      else Alert.alert("Succès", "Note enregistrée avec succès.");
      loadAlertes();
    }
  };

  const getStatusInfo = (statut: string) => {
    switch (statut) {
      case 'en_cours': return { color: '#FF9500', label: 'En cours' };
      case 'analyse': return { color: '#FFD500', label: 'En Analyse' };
      case 'cloturee': return { color: '#34C759', label: 'Clôturée' };
      default: return { color: '#8E8E93', label: 'Nouvelle' };
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <View style={styles.centered}><ActivityIndicator size="large" color="#FFD500" /></View>
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
          const status = getStatusInfo(a.statut);
          const needsContact = a.comment_interne?.includes('contact_oui');

          return (
            <View key={a.id} style={styles.card}>
              {/* BADGE CONTACT */}
              {needsContact && (
                <View style={styles.contactBadge}>
                  <Text style={styles.contactBadgeText}>📞 CONTACT SOUHAITÉ</Text>
                </View>
              )}

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardType}>{a.type}</Text>
                  <Text style={styles.cardAuthor}>
                    {a.anonyme ? `👤 Anonyme (${a.agents?.prenom || ''} ${a.agents?.nom || ''})` : `👥 ${a.agents?.prenom || ''} ${a.agents?.nom || ''}`}
                  </Text>
                </View>
                <View style={[styles.statusDot, { backgroundColor: status.color }]} />
              </View>

              <Text style={styles.cardDate}>{new Date(a.inserted_at).toLocaleString('fr-FR')}</Text>
              <Text style={styles.cardDesc} numberOfLines={2}>{a.description}</Text>

              {/* ACTIONS ADMIN */}
              <View style={styles.adminSection}>
                <Text style={styles.adminLabel}>Modifier le statut :</Text>
                <View style={styles.statusButtons}>
                  <Pressable onPress={() => updateStatut(a.id, 'en_cours')} style={[styles.statusBtn, a.statut === 'en_cours' && { borderColor: '#FF9500', backgroundColor: 'rgba(255,149,0,0.1)' }]}>
                    <Text style={[styles.statusBtnText, a.statut === 'en_cours' && { color: '#FF9500' }]}>En cours</Text>
                  </Pressable>
                  <Pressable onPress={() => updateStatut(a.id, 'analyse')} style={[styles.statusBtn, a.statut === 'analyse' && { borderColor: '#FFD500', backgroundColor: 'rgba(255,213,0,0.1)' }]}>
                    <Text style={[styles.statusBtnText, a.statut === 'analyse' && { color: '#FFD500' }]}>Analyse</Text>
                  </Pressable>
                  <Pressable onPress={() => updateStatut(a.id, 'cloturee')} style={[styles.statusBtn, a.statut === 'cloturee' && { borderColor: '#34C759', backgroundColor: 'rgba(52,199,89,0.1)' }]}>
                    <Text style={[styles.statusBtnText, a.statut === 'cloturee' && { color: '#34C759' }]}>Clôturée</Text>
                  </Pressable>
                </View>

                <Text style={styles.adminLabel}>Note administrative (visible par l'agent) :</Text>
                <View style={styles.noteContainer}>
                  <TextInput
                    value={notes[a.id] || ''}
                    onChangeText={(val) => setNotes({ ...notes, [a.id]: val })}
                    placeholder="Ajouter une réponse ou une note..."
                    placeholderTextColor="#666"
                    style={styles.noteInput}
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
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 25, color: '#fff' },
  card: { backgroundColor: '#111', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#222' },
  contactBadge: { backgroundColor: '#FFD500', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginBottom: 12 },
  contactBadgeText: { color: '#000', fontSize: 11, fontWeight: 'bold' },
  cardType: { color: '#fff', fontSize: 18, fontWeight: 'bold', textTransform: 'capitalize' },
  cardAuthor: { color: '#aaa', fontSize: 13, marginTop: 2 },
  cardDate: { color: '#666', fontSize: 11, marginTop: 4 },
  cardDesc: { color: '#ccc', marginTop: 10, fontSize: 14, lineHeight: 20 },
  statusDot: { width: 12, height: 12, borderRadius: 6, marginTop: 5 },
  adminSection: { marginTop: 20, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#222' },
  adminLabel: { color: '#888', fontSize: 12, fontWeight: 'bold', marginBottom: 10, textTransform: 'uppercase' },
  statusButtons: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  statusBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#333' },
  statusBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  noteContainer: { flexDirection: 'row', gap: 8 },
  noteInput: { flex: 1, backgroundColor: '#000', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, color: '#fff', fontSize: 13, borderWidth: 1, borderColor: '#333' },
  saveBtn: { backgroundColor: '#F8FF00', paddingHorizontal: 15, justifyContent: 'center', borderRadius: 8 },
  saveBtnText: { color: '#000', fontWeight: 'bold' },
  detailLink: { marginTop: 15, alignSelf: 'flex-end' },
  detailLinkText: { color: '#F8FF00', fontSize: 13, fontWeight: '600' }
});
