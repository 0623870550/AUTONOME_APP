import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { supabase } from 'lib/supabase';
import PageContainer from 'components/PageContainer';

type AlerteRow = {
  id: string;
  type: string | null;
  lieu: string | null;
  description: string | null;
  gravite: string | null;
  statut: string | null;
  attachments: any[] | null;
  events: any[] | null;
  comment_inte: string | null;
  inserted_at: string | null;
  anonyme: boolean | null;
  created_by: string | null;
};

export default function DelegueDetail() {
  const { id } = useLocalSearchParams();
  const [alerte, setAlerte] = useState<AlerteRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [updating, setUpdating] = useState(false);

  const loadAlerte = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('alerte')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.log('Erreur chargement alerte :', error);
      return;
    }

    setAlerte(data as AlerteRow);
    setComment(data.comment_inte || '');
    setLoading(false);
  };

  useEffect(() => {
    loadAlerte();
  }, []);

  const updateStatut = async (newStatut: string) => {
    if (!alerte) return;

    setUpdating(true);

    const newEvent = {
      type: 'statut',
      statut: newStatut,
      date: new Date().toISOString(),
    };

    const updatedEvents = [...(alerte.events || []), newEvent];

    const { error } = await supabase
      .from('alerte')
      .update({
        statut: newStatut,
        events: updatedEvents,
      })
      .eq('id', alerte.id);

    if (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour le statut.');
      setUpdating(false);
      return;
    }

    setAlerte({ ...alerte, statut: newStatut, events: updatedEvents });
    setUpdating(false);
  };

  const saveComment = async () => {
  if (!alerte) return;

  setUpdating(true);

  // 🟨 NOUVEL ÉVÉNEMENT AUTOMATIQUE
  const newEvent = {
    type: 'commentaire',
    date: new Date().toISOString(),
  };

  const updatedEvents = [...(alerte.events || []), newEvent];

  const { error } = await supabase
    .from('alerte')
    .update({
      comment_inte: comment,
      events: updatedEvents,
    })
    .eq('id', alerte.id);

  if (error) {
    Alert.alert('Erreur', 'Impossible de sauvegarder le commentaire.');
    setUpdating(false);
    return;
  }

  // Mise à jour locale
  setAlerte({
    ...alerte,
    comment_inte: comment,
    events: updatedEvents,
  });

  setUpdating(false);
  Alert.alert('OK', 'Commentaire interne sauvegardé.');
};

  if (loading || !alerte) {
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
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: '#007AFF', marginBottom: 20 }}>← Retour</Text>
        </Pressable>

        <Text style={{ fontSize: 26, fontWeight: 'bold', marginBottom: 10 }}>
          Détail de l’alerte
        </Text>

        {/* Infos principales */}
        <View
          style={{
            padding: 15,
            borderRadius: 10,
            backgroundColor: '#FFFBE6',
            marginBottom: 20,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: '700' }}>
            {alerte.type}
          </Text>
          <Text style={{ marginTop: 4 }}>📍 {alerte.lieu}</Text>
          <Text style={{ marginTop: 4 }}>Gravité : {alerte.gravite}</Text>
          <Text style={{ marginTop: 10, color: '#555' }}>
            {alerte.description}
          </Text>
        </View>

        {/* Pièces jointes */}
        {alerte.attachments && alerte.attachments.length > 0 && (
          <View style={{ marginBottom: 25 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 10 }}>
              Pièces jointes
            </Text>

            {alerte.attachments.map((att, index) => (
              <Image
                key={index}
                source={{ uri: att.remoteUrl }}
                style={{
                  width: '100%',
                  height: 200,
                  borderRadius: 10,
                  marginBottom: 10,
                }}
              />
            ))}
          </View>
        )}

        {/* TIMELINE ULTRA PREMIUM SDMIS */}
