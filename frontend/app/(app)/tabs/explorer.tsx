import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  ScrollView,
} from 'react-native';

import PageContainer from 'components/PageContainer';
import { useRouter } from 'expo-router';
import AuthGate from 'app/auth-gate';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';

/* ---------------------------------------------
   TYPES
---------------------------------------------- */

type ContributionType =
  | 'idee'
  | 'solution'
  | 'besoin'
  | 'probleme'
  | 'retour'
  | 'suggestion';

type ImpactLevel = 'faible' | 'modere' | 'fort';

/* Correction définitive du problème TS2339 */
type ResponseStatus = 'non-traitee' | 'en-cours' | 'traitee' | 'refusee';

interface Contribution {
  id: string;
  type: ContributionType;
  titre: string;
  description: string;
  impact: ImpactLevel;
  tags: string[];
  attachments: any[];
  createdAt: string;
  reactions: {
    like: number;
    idea: number;
    important: number;
    same: number;
    view: number;
  };
  comments: {
    id: string;
    text: string;
    createdAt: string;
  }[];
  response?: {
    text: string;
    status: ResponseStatus;
    updatedAt: string;
  };
}

const STORAGE_KEY = 'contributionsData';

/* ---------------------------------------------
   COMPOSANT PRINCIPAL
---------------------------------------------- */

