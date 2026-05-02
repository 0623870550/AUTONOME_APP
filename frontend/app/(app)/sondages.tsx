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
  useWindowDimensions,
  Image,
} from 'react-native';
import PageContainer from '../../components/PageContainer';
import AuthGate from '../_auth-gate';
import { supabase } from '../../lib/supabase';
import { useAgentRole } from '../../context/AgentRoleContext';
import { useAgentPermission } from '../../context/AgentPermissionContext';
import { useSession } from '../../context/SupabaseSessionProvider';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

const getReponse = (v: any, qId: string) => {
  if (!v || !v.reponses) return null;
  return v.reponses[qId];
};

const PollMedia = ({ sondage }: { sondage: any }) => {
  if (!sondage) return null;

  const handleOpenDoc = async () => {
    if (sondage.document_url) {
      await WebBrowser.openBrowserAsync(sondage.document_url);
    }
  };

  const hasValidImage = typeof sondage.image_url === 'string' && sondage.image_url.startsWith('http');

  return (
    <View style={{ marginBottom: 15 }}>
      {hasValidImage && (
        <Pressable onPress={() => WebBrowser.openBrowserAsync(sondage.image_url)}>
          <Image
            source={{ uri: sondage.image_url }}
            style={{ width: '100%', height: 200, borderRadius: 10, marginBottom: 10, backgroundColor: '#111' }}
            resizeMode="contain"
          />
        </Pressable>
      )}

      {sondage.video_url && (
        <Pressable
          onPress={() => WebBrowser.openBrowserAsync(sondage.video_url)}
          style={{ backgroundColor: '#222', padding: 15, borderRadius: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#333' }}
        >
          <Text style={{ fontSize: 24, marginRight: 12 }}>🎬</Text>
          <View>
            <Text style={{ color: '#F8FF00', fontWeight: 'bold' }}>Voir la vidéo associée</Text>
            <Text style={{ color: '#666', fontSize: 12 }}>Clique pour lancer le lecteur</Text>
          </View>
        </Pressable>
      )}

      {sondage.document_url && (
        <Pressable
          onPress={handleOpenDoc}
          style={{ backgroundColor: '#222', padding: 15, borderRadius: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#333' }}
        >
          <Text style={{ fontSize: 24, marginRight: 12 }}>📄</Text>
          <View>
            <Text style={{ color: '#F8FF00', fontWeight: 'bold' }}>Consulter le document (PDF)</Text>
            <Text style={{ color: '#666', fontSize: 12 }}>Note d'information ou rapport</Text>
          </View>
        </Pressable>
      )}
    </View>
  );
};

const RenderStats = ({ sondage, myVotes, globalVotes = [] }: { sondage: any, myVotes: Record<string, any>, globalVotes: any[] }) => {
  const hasVoted = !!myVotes[sondage?.id];

  if (!sondage || !sondage.questions) return null;

  const pollVotes = globalVotes.filter(v => v.sondage_id === sondage.id);
  const totalVotesCount = pollVotes.length;

  return (
    <View style={styles.resultsContainer}>
      <Text style={styles.votedLabel}>
        {hasVoted ? '✅ Merci pour votre participation' : '📁 Sondage terminé'}
      </Text>

      <Text style={{ color: '#fff', fontSize: 15, fontWeight: 'bold', marginBottom: 20 }}>
        📊 Résultats ({totalVotesCount} {totalVotesCount > 1 ? 'votes' : 'vote'})
      </Text>

      {sondage.questions.map((q: any, idx: number) => {
        if (q.type === 'text') {
          const textResponses = pollVotes
            .map(v => getReponse(v, q.id))
            .filter(txt => txt && typeof txt === 'string' && txt.trim() !== '');

          return (
            <View key={q.id || idx} style={{ marginBottom: 25 }}>
              <Text style={{ color: '#F8FF00', fontWeight: 'bold', marginBottom: 10 }}>{idx + 1}. {q.label}</Text>
              {textResponses.length > 0 ? (
                <View style={{ gap: 8 }}>
                  {textResponses.map((txt, tIdx) => (
                    <View key={tIdx} style={{ backgroundColor: '#222', padding: 12, borderRadius: 8 }}>
                      <Text style={{ color: '#ccc', fontSize: 14 }}>" {txt} "</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={{ color: '#666', fontStyle: 'italic' }}>Aucune réponse pour le moment.</Text>
              )}
            </View>
          );
        }

        const options = q.type === 'yn' ? ['OUI', 'NON'] : (q.options || []);

        return (
          <View key={q.id || idx} style={{ marginBottom: 25 }}>
            <Text style={{ color: '#F8FF00', fontWeight: 'bold', marginBottom: 10 }}>{idx + 1}. {q.label}</Text>

            <View style={{ gap: 12 }}>
              {options.map((opt: string) => {
                const count = pollVotes.filter(v => {
                  const val = getReponse(v, q.id);
                  if (!val) return false;
                  if (Array.isArray(val)) {
                    return val.some((item: string) => item.trim().toUpperCase() === opt.trim().toUpperCase());
                  }
                  return String(val).trim().toUpperCase() === opt.trim().toUpperCase();
                }).length;
                const percent = totalVotesCount > 0 ? Math.round((count / totalVotesCount) * 100) : 0;

                return (
                  <View key={opt}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>{opt}</Text>
                      <Text style={{ color: '#aaa', fontSize: 14, fontWeight: 'bold' }}>{percent}% ({count})</Text>
                    </View>
                    <View style={{ height: 12, backgroundColor: '#444', borderRadius: 6, overflow: 'hidden' }}>
                      <View style={{
                        height: '100%',
                        backgroundColor: '#F8FF00',
                        width: `${percent}%`,
                        borderRadius: 6
                      }} />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}

      <Text style={styles.statsDisclaimer}>
        Les résultats sont anonymes et mis à jour en temps réel.
      </Text>
    </View>
  );
};

export default function Sondages() {
  const { roleAgent } = useAgentRole();
  const { role } = useAgentPermission();
  const { session } = useSession();

  const [activeSondages, setActiveSondages] = useState<any[]>([]);
  const [archivedSondages, setArchivedSondages] = useState<any[]>([]);
  const [myVotes, setMyVotes] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [globalVotes, setGlobalVotes] = useState<any[]>([]);

  // Poll responses states (multi-questions)
  const [pollResponses, setPollResponses] = useState<Record<string, any>>({});
  const [anonymousFlags, setAnonymousFlags] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (session?.user && roleAgent) {
      loadData();
    }
  }, [session, roleAgent]);

  const loadData = async () => {
    setLoading(true);

    // Lancement des requêtes en parallèle pour ne pas bloquer l'affichage
    const [agentRes, pollsRes, votesRes, allVRes] = await Promise.all([
      supabase.from('agents').select('role_agent').eq('id', session.user.id).single(),
      supabase.from('sondages').select('*').order('created_at', { ascending: false }),
      supabase.from('sondage_votes').select('*').eq('agent_id', session?.user.id),
      supabase.from('sondage_votes').select('*')
    ]);

    const currentRole = agentRes.data?.role_agent || roleAgent;
    const polls = pollsRes.data;
    const pError = pollsRes.error;

    if (pError) {
      console.error('Erreur Supabase Sondages:', pError);
    } else {
      const filtered = (polls || []).filter(p => {
        const pTarget = (p.target || '').toUpperCase().trim();
        const uRole = (currentRole || '').toUpperCase().trim();
        return pTarget === 'ALL' || pTarget === uRole || !pTarget || (uRole && uRole.includes('SPP OU PATS'));
      });

      const active = filtered.filter(p => !p.is_archived && (p.is_active !== false));
      const archived = filtered.filter(p => p.is_archived);

      setActiveSondages(active);
      setArchivedSondages(archived);
    }

    if (!votesRes.error && votesRes.data) {
      setMyVotes(prev => {
        const voteMap: Record<string, any> = { ...prev };
        votesRes.data.forEach(v => {
          voteMap[v.sondage_id] = v;
        });
        return voteMap;
      });
    }

    if (!allVRes.error) {
      console.log("DEBUG VOTES REÇUS:", allVRes.data);
      setGlobalVotes(allVRes.data || []);
    } else {
      console.error('Erreur récupération sondage_votes (global):', allVRes.error);
    }

    setLoading(false);
  };

  const handleVote = async (sondageId: string, responses: any) => {
    if (!session?.user) return;

    // 1. Envoi simplifié
    const { error } = await supabase
      .from('sondage_votes')
      .insert({
        sondage_id: sondageId,
        agent_id: session.user.id,
        reponses: responses,
        is_anonymous: !!anonymousFlags[sondageId]
      });

    // 2. Gestion intelligente du résultat
    const errStatus = (error as any)?.status;
    if (!error || error.code === '23505' || errStatus === 409 || error?.message?.includes('409') || error?.message?.toLowerCase().includes('conflict')) {
      console.log("Vote validé ou déjà existant, passage aux résultats.");

      setMyVotes(prev => ({ ...prev, [sondageId]: true }));
      await loadData(); // On recharge TOUT pour avoir les derniers pourcentages
    } else {
      console.error("Erreur réelle:", error);
      Alert.alert("Erreur lors du vote", error.message);
    }
  };

  const renderPollContent = (s: any) => {
    const hasVoted = !!myVotes[s.id];

    // IF ALREADY VOTED - SHOW RESULTS
    if (hasVoted || s.is_archived) {
      return <RenderStats sondage={s} myVotes={myVotes} globalVotes={globalVotes} />;
    }

    const currentResponses = pollResponses[s.id] || {};

    const updateResponse = (qId: string, value: any) => {
      setPollResponses(prev => ({
        ...prev,
        [s.id]: {
          ...(prev[s.id] || {}),
          [qId]: value
        }
      }));
    };

    // IF NOT VOTED - SHOW FORM (New multi-question JSON format)
    const questions = s.questions || [];

    return (
      <View style={styles.formContainer}>
        {questions.map((q: any, idx: number) => (
          <View key={q.id || idx} style={{ marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#222', paddingBottom: 15 }}>

            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>
              {idx + 1}. {q.label}
            </Text>

            {q.type === 'yn' && (
              <View style={styles.row}>
                <Pressable
                  style={[styles.voteBtnSmall, currentResponses[q.id] === 'OUI' && { backgroundColor: '#F8FF00' }, currentResponses[q.id] !== 'OUI' && { backgroundColor: '#333' }]}
                  onPress={() => updateResponse(q.id, 'OUI')}
                >
                  <Text style={[styles.voteBtnText, { color: currentResponses[q.id] === 'OUI' ? '#000' : '#fff' }]}>OUI</Text>
                </Pressable>
                <Pressable
                  style={[styles.voteBtnSmall, currentResponses[q.id] === 'NON' && { backgroundColor: '#F8FF00' }, currentResponses[q.id] !== 'NON' && { backgroundColor: '#333' }]}
                  onPress={() => updateResponse(q.id, 'NON')}
                >
                  <Text style={[styles.voteBtnText, { color: currentResponses[q.id] === 'NON' ? '#000' : '#fff' }]}>NON</Text>
                </Pressable>
              </View>
            )}

            {(q.type === 'qcm' || q.type === 'dropdown') && (
              <View style={{ gap: 8 }}>
                {q.options?.map((opt: string) => (
                  <Pressable
                    key={opt}
                    style={[styles.voteBtnLong, currentResponses[q.id] === opt && { backgroundColor: '#F8FF00' }, currentResponses[q.id] !== opt && { backgroundColor: '#222', borderWidth: 1, borderColor: '#444' }]}
                    onPress={() => updateResponse(q.id, opt)}
                  >
                    <Text style={[styles.voteBtnText, { color: currentResponses[q.id] === opt ? '#000' : '#fff' }]}>{opt}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {q.type === 'text' && (
              <TextInput
                style={styles.textInput}
                value={currentResponses[q.id] || ''}
                onChangeText={(txt) => updateResponse(q.id, txt)}
                placeholder="Ta réponse..."
                placeholderTextColor="#666"
                multiline
              />
            )}
          </View>
        ))}

        <View style={styles.anonymousRow}>
          <Text style={{ color: '#aaa' }}>Rester anonyme pour les collègues ?</Text>
          <Pressable
            style={[styles.toggle, anonymousFlags[s.id] && styles.toggleActive]}
            onPress={() => setAnonymousFlags(p => ({ ...p, [s.id]: !p[s.id] }))}
          >
            <View style={[styles.toggleCircle, anonymousFlags[s.id] && styles.toggleCircleActive]} />
          </Pressable>
        </View>

        <Pressable
          style={[styles.voteBtnLong, { marginTop: 20, backgroundColor: '#F8FF00' }]}
          onPress={() => handleVote(s.id, currentResponses)}
        >
          <Text style={[styles.voteBtnText, { fontSize: 18 }]}>🚀 Envoyer mon vote</Text>
        </Pressable>
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
            {roleAgent === 'SPP' ? '🚒 Espace Sapeurs-Pompiers' :
              roleAgent === 'PATS' ? '🏢 Espace PATS' :
                '🌍 Espace Tous Agents'}
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

              <PollMedia sondage={s} />

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

