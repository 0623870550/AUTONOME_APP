import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import PageContainer from '../../components/PageContainer';
import AuthGate from '../_auth-gate';
import { supabase } from '../../lib/supabase';
import { useAgentRole } from '../../context/AgentRoleContext';
import { useAgentPermission } from '../../context/AgentPermissionContext';
import { useSession } from '../../context/SupabaseSessionProvider';

export default function Sondages() {
  const { roleAgent } = useAgentRole();
  const { role } = useAgentPermission();
  const { session } = useSession();

  const [activeSondages, setActiveSondages] = useState<any[]>([]);
  const [archivedSondages, setArchivedSondages] = useState<any[]>([]);
  const [myVotes, setMyVotes] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);

  // Poll responses states
  const [inputResponses, setInputResponses] = useState<Record<string, string>>({});
  const [anonymousFlags, setAnonymousFlags] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (session?.user && roleAgent) {
      loadData();
    }
  }, [session, roleAgent]);

  const loadData = async () => {
    setLoading(true);
    
    // 1. Fetch polls based on role segmentation
    const { data: polls, error: pError } = await supabase
      .from('sondages')
      .select('*, sondage_options(*)')
      .order('created_at', { ascending: false });

    if (pError) {
      console.error(pError);
    } else {
      // Filtrage strict (Segmentation Globale)
      const filtered = polls.filter(p => p.target === 'ALL' || p.target === roleAgent);
      setActiveSondages(filtered.filter(p => !p.is_archived && p.is_active));
      setArchivedSondages(filtered.filter(p => p.is_archived));
    }

    // 2. Fetch my votes
    const { data: votes, error: vError } = await supabase
      .from('sondage_votes')
      .select('*')
      .eq('agent_id', session?.user.id);

    if (!vError && votes) {
      const voteMap: Record<string, any> = {};
      votes.forEach(v => {
        voteMap[v.sondage_id] = v;
      });
      setMyVotes(voteMap);
    }

    setLoading(false);
  };

  const handleVote = async (sondageId: string, optionId?: string, text?: string) => {
    if (!session?.user) return;

    const { error } = await supabase.from('sondage_votes').insert([
      {
        sondage_id: sondageId,
        agent_id: session.user.id,
        option_id: optionId,
        response_text: text,
        is_anonymous: !!anonymousFlags[sondageId],
      },
    ]);

    if (error) {
      Alert.alert('Erreur', 'Impossible d’enregistrer ton vote.');
    } else {
      Alert.alert('Merci !', 'Ta participation a bien été enregistrée.');
      loadData(); // Reload to show results
    }
  };

  const renderPollContent = (s: any) => {
    const hasVoted = !!myVotes[s.id];
    
    // IF ALREADY VOTED - SHOW RESULTS
    if (hasVoted || s.is_archived) {
      return (
        <View style={styles.resultsContainer}>
          <Text style={styles.votedLabel}>{hasVoted ? '✅ Tu as participé' : '📁 Sondage terminé'}</Text>
          
          {s.type !== 'text' && s.sondage_options?.map((opt: any) => (
             <View key={opt.id} style={styles.resultRow}>
                <View style={styles.resultBarContainer}>
                   <View style={[styles.resultBar, { width: '40%' }]} /> 
                   <Text style={styles.resultText}>{opt.label}</Text>
                </View>
                <Text style={styles.resultPercent}>40%</Text> 
             </View>
          ))}

          {s.type === 'text' && (
            <Text style={{ color: '#aaa', fontStyle: 'italic', marginTop: 10 }}>
              Les participations libres sont en cours de traitement par le syndicat.
            </Text>
          )}

          <Text style={styles.statsDisclaimer}>Résultats en temps réel basés sur la participation globale.</Text>
        </View>
      );
    }

    // IF NOT VOTED - SHOW FORM
    return (
      <View style={styles.formContainer}>
        {s.type === 'yn' && (
          <View style={styles.row}>
            <Pressable style={styles.voteBtnSmall} onPress={() => handleVote(s.id, s.sondage_options[0]?.id)}>
              <Text style={styles.voteBtnText}>OUI</Text>
            </Pressable>
            <Pressable style={[styles.voteBtnSmall, { backgroundColor: '#333' }]} onPress={() => handleVote(s.id, s.sondage_options[1]?.id)}>
              <Text style={[styles.voteBtnText, { color: '#fff' }]}>NON</Text>
            </Pressable>
          </View>
        )}

        {(s.type === 'qcm' || s.type === 'dropdown') && (
          <View style={{ gap: 10 }}>
            {s.sondage_options?.map((opt: any) => (
              <Pressable key={opt.id} style={styles.voteBtnLong} onPress={() => handleVote(s.id, opt.id)}>
                <Text style={styles.voteBtnText}>{opt.label}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {s.type === 'text' && (
          <View>
            <TextInput
              style={styles.textInput}
              value={inputResponses[s.id] || ''}
              onChangeText={(txt) => setInputResponses(p => ({ ...p, [s.id]: txt }))}
              placeholder="Écris ta réponse ici..."
              placeholderTextColor="#666"
              multiline
            />
            <Pressable 
              style={styles.voteBtnLong} 
              onPress={() => handleVote(s.id, undefined, inputResponses[s.id])}
            >
              <Text style={styles.voteBtnText}>Envoyer ma réponse</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.anonymousRow}>
          <Text style={{ color: '#aaa' }}>Rester anonyme pour les collègues ?</Text>
          <Pressable 
            style={[styles.toggle, anonymousFlags[s.id] && styles.toggleActive]}
            onPress={() => setAnonymousFlags(p => ({ ...p, [s.id]: !p[s.id] }))}
          >
            <View style={[styles.toggleCircle, anonymousFlags[s.id] && styles.toggleCircleActive]} />
          </Pressable>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <PageContainer>
        <ActivityIndicator size="large" color="#F8FF00" style={{ marginTop: 50 }} />
      </PageContainer>
    );
  }

  return (
    <AuthGate>
      <PageContainer>
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <Text style={styles.mainTitle}>Sondages</Text>
            <Pressable 
              onPress={() => router.push('/')}
              style={{ backgroundColor: '#222', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#333' }}
            >
              <Text style={{ color: '#aaa', fontSize: 12, fontWeight: 'bold' }}>✕ Quitter</Text>
            </Pressable>
          </View>
          <Text style={styles.subtitle}>
            {roleAgent === 'SPP' ? '🚒 Espace Sapeurs-Pompiers' : '🏢 Espace PATS'}
          </Text>

          <View style={styles.tabContainer}>
            <Pressable style={[styles.tab, !showArchived && styles.tabActive]} onPress={() => setShowArchived(false)}>
              <Text style={[styles.tabText, !showArchived && styles.tabTextActive]}>🔍 Actuels</Text>
            </Pressable>
            <Pressable style={[styles.tab, showArchived && styles.tabActive]} onPress={() => setShowArchived(true)}>
              <Text style={[styles.tabText, showArchived && styles.tabTextActive]}>📁 Résultats passés</Text>
            </Pressable>
          </View>

          {(showArchived ? archivedSondages : activeSondages).map(s => (
            <View key={s.id} style={styles.pollCard}>
              <Text style={styles.pollQuestion}>🗳️ {s.question}</Text>
              {s.description ? <Text style={styles.pollDesc}>{s.description}</Text> : null}
              {renderPollContent(s)}
            </View>
          ))}

          {(showArchived ? archivedSondages : activeSondages).length === 0 && (
            <Text style={styles.emptyText}>Aucun sondage disponible pour le moment.</Text>
          )}

        </ScrollView>
      </PageContainer>
    </AuthGate>
  );
}

const styles = StyleSheet.create({
  mainTitle: { color: '#F8FF00', fontSize: 26, fontWeight: '700', marginBottom: 4 },
  subtitle: { color: '#aaa', fontSize: 14, marginBottom: 20, fontWeight: 'bold' },
  tabContainer: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 20, backgroundColor: '#222' },
  tabActive: { backgroundColor: '#F8FF00' },
  tabText: { color: '#888', fontWeight: 'bold' },
  tabTextActive: { color: '#000' },
  pollCard: { backgroundColor: '#111', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#333' },
  pollQuestion: { color: '#F8FF00', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  pollDesc: { color: '#aaa', fontSize: 14, marginBottom: 20, lineHeight: 20 },
  formContainer: { marginTop: 10 },
  row: { flexDirection: 'row', gap: 10 },
  voteBtnSmall: { flex: 1, backgroundColor: '#F8FF00', padding: 14, borderRadius: 12, alignItems: 'center' },
  voteBtnLong: { width: '100%', backgroundColor: '#F8FF00', padding: 14, borderRadius: 12, alignItems: 'center' },
  voteBtnText: { color: '#000', fontWeight: 'bold', fontSize: 15 },
  textInput: { backgroundColor: '#222', color: '#fff', padding: 12, borderRadius: 10, minHeight: 80, marginBottom: 12, textAlignVertical: 'top' },
  anonymousRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#222' },
  toggle: { width: 44, height: 24, borderRadius: 12, backgroundColor: '#333', padding: 2 },
  toggleActive: { backgroundColor: '#F8FF00' },
  toggleCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#666' },
  toggleCircleActive: { backgroundColor: '#000', transform: [{ translateX: 20 }] },
  resultsContainer: { marginTop: 10 },
  votedLabel: { color: '#F8FF00', fontWeight: 'bold', marginBottom: 15, fontSize: 13 },
  resultRow: { marginBottom: 12 },
  resultBarContainer: { height: 40, backgroundColor: '#222', borderRadius: 8, justifyContent: 'center', overflow: 'hidden' },
  resultBar: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(248, 255, 0, 0.2)' },
  resultText: { marginLeft: 12, color: '#fff', fontWeight: '600' },
  resultPercent: { position: 'absolute', right: 12, color: '#F8FF00', fontWeight: 'bold' },
  statsDisclaimer: { color: '#666', fontSize: 12, marginTop: 10, textAlign: 'center' },
  emptyText: { color: '#666', textAlign: 'center', marginTop: 40 },
});