<View style={{ marginBottom: 30 }}>
  <Text style={{ fontSize: 22, fontWeight: '700', marginBottom: 15 }}>
    Timeline
  </Text>

  {(alerte.events || []).length === 0 && (
    <Text style={{ color: '#777' }}>Aucun événement pour le moment.</Text>
  )}

  {(alerte.events || []).map((ev, index) => {
    // Détection du type d'événement
    let icon = '🟡';
    let title = 'Événement';

    if (ev.type === 'creation') {
      icon = '🟨';
      title = 'Création de l’alerte';
    }
    if (ev.type === 'statut') {
      icon = '🔄';
      title = `Changement de statut → ${ev.statut}`;
    }
    if (ev.type === 'commentaire') {
      icon = '📝';
      title = 'Commentaire interne ajouté';
    }
    if (ev.type === 'attachment') {
      icon = '📎';
      title = 'Pièce jointe ajoutée';
    }

    return (
      <View
        key={index}
        style={{
          flexDirection: 'row',
          marginBottom: 20,
        }}
      >
        {/* Ligne verticale */}
        <View
          style={{
            width: 4,
            backgroundColor: '#FFD500',
            marginRight: 15,
            borderRadius: 2,
          }}
        />

        {/* Bloc événement */}
        <View
          style={{
            flex: 1,
            backgroundColor: '#fff',
            padding: 15,
            borderRadius: 10,
            ...(Platform.OS === 'web'
              ? { boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.08)' }
              : {
                  shadowColor: '#000',
                  shadowOpacity: 0.08,
                  shadowRadius: 6,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 3,
                }),
          }}
        >
          {/* Icône + titre */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 22, marginRight: 8 }}>{icon}</Text>
            <Text style={{ fontWeight: '700', fontSize: 16 }}>{title}</Text>
          </View>

          {/* Détails éventuels */}
          {ev.statut && (
            <Text style={{ marginTop: 6, color: '#444' }}>
              Nouveau statut :{' '}
              <Text style={{ fontWeight: '700' }}>{ev.statut}</Text>
            </Text>
          )}

          {/* Date */}
          <Text style={{ marginTop: 10, color: '#777', fontSize: 13 }}>
            {new Date(ev.date).toLocaleString('fr-FR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  })}
</View>

        {/* Commentaire interne */}
        <View style={{ marginBottom: 25 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 10 }}>
            Commentaire interne
          </Text>

          <TextInput
            value={comment}
            onChangeText={setComment}
            multiline
            style={{
              backgroundColor: '#fff',
              padding: 10,
              borderRadius: 8,
              minHeight: 100,
              textAlignVertical: 'top',
            }}
          />

          <Pressable
            onPress={saveComment}
            style={{
              marginTop: 10,
              backgroundColor: '#FFD500',
              padding: 12,
              borderRadius: 8,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontWeight: '700' }}>
              Sauvegarder le commentaire
            </Text>
          </Pressable>
        </View>

        {/* Changement de statut */}
        <View style={{ marginBottom: 40 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 10 }}>
            Statut
          </Text>

          <Pressable
            onPress={() => updateStatut('en_cours')}
            style={{
              padding: 12,
              backgroundColor: '#FFB300',
              borderRadius: 8,
              marginBottom: 10,
            }}
          >
            <Text style={{ fontWeight: '700' }}>Mettre en cours</Text>
          </Pressable>

          <Pressable
            onPress={() => updateStatut('analyse')}
            style={{
              padding: 12,
              backgroundColor: '#007AFF',
              borderRadius: 8,
              marginBottom: 10,
            }}
          >
            <Text style={{ fontWeight: '700', color: 'white' }}>
              Mettre en analyse
            </Text>
          </Pressable>

          <Pressable
            onPress={() => updateStatut('cloturee')}
            style={{
              padding: 12,
              backgroundColor: '#2E7D32',
              borderRadius: 8,
            }}
          >
            <Text style={{ fontWeight: '700', color: 'white' }}>
              Clôturer l’alerte
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </PageContainer>
  );
}
