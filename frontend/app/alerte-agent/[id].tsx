import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { supabase } from 'lib/supabase';
import PageContainer from 'components/PageContainer';
import { useAgentRole } from 'context/AgentRoleContext';

export default function AlerteAgentDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { roleAgent } = useAgentRole(); // 🟨 Rôle SPP/PATS

  const [alerte, setAlerte] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  useEffect(() => {
    if (!roleAgent) return; // On attend que le rôle soit chargé

    const loadAlerte = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('alerte')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        // 🟥 SÉCURITÉ : empêcher un SPP d'ouvrir une alerte PATS (et inversement)
        if (data.role_agent !== roleAgent) {
          alert("Vous n'avez pas accès à cette alerte.");
          router.back();
          return;
        }

        setAlerte(data);
      }

      setLoading(false);
    };

    loadAlerte();
  }, [id, roleAgent]);

  const badge = (statut: string) => {
    const styles: any = {
      en_cours: { color: '#FF9500', label: '🟠 En cours' },
      analyse: { color: '#007AFF', label: '🔵 Analyse' },
      cloturee: { color: '#34C759', label: '🟢 Clôturée' },
      nouvelle: { color: '#FFD500', label: '🟡 Nouvelle' },
    };

    const s = styles[statut] || styles['nouvelle'];

    return (
      <Text style={{ color: s.color, fontWeight: 'bold', marginTop: 4 }}>
        {s.label}
      </Text>
    );
  };

  const openAttachment = (att: any) => {
    if (att.type === 'image') {
      setViewerImage(att.remoteUrl);
      setViewerVisible(true);
    } else {
      router.push(att.remoteUrl);
    }
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
        
        {/* RETOUR */}
        <Pressable onPress={() => router.back()} style={{ marginBottom: 15 }}>
          <Text style={{ color: '#007AFF' }}>← Retour</Text>
        </Pressable>

        {/* TITRE */}
        <Text style={{ fontSize: 26, fontWeight: 'bold', marginBottom: 10 }}>
          📄 Détail de l’alerte
        </Text>

        {/* TYPE */}
        <Text style={{ fontSize: 20, fontWeight: '600' }}>{alerte.type}</Text>

        {/* BADGE */}
        {badge(alerte.statut)}

        {/* INFOS */}
        <View style={{ marginTop: 15 }}>
          <Text style={{ fontWeight: '600' }}>Lieu :</Text>
          <Text style={{ marginBottom: 10 }}>{alerte.lieu}</Text>

          <Text style={{ fontWeight: '600' }}>Description :</Text>
          <Text style={{ marginBottom: 10 }}>{alerte.description}</Text>

          <Text style={{ fontWeight: '600' }}>Gravité :</Text>
          <Text style={{ marginBottom: 10 }}>{alerte.gravite}</Text>

          <Text style={{ fontWeight: '600' }}>Anonyme :</Text>
          <Text style={{ marginBottom: 10 }}>
            {alerte.anonyme ? 'Oui' : 'Non'}
          </Text>

          <Text style={{ fontWeight: '600' }}>Créée le :</Text>
          <Text style={{ marginBottom: 10 }}>
            {new Date(alerte.created_at).toLocaleString('fr-FR')}
          </Text>
        </View>

        {/* PIECES JOINTES */}
        <Text style={{ fontWeight: '600', marginTop: 20, marginBottom: 10 }}>
          Pièces jointes
        </Text>

        {alerte.attachments?.length === 0 && (
          <Text style={{ color: '#666' }}>Aucune pièce jointe.</Text>
        )}

        {alerte.attachments?.map((att: any) => (
          <Pressable
            key={att.id}
            onPress={() => openAttachment(att)}
            style={{
              padding: 10,
              borderWidth: 1,
              borderColor: '#ddd',
              borderRadius: 8,
              marginBottom: 10,
            }}
          >
            <Text>
              {att.type === 'image' ? '🖼️' : att.type === 'video' ? '🎥' : '📄'}{' '}
              {att.name}
            </Text>
          </Pressable>
        ))}

      </ScrollView>

      {/* VIEWER IMAGE */}
      <Modal visible={viewerVisible} transparent animationType="fade">
        <Pressable
          onPress={() => setViewerVisible(false)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.8)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {viewerImage && (
            <Image
              source={{ uri: viewerImage }}
              style={{ width: '90%', height: '70%', resizeMode: 'contain' }}
            />
          )}
        </Pressable>
      </Modal>
    </PageContainer>
  );
}
