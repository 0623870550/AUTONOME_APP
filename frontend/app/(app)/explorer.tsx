import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert as RNAlert,
} from 'react-native';

import PageContainer from '../../components/PageContainer';
import { useRouter } from 'expo-router';
import AuthGate from '../_auth-gate';
import { supabase } from '../../lib/supabase';
import { useAgentRole } from '../../context/AgentRoleContext';
import { useSession } from '../../context/SupabaseSessionProvider';
import React from 'react';

type ContributionType = 'idee' | 'solution' | 'besoin' | 'probleme' | 'retour' | 'suggestion';
type ResponseStatus = 'non-traitee' | 'en-cours' | 'traitee' | 'refusee';

interface Contribution {
  id: string;
  type: ContributionType;
  titre: string;
  description: string;
  impact: string;
  tags: string[];
  role_agent?: string | null;
  anonyme: boolean;
  score: number;
  created_at: string;
}

export default function Explorer() {
  const router = useRouter();
  const { session } = useSession();
  const { roleAgent } = useAgentRole();

  const [loading, setLoading] = useState(true);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'tendances' | 'recentes' | 'populaires'>('tendances');

  const [selected, setSelected] = useState<Contribution | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchContributions();
    
    // Abonnement Realtime
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

  const fetchContributions = async () => {
    setLoading(true);
    let query = supabase.from('contributions').select('*');

    if (activeTab === 'recentes') {
      query = query.order('created_at', { ascending: false });
    } else {
      query = query.order('score', { ascending: false });
    }

    const { data, error } = await query;
    if (!error) {
      setContributions(data || []);
    }
    setLoading(false);
  };

  const handleVote = async (contributionId: string, val: number) => {
    if (!session) return;

    // 1. Enregistrer le vote
    const { error: voteError } = await supabase
      .from('contribution_votes')
      .upsert({
        user_id: session.user.id,
        contribution_id: contributionId,
        vote_type: val,
      });

    if (voteError) {
      if (voteError.code === '23505') {
        RNAlert.alert('Info', 'Vous avez déjà voté pour cette proposition.');
      } else {
        console.error(voteError);
      }
      return;
    }

    // 2. Mettre à jour le score global (incrément/décrément)
    // Pour simplifier ici on utilise une rpc ou un update direct si on a le score actuel
    const current = contributions.find(c => c.id === contributionId);
    if (current) {
      const { error: updateError } = await supabase
        .from('contributions')
        .update({ score: (current.score || 0) + val })
        .eq('id', contributionId);
      
      if (updateError) console.error(updateError);
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
            Découvrir
          </Text>
          <Pressable 
            onPress={() => router.push('/')}
            style={{ backgroundColor: '#222', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#333' }}
          >
            <Text style={{ color: '#aaa', fontSize: 12, fontWeight: 'bold' }}>✕ Quitter</Text>
          </Pressable>
        </View>
        <Text style={{ color: '#ccc', fontSize: 14, marginBottom: 20 }}>
          Découvrez et soutenez les propositions de vos collègues.
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
          <ScrollView>
            {filtered.map((c) => (
              <View key={c.id} style={{ backgroundColor: '#111', padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#333' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                   <Text style={{ color: '#F8FF00', fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase' }}>{c.type}</Text>
                   <Text style={{ color: '#666', fontSize: 12 }}>{new Date(c.created_at).toLocaleDateString()}</Text>
                </View>

                <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 6 }}>{c.titre}</Text>
                <Text style={{ color: '#aaa', fontSize: 14, marginBottom: 15 }} numberOfLines={3}>{c.description}</Text>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                     <Pressable 
                        onPress={() => handleVote(c.id, 1)}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#222', padding: 8, borderRadius: 10 }}
                     >
                        <Text style={{ fontSize: 18 }}>👍</Text>
                        <Text style={{ color: '#34C759', fontWeight: 'bold' }}>{c.score > 0 ? `+${c.score}` : c.score < 0 ? 0 : 0}</Text>
                     </Pressable>
                     <Pressable 
                        onPress={() => handleVote(c.id, -1)}
                        style={{ backgroundColor: '#222', padding: 8, borderRadius: 10 }}
                     >
                        <Text style={{ fontSize: 18 }}>👎</Text>
                     </Pressable>
                  </View>

                  <Pressable 
                    onPress={() => { setSelected(c); setShowModal(true); }}
                    style={{ backgroundColor: 'rgba(248, 255, 0, 0.1)', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 10, borderWidth: 1, borderColor: '#F8FF00' }}
                  >
                    <Text style={{ color: '#F8FF00', fontWeight: 'bold' }}>Détails</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        <Modal visible={showModal} transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 20 }}>
            {selected && (
              <ScrollView style={{ backgroundColor: '#111', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#333' }}>
                <Text style={{ color: '#F8FF00', fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>{selected.titre}</Text>
                <Text style={{ color: '#ccc', fontSize: 16, lineHeight: 22, marginBottom: 20 }}>{selected.description}</Text>
                
                <View style={{ backgroundColor: '#222', padding: 15, borderRadius: 12, marginBottom: 20 }}>
                   <Text style={{ color: '#888', marginBottom: 5 }}>Publié par :</Text>
                   <Text style={{ color: '#fff', fontWeight: 'bold' }}>{selected.anonyme ? '👤 Agent Anonyme' : `👤 Un agent (${selected.role_agent})`}</Text>
                </View>

                <Pressable onPress={() => setShowModal(false)} style={{ backgroundColor: '#F8FF00', padding: 15, borderRadius: 12, alignItems: 'center' }}>
                   <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 16 }}>Fermer</Text>
                </Pressable>
              </ScrollView>
            )}
          </View>
        </Modal>

      </PageContainer>
    </AuthGate>
  );
}

