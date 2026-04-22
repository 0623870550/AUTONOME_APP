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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';

import PageContainer from '../../components/PageContainer';
import { useRouter } from 'expo-router';
import AuthGate from '../_auth-gate';
import { supabase } from '../../lib/supabase';
import { useAgentRole } from '../../context/AgentRoleContext';
import { useSession } from '../../context/SupabaseSessionProvider';
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
  score: number;
  votes_count: number;
  image_url?: string | null;
  video_url?: string | null;
  created_at: string;
}

export default function Explorer() {
  const router = useRouter();
  const { session } = useSession();
  const { roleAgent } = useAgentRole();

  const [loading, setLoading] = useState(true);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'tendances' | 'recentes'>('tendances');

  const [selected, setSelected] = useState<Contribution | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [zoomMedia, setZoomMedia] = useState<{ url: string, type: 'image' | 'video' } | null>(null);

  useEffect(() => {
    fetchContributions();
    
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
      query = query.order('votes_count', { ascending: false });
    }

    const { data, error } = await query;
    if (!error) {
      setContributions(data || []);
    }
    setLoading(false);
  };

  const handleLike = async (contributionId: string) => {
    if (!session) return;

    const { error } = await supabase.rpc('increment_contribution_vote', { row_id: contributionId });

    if (error) {
      const current = contributions.find(c => c.id === contributionId);
      if (current) {
        await supabase
          .from('contributions')
          .update({ votes_count: (current.votes_count || 0) + 1 })
          .eq('id', contributionId);
      }
    }
    fetchContributions();
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
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ color: '#F8FF00', fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase' }}>{c.type}</Text>
                    <Text style={{ color: '#666', fontSize: 12 }}>{new Date(c.created_at).toLocaleDateString()}</Text>
                  </View>

                  <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 6 }}>{c.titre}</Text>
                  <Text style={{ color: '#aaa', fontSize: 14, marginBottom: 15 }} numberOfLines={2}>{c.description}</Text>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Pressable 
                      onPress={() => handleLike(c.id)}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#222', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#444' }}
                    >
                      <MaterialIcons name="thumb-up" size={18} color="#F8FF00" />
                      <Text style={{ color: '#fff', fontWeight: 'bold' }}>{c.votes_count || 0}</Text>
                    </Pressable>

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