export default function Explorer() {
  const router = useRouter();
  const [allContributions, setAllContributions] = useState<Contribution[]>([]);
  const [filtered, setFiltered] = useState<Contribution[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'populaires' | 'recentes' | 'tendances'>('populaires');

  const [selected, setSelected] = useState<Contribution | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [newComment, setNewComment] = useState('');
  const [newResponse, setNewResponse] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ResponseStatus | null>(null);
  /* ---------------------------------------------
     RÉACTIONS
  ---------------------------------------------- */
  const addReaction = async (id: string, key: keyof Contribution['reactions']) => {
    const updated = allContributions.map((c) =>
      c.id === id
        ? { ...c, reactions: { ...c.reactions, [key]: c.reactions[key] + 1 } }
        : c
    );

    setAllContributions(updated);
    setFiltered(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  /* ---------------------------------------------
     COMMENTAIRES
  ---------------------------------------------- */
  const addComment = async (id: string, text: string) => {
    const updated = allContributions.map((c) =>
      c.id === id
        ? {
            ...c,
            comments: [
              ...c.comments,
              {
                id: Math.random().toString(36).substring(2, 10),
                text,
                createdAt: new Date().toISOString(),
              },
            ],
          }
        : c
    );

    setAllContributions(updated);
    setFiltered(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  /* ---------------------------------------------
     RÉPONSE DÉLÉGUÉE (corrigée)
  ---------------------------------------------- */
  const addResponse = async (id: string, text: string, status: ResponseStatus) => {
    const updated = allContributions.map((c) =>
      c.id === id
        ? {
            ...c,
            response: {
              text,
              status,
              updatedAt: new Date().toISOString(),
            },
          }
        : c
    );

    setAllContributions(updated);
    setFiltered(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  /* ---------------------------------------------
     Chargement des contributions
  ---------------------------------------------- */
  useEffect(() => {
    const load = async () => {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (!saved) return;

      try {
        const parsed: Contribution[] = JSON.parse(saved);
        setAllContributions(parsed);
        setFiltered(parsed);
      } catch {}
    };

    load();
  }, []);

  /* ---------------------------------------------
     Recherche
  ---------------------------------------------- */
  useEffect(() => {
    if (!search.trim()) {
      setFiltered(allContributions);
      return;
    }

    const s = search.toLowerCase();

    const results = allContributions.filter((c) =>
      c.titre.toLowerCase().includes(s) ||
      c.description.toLowerCase().includes(s) ||
      c.tags.some((t) => t.toLowerCase().includes(s))
    );

    setFiltered(results);
  }, [search, allContributions]);

  /* ---------------------------------------------
     Tri selon l’onglet
  ---------------------------------------------- */
  const getSorted = () => {
    if (activeTab === 'recentes') {
      return [...filtered].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );
    }

    if (activeTab === 'tendances') {
      return [...filtered].sort((a, b) => {
        const scoreA = a.impact === 'fort' ? 2 : a.impact === 'modere' ? 1 : 0;
        const scoreB = b.impact === 'fort' ? 2 : b.impact === 'modere' ? 1 : 0;
        return scoreB - scoreA;
      });
    }

    return [...filtered].sort((a, b) => {
      const totalA =
        a.reactions.like +
        a.reactions.idea +
        a.reactions.important +
        a.reactions.same +
        a.reactions.view;

      const totalB =
        b.reactions.like +
        b.reactions.idea +
        b.reactions.important +
        b.reactions.same +
        b.reactions.view;

      return totalB - totalA;
    });
  };

  const sorted = getSorted();
  return (
    <AuthGate>
      <PageContainer>

        {/* EN-TÊTE */}
        <Text style={{ color: '#F8FF00', fontSize: 26, fontWeight: '700', marginBottom: 6 }}>
          Explorez les idées
        </Text>
        <Text style={{ color: '#ccc', fontSize: 14, marginBottom: 20 }}>
          Découvrez et soutenez les propositions et retours de vos collègues.
        </Text>

        {/* RECHERCHE */}
        <View style={{ flexDirection: 'row', backgroundColor: '#111', borderRadius: 12, paddingHorizontal: 12, alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: '#333' }}>
          <Text style={{ fontSize: 18, marginRight: 8 }}>🔍</Text>
          <TextInput
            placeholder="Rechercher une contribution..."
            placeholderTextColor="#888"
            value={search}
            onChangeText={setSearch}
            style={{ color: '#fff', flex: 1, paddingVertical: 12, fontSize: 15 }}
          />
        </View>

        {/* ONGLETS DE TRI */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 25 }}>
          {[
            { key: 'populaires', label: '⭐ Poulaire' },
            { key: 'recentes', label: '🆕 Récent' },
            { key: 'tendances', label: '🔥 Tendance' },
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
              <Text numberOfLines={1} style={{ color: activeTab === tab.key ? '#000' : '#fff', fontWeight: '600', fontSize: 12 }}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* LISTE DES CONTRIBUTIONS */}
        {sorted.length === 0 && (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 20, backgroundColor: '#111', padding: 30, borderRadius: 16, borderWidth: 1, borderColor: '#333', borderStyle: 'dashed' }}>
            <Text style={{ fontSize: 45, marginBottom: 15 }}>🚀</Text>
            <Text style={{ color: '#FFD500', fontSize: 20, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>
              L'Explorateur est calme...
            </Text>
            <Text style={{ color: '#aaa', textAlign: 'center', fontSize: 14, lineHeight: 22, marginBottom: 25 }}>
              Il n'y a encore aucune contribution. Soyez le tout premier à lancer la dynamique et partager vos idées !
            </Text>
            <Pressable
              onPress={() => router.push('/contribuer')}
              style={{ backgroundColor: '#F8FF00', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 24 }}
            >
              <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 15 }}>
                💡 Publier une contribution
              </Text>
            </Pressable>
          </View>
        )}

        {sorted.map((c) => (
          <View
            key={c.id}
            style={{
              backgroundColor: '#111',
              padding: 16,
              borderRadius: 12,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.1)',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 6 }}>
              {c.titre}
            </Text>

            <Text style={{ color: '#aaa', fontSize: 13, marginBottom: 10 }}>
              {c.type} • Impact :{' '}
              {c.impact === 'fort'
                ? '🔴 Fort'
                : c.impact === 'modere'
                ? '🟡 Modéré'
                : '🟢 Faible'}
            </Text>

            <Text style={{ color: '#ccc', fontSize: 14, marginBottom: 12 }} numberOfLines={3}>
              {c.description}
            </Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {c.tags.map((tag) => (
                <View
                  key={tag}
                  style={{
                    paddingVertical: 4,
                    paddingHorizontal: 10,
                    borderRadius: 12,
                    backgroundColor: 'rgba(255,255,255,0.1)',
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 12 }}>{tag}</Text>
                </View>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
              <Text style={{ color: '#fff' }}>👍 {c.reactions.like}</Text>
              <Text style={{ color: '#fff' }}>💡 {c.reactions.idea}</Text>
              <Text style={{ color: '#fff' }}>❗ {c.reactions.important}</Text>
              <Text style={{ color: '#fff' }}>🤝 {c.reactions.same}</Text>
              <Text style={{ color: '#fff' }}>👀 {c.reactions.view}</Text>
            </View>

            <Pressable
              onPress={() => {
                setSelected(c);
                setShowModal(true);
              }}
              style={{
                backgroundColor: '#F8FF00',
                paddingVertical: 10,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: '#000', textAlign: 'center', fontWeight: '700' }}>
                Voir la contribution
              </Text>
            </Pressable>
          </View>
        ))}

        {/* MODAL DÉTAILS */}
        <Modal visible={showModal} transparent animationType="fade">
          <Pressable
            onPress={() => setShowModal(false)}
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.7)',
              justifyContent: 'center',
              padding: 20,
            }}
          >
            <Pressable
              onPress={(e) => e.stopPropagation()}
              style={{
                backgroundColor: '#111',
                borderRadius: 12,
                padding: 20,
                maxHeight: '85%',
              }}
            >
              {selected && (
                <ScrollView>

                  {/* TITRE */}
                  <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 10 }}>
                    {selected.titre}
                  </Text>

                  {/* TYPE + IMPACT */}
                  <Text style={{ color: '#aaa', marginBottom: 10 }}>
                    {selected.type} • Impact :{' '}
                    {selected.impact === 'fort'
                      ? '🔴 Fort'
                      : selected.impact === 'modere'
                      ? '🟡 Modéré'
                      : '🟢 Faible'}
                  </Text>

                  {/* DESCRIPTION */}
                  <Text style={{ color: '#ccc', fontSize: 15, marginBottom: 20, lineHeight: 20 }}>
                    {selected.description}
                  </Text>

                  {/* TAGS */}
                  {selected.tags.length > 0 && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
                      {selected.tags.map((tag) => (
                        <View
                          key={tag}
                          style={{
                            paddingVertical: 4,
                            paddingHorizontal: 10,
                            borderRadius: 12,
                            backgroundColor: 'rgba(255,255,255,0.1)',
                          }}
                        >
                          <Text style={{ color: '#fff', fontSize: 12 }}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* PIÈCES JOINTES */}
                  {selected.attachments.length > 0 && (
                    <View style={{ marginBottom: 20 }}>
                      <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 10 }}>
                        Pièces jointes
                      </Text>

                      {selected.attachments.map((att) => (
                        <View
                          key={att.id}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: '#222',
                            padding: 10,
                            borderRadius: 8,
                            marginBottom: 10,
                          }}
                        >
                          <Text style={{ color: '#fff' }}>{att.name}</Text>
                          <Text style={{ color: '#888', fontSize: 12 }}>
                            {att.size ? att.size + ' o' : ''}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* RÉACTIONS */}
                  <View style={{ marginBottom: 20 }}>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 10 }}>
                      Réactions
                    </Text>

                    <View style={{ flexDirection: 'row', gap: 16, marginBottom: 10 }}>
                      <Pressable onPress={() => addReaction(selected.id, 'like')}>
                        <Text style={{ fontSize: 26 }}>👍 {selected.reactions.like}</Text>
                      </Pressable>

                      <Pressable onPress={() => addReaction(selected.id, 'idea')}>
                        <Text style={{ fontSize: 26 }}>💡 {selected.reactions.idea}</Text>
                      </Pressable>

                      <Pressable onPress={() => addReaction(selected.id, 'important')}>
                        <Text style={{ fontSize: 26 }}>❗ {selected.reactions.important}</Text>
                      </Pressable>

                      <Pressable onPress={() => addReaction(selected.id, 'same')}>
                        <Text style={{ fontSize: 26 }}>🤝 {selected.reactions.same}</Text>
                      </Pressable>

                      <Pressable onPress={() => addReaction(selected.id, 'view')}>
                        <Text style={{ fontSize: 26 }}>👀 {selected.reactions.view}</Text>
                      </Pressable>
                    </View>
                  </View>

                  {/* AJOUTER UN COMMENTAIRE */}
                  <View style={{ marginBottom: 20 }}>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 10 }}>
                      Ajouter un commentaire
                    </Text>

                    <TextInput
                      placeholder="Écrire un commentaire..."
                      placeholderTextColor="#666"
                      value={newComment}
                      onChangeText={setNewComment}
                      style={{
                        backgroundColor: '#222',
                        color: '#fff',
                        padding: 10,
                        borderRadius: 8,
                        marginBottom: 10,
                      }}
                    />

                    <Pressable
                      onPress={() => {
                        if (!newComment.trim()) return;
                        addComment(selected.id, newComment.trim());
                        setNewComment('');
                      }}
                      style={{
                        backgroundColor: '#F8FF00',
                        paddingVertical: 10,
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ color: '#000', textAlign: 'center', fontWeight: '700' }}>
                        Envoyer
                      </Text>
                    </Pressable>
                  </View>

                  {/* FERMER */}
                  <Pressable
                    onPress={() => setShowModal(false)}
                    style={{
                      backgroundColor: '#F8FF00',
                      paddingVertical: 12,
                      borderRadius: 8,
                      marginTop: 10,
                    }}
                  >
                    <Text style={{ color: '#000', textAlign: 'center', fontWeight: '700' }}>
                      Fermer
                    </Text>
                  </Pressable>

                </ScrollView>
              )}
            </Pressable>
          </Pressable>
        </Modal>

      </PageContainer>
    </AuthGate>
  );
}
