import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';

import PageContainer from '../../components/PageContainer';
import { useRouter } from 'expo-router';
import AuthGate from '../_auth-gate';
import { supabase } from '../../lib/supabase';
import { useAgentRole } from '../../context/AgentRoleContext';
import { useSession } from '../../context/SupabaseSessionProvider';
import { useAgentPermission } from '../../context/AgentPermissionContext';
import React from 'react';

type ContributionType = 'idee' | 'solution' | 'besoin' | 'probleme' | 'retour' | 'suggestion';

interface Contribution {
  id: string;
  type: ContributionType;
  titre: string;
  description: string;
  impact: string;
  tags: string[];
  role_agent?: string | null;
  anonyme: boolean;
  up_votes: number;
  down_votes: number;
  neutral_votes: number;
  image_url?: string | null;
  video_url?: string | null;
  created_at: string;
  status: 'pending' | 'validated' | 'rejected';
  agents?: { pseudo?: string | null; prenom?: string | null } | null;
}

export default function Explorer() {
  const router = useRouter();
  const { session } = useSession();
  const { roleAgent } = useAgentRole();
  const { role } = useAgentPermission();

  const [loading, setLoading] = useState(true);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'tendances' | 'recentes'>('tendances');
  const [selected, setSelected] = useState<Contribution | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [zoomMedia, setZoomMedia] = useState<{ url: string, type: 'image' | 'video' } | null>(null);
  const [userVotes, setUserVotes] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchContributions();
    fetchUserVotes();

    const sub = supabase
      .channel('contributions-db')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contributions' }, () => {
        fetchContributions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [activeTab]);

  const fetchUserVotes = async () => {
    if (!session) return;
    const { data, error } = await supabase
      .from('contribution_votes')
      .select('contribution_id, vote_type')
      .eq('user_id', session.user.id);

    if (!error && data) {
      const votesMap: Record<string, string> = {};
      data.forEach(v => {
        let typeStr = 'neutral';
        if (v.vote_type === 1) typeStr = 'up';
        else if (v.vote_type === -1) typeStr = 'down';
        votesMap[v.contribution_id] = typeStr;
      });
      setUserVotes(votesMap);
    }
  };

  const fetchContributions = async () => {
    setLoading(true);

    const orderCol = activeTab === 'recentes' ? 'created_at' : 'score_tendance';

    const { data, error } = await supabase
      .from('explorer_contributions')
      .select('*')
      .order(orderCol, { ascending: false });

    if (!error) {
      console.log("📊 Contributions récupérées:", data?.length || 0);
      setContributions(data || []);
    } else {
      console.error('Erreur fetchContributions:', error);
    }
    setLoading(false);
  };

  const handleVote = async (contributionId: string, voteType: 'up' | 'down' | 'neutral') => {
    if (!session) return;

    // SÉCURITÉ : Cloisonnement par service (un SPP ne vote que pour SPP/ALL)
    const contribution = contributions.find(c => c.id === contributionId);
    if (contribution?.role_agent && contribution.role_agent !== 'ALL' && contribution.role_agent !== roleAgent) {
      Alert.alert("Accès limité", `En tant que ${roleAgent}, vous ne pouvez voter que pour les propositions de votre service.`);
      return;
    }

    const numericValue = voteType === 'up' ? 1 : voteType === 'down' ? -1 : 0;
    const previousVote = userVotes[contributionId];

    // --- MISE À JOUR OPTIMISTE ---
    setUserVotes(prev => {
      const next = { ...prev };
      if (previousVote === voteType) delete next[contributionId];
      else next[contributionId] = voteType;
      return next;
    });

    setContributions(prev => prev.map(c => {
      if (c.id === contributionId) {
        const next = { ...c };
        if (previousVote === 'up') next.up_votes = Math.max(0, (next.up_votes || 0) - 1);
        if (previousVote === 'down') next.down_votes = Math.max(0, (next.down_votes || 0) - 1);
        if (previousVote === 'neutral') next.neutral_votes = Math.max(0, (next.neutral_votes || 0) - 1);

        if (previousVote !== voteType) {
          if (voteType === 'up') next.up_votes = (next.up_votes || 0) + 1;
          if (voteType === 'down') next.down_votes = (next.down_votes || 0) + 1;
          if (voteType === 'neutral') next.neutral_votes = (next.neutral_votes || 0) + 1;
        }
        return next;
      }
      return c;
    }));








    try {
      if (previousVote) {
        const { error: delError } = await supabase
          .from('contribution_votes')
          .delete()
          .match({ contribution_id: contributionId, user_id: session.user.id });
        if (delError) throw delError;

        if (previousVote === voteType) return;
      }
      const { error: insError } = await supabase
        .from('contribution_votes')
        .insert({
          contribution_id: contributionId,
          user_id: session.user.id,
          vote_type: numericValue
        });
      if (insError) throw insError;






    } catch (e: any) {
      console.error("Vote RLS/Constraint Error:", e.message);
      Alert.alert("Erreur", "Action non autorisée ou erreur de permission (RLS).");
      fetchUserVotes();
      fetchContributions();
    }
  };

  const handleDeleteContribution = async (id: string) => {
    const item = contributions.find(c => c.id === id);
    if (!item) return;

    const confirmMsg = "Voulez-vous vraiment supprimer cette proposition définitivement ?";

    const proceed = Platform.OS === 'web'
      ? window.confirm(confirmMsg)
      : await new Promise((resolve) => {
        Alert.alert("Suppression", confirmMsg, [
          { text: "Annuler", style: "cancel", onPress: () => resolve(false) },
          { text: "Supprimer", style: "destructive", onPress: () => resolve(true) }
        ]);
      });

    if (proceed) {
      // Nettoyage Storage (propositions)
      const storage = supabase.storage.from('propositions');

      if (item.image_url) {
        const filePath = item.image_url.split('/propositions/')[1];
        if (filePath) await storage.remove([filePath]);
      }
      if (item.video_url) {
        const filePath = item.video_url.split('/propositions/')[1];
        if (filePath) await storage.remove([filePath]);
      }

      const { error } = await supabase.from('contributions').delete().eq('id', id);
      if (error) {
        console.error("❌ Erreur suppression base:", error);
        Alert.alert("Erreur", `Impossible de supprimer la proposition : ${error.message}`);
      } else {
        console.log("✅ Suppression réussie dans la base");
        setContributions(prev => prev.filter(c => c.id !== id));
      }
    }
  };

  const filtered = contributions.filter(c => {
    const matchesSearch = c.titre.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <AuthGate>
      <PageContainer>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <Text style={{ color: '#F8FF00', fontSize: 26, fontWeight: '700' }}>
            Explorer
          </Text>
          <Pressable
            onPress={() => router.push('/')}
            style={{ backgroundColor: '#222', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#333' }}
          >
            <Text style={{ color: '#aaa', fontSize: 12, fontWeight: 'bold' }}>✕ Quitter</Text>
          </Pressable>
        </View>
        <Text style={{ color: '#ccc', fontSize: 14, marginBottom: 20 }}>
          Explorez et soutenez les propositions de vos collègues.
        </Text>

        <View style={{ flexDirection: 'row', backgroundColor: '#111', borderRadius: 12, paddingHorizontal: 12, alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: '#333' }}>
          <Text style={{ fontSize: 18, marginRight: 8 }}>🔍</Text>
          <TextInput
            placeholder="Rechercher..."
            placeholderTextColor="#888"
            value={search}
            onChangeText={setSearch}
            style={{ color: '#fff', flex: 1, paddingVertical: 12 }}
          />
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 25 }}>
          {[
            { key: 'tendances', label: '🔥 Tendances' },
            { key: 'recentes', label: '🆕 Récentes' },
          ].map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key as any)}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 20,
                backgroundColor: activeTab === tab.key ? '#F8FF00' : 'rgba(255,255,255,0.1)',
                alignItems: 'center'
              }}
            >
              <Text style={{ color: activeTab === tab.key ? '#000' : '#fff', fontWeight: 'bold' }}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color="#F8FF00" style={{ marginTop: 20 }} />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {filtered.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => { setSelected(c); setShowModal(true); }}
                style={{ backgroundColor: '#111', borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#333', overflow: 'hidden' }}
              >
                {c.image_url && (
                  <Pressable onPress={() => setZoomMedia({ url: c.image_url || '', type: 'image' })}>
                    <Image source={{ uri: c.image_url }} style={{ width: '100%', height: 200 }} resizeMode="cover" />
                  </Pressable>
                )}
                {c.video_url && (
                  <View style={{ height: 200, backgroundColor: '#000', position: 'relative', justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ position: 'absolute', color: '#666', fontSize: 12 }}>Chargement du média...</Text>
                    <Video
                      source={{ uri: c.video_url }}
                      style={{ width: '100%', height: '100%' }}
                      useNativeControls
                      resizeMode={ResizeMode.CONTAIN}
                    />
                    <Pressable
                      onPress={() => setZoomMedia({ url: c.video_url || '', type: 'video' })}
                      style={{ position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 20 }}
                    >
                      <MaterialIcons name="fullscreen" size={24} color="#F8FF00" />
                    </Pressable>
                  </View>
                )}

                <View style={{ padding: 16 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                    <Text style={{ color: '#F8FF00', fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase' }}>{c.type}</Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Text style={{ color: '#666', fontSize: 12 }}>{new Date(c.created_at).toLocaleDateString()}</Text>
                      {role === 'admin' && (
                        <Pressable
                          onPress={() => handleDeleteContribution(c.id)}
                          style={{ backgroundColor: 'rgba(255, 68, 68, 0.1)', padding: 6, borderRadius: 8 }}
                        >
                          <MaterialIcons name="delete" size={18} color="#FF4444" />
                        </Pressable>
                      )}
                    </View>
                  </View>

                  {c.tags && c.tags.length > 0 && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                      {c.tags.map((tag, idx) => (
                        <View key={idx} style={{ backgroundColor: '#222', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#333' }}>
                          <Text style={{ color: '#aaa', fontSize: 11, fontWeight: '500' }}>
                            #{tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase()}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 6 }}>{c.titre}</Text>
                  <Text style={{ color: '#aaa', fontSize: 14, marginBottom: 15 }} numberOfLines={2}>{c.description}</Text>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <Pressable
                        onPress={() => handleVote(c.id, 'up')}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: userVotes[c.id] === 'up' ? 'rgba(248, 255, 0, 0.1)' : '#222', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: userVotes[c.id] === 'up' ? '#F8FF00' : '#444' }}
                      >
                        <MaterialIcons name="thumb-up" size={18} color={userVotes[c.id] === 'up' ? '#F8FF00' : '#888'} />
                        <Text style={{ color: userVotes[c.id] === 'up' ? '#F8FF00' : '#fff', fontWeight: 'bold' }}>{c.up_votes || 0}</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => handleVote(c.id, 'down')}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: userVotes[c.id] === 'down' ? 'rgba(248, 255, 0, 0.1)' : '#222', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: userVotes[c.id] === 'down' ? '#F8FF00' : '#444' }}
                      >
                        <MaterialIcons name="thumb-down" size={18} color={userVotes[c.id] === 'down' ? '#F8FF00' : '#888'} />
                        <Text style={{ color: userVotes[c.id] === 'down' ? '#F8FF00' : '#fff', fontWeight: 'bold' }}>{c.down_votes || 0}</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => handleVote(c.id, 'neutral')}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: userVotes[c.id] === 'neutral' ? 'rgba(248, 255, 0, 0.1)' : '#222', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: userVotes[c.id] === 'neutral' ? '#F8FF00' : '#444' }}
                      >
                        <MaterialIcons name="sentiment-neutral" size={18} color={userVotes[c.id] === 'neutral' ? '#F8FF00' : '#888'} />
                        <Text style={{ color: userVotes[c.id] === 'neutral' ? '#F8FF00' : '#fff', fontWeight: 'bold' }}>{c.neutral_votes || 0}</Text>
                      </Pressable>
                    </View>

                    <View style={{ backgroundColor: 'rgba(248, 255, 0, 0.1)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: '#F8FF00' }}>
                      <Text style={{ color: '#F8FF00', fontWeight: 'bold', fontSize: 12 }}>Détails</Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <Modal visible={showModal} transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 20 }}>
            {selected && (
              <ScrollView style={{ backgroundColor: '#111', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#333' }}>
                {selected.image_url && (
                  <Pressable onPress={() => setZoomMedia({ url: selected.image_url || '', type: 'image' })}>
                    <Image source={{ uri: selected.image_url }} style={{ width: '100%', height: 250, borderRadius: 12, marginBottom: 20 }} resizeMode="cover" />
                  </Pressable>
                )}
                {selected.video_url && (
                  <View style={{ width: '100%', height: 250, borderRadius: 12, marginBottom: 20, backgroundColor: '#000', overflow: 'hidden', position: 'relative', justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ position: 'absolute', color: '#666', fontSize: 12 }}>Chargement du média...</Text>
                    <Video
                      source={{ uri: selected.video_url }}
                      style={{ width: '100%', height: '100%' }}
                      useNativeControls
                      resizeMode={ResizeMode.CONTAIN}
                    />
                    <Pressable
                      onPress={() => setZoomMedia({ url: selected.video_url || '', type: 'video' })}
                      style={{ position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 20 }}
                    >
                      <MaterialIcons name="fullscreen" size={24} color="#F8FF00" />
                    </Pressable>
                  </View>
                )}
                <Text style={{ color: '#F8FF00', fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>{selected.titre}</Text>

                {selected.tags && selected.tags.length > 0 && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                    {selected.tags.map((tag, idx) => (
                      <View key={idx} style={{ backgroundColor: '#222', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: '#333' }}>
                        <Text style={{ color: '#F8FF00', fontSize: 12, fontWeight: '500' }}>
                          #{tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase()}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                <Text style={{ color: '#ccc', fontSize: 16, lineHeight: 22, marginBottom: 20 }}>{selected.description}</Text>

                <View style={{ backgroundColor: '#222', padding: 15, borderRadius: 12, marginBottom: 20 }}>
                  <Text style={{ color: '#888', marginBottom: 5 }}>Publié par :</Text>
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                    {(selected as any).anonyme
                      ? '👤 Agent Anonyme'
                      : `👤 ${(selected as any).author_pseudo || (selected as any).author_prenom || 'Agent'}`
                    }
                  </Text>
                </View>

                <Pressable onPress={() => setShowModal(false)} style={{ backgroundColor: '#F8FF00', padding: 15, borderRadius: 12, alignItems: 'center' }}>
                  <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 16 }}>Fermer</Text>
                </Pressable>
              </ScrollView>
            )}
          </View>
        </Modal>

        <Modal visible={!!zoomMedia} transparent animationType="fade">
          <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
            <Pressable
              onPress={() => setZoomMedia(null)}
              style={{ position: 'absolute', top: 50, right: 20, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 25 }}
            >
              <MaterialIcons name="close" size={30} color="#fff" />
            </Pressable>
            {zoomMedia?.type === 'image' && (
              <Image
                source={{ uri: zoomMedia.url }}
                style={{ width: '100%', height: '80%' }}
                resizeMode="contain"
              />
            )}
            {zoomMedia?.type === 'video' && (
              <Video
                source={{ uri: zoomMedia.url }}
                style={{ width: '100%', height: '80%' }}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay
              />
            )}
          </View>
        </Modal>

      </PageContainer>
    </AuthGate>
  );
}
