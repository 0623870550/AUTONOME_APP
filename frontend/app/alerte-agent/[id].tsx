import PageContainer from 'components/PageContainer';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase, getPublicMediaUrl } from 'lib/supabase';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, Text, View, Linking, StyleSheet, Alert, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAgentPermission } from '../../context/AgentPermissionContext';

const getStatusInfo = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'nouvelle':
    case 'pending':
      return { label: 'Nouvelle', color: '#888', icon: 'fiber-new', bg: 'rgba(255, 255, 255, 0.05)' };
    case 'en cours':
    case 'en_cours':
      return { label: 'En cours', color: '#FF9500', icon: 'play-circle-outline', bg: 'rgba(255, 149, 0, 0.1)' };
    case 'analyse':
      return { label: 'Analyse', color: '#F8FF00', icon: 'search', bg: 'rgba(248, 255, 0, 0.1)' };
    case 'traitée':
    case 'cloturee':
    case 'treated':
      return { label: 'Traitée', color: '#4CAF50', icon: 'check-circle', bg: 'rgba(76, 175, 80, 0.1)' };
    default:
      return { label: status || 'Inconnu', color: '#666', icon: 'help', bg: 'rgba(255, 255, 255, 0.05)' };
  }
};
import { useAgentRole } from '../../context/AgentRoleContext';
import { useSession } from '../../context/SupabaseSessionProvider';

export default function AlerteAgentDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { session } = useSession();
  const { roleAgent } = useAgentRole();
  const { role } = useAgentPermission();

  const [alerte, setAlerte] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadAlerte = async () => {
      if (!id || id === 'undefined') {
        setLoading(false);
        return;
      }

      setLoading(true);

      const { data, error } = await supabase
        .from('alerte')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error("Erreur de connexion Supabase (alerte) :", error);
      }

      if (data) {
        if (role !== 'admin' && data.role_agent !== roleAgent) {
          Alert.alert("Accès refusé", "Vous n'avez pas les droits pour voir cette alerte.");
          router.back();
          return;
        }

        if (!data.anonyme) {
          const agentId = data.agent_id || data.created_by;
          if (agentId) {
            const { data: agentData } = await supabase
              .from('agents')
              .select('nom, prenom')
              .eq('id', agentId)
              .single();
            if (agentData) {
              data.agents = agentData;
            }
          }
        }

        setAlerte(data);
      }
      setLoading(false);
    };

    loadAlerte();
  }, [id, session, roleAgent, role]);



  const handleDelete = async () => {
    const executeDelete = async () => {
      setIsDeleting(true);
      try {
        const { error } = await supabase.from('alerte').delete().eq('id', id);
        if (error) throw error;
        router.back();
      } catch (err: any) {
        console.error("Erreur de suppression:", err.message);
        if (Platform.OS === 'web') alert("Erreur: Impossible de supprimer l'alerte.");
        else Alert.alert("Erreur", "Impossible de supprimer l'alerte.");
      } finally {
        setIsDeleting(false);
      }
    };

    const msg = "Êtes-vous sûr de vouloir supprimer définitivement cette alerte et ses pièces jointes ?";

    if (Platform.OS === 'web') {
      if (window.confirm(msg)) {
        executeDelete();
      }
    } else {
      Alert.alert(
        "Supprimer l'alerte",
        msg,
        [
          { text: "Annuler", style: "cancel" },
          { text: "Supprimer", style: "destructive", onPress: executeDelete }
        ]
      );
    }
  };

  const openAttachment = async (att: any) => {
    try {
      const url = att.remoteUrl || getPublicMediaUrl(att.name || att.path);

      if (!url) {
        Alert.alert("Erreur", "Impossible de localiser le fichier.");
        return;
      }

      if (att.type === 'image') {
        setViewerImage(url);
        setViewerVisible(true);
      } else {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          await Linking.openURL(url);
        }
      }
    } catch (e) {
      console.error("Erreur openAttachment:", e);
      Alert.alert("Erreur", "Impossible d'ouvrir ce fichier.");
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <View style={styles.centered}><ActivityIndicator size="large" color="#F8FF00" /></View>
      </PageContainer>
    );
  }

  if (!alerte) {
    return (
      <PageContainer>
        <View style={styles.centered}>
          <Text style={{ fontSize: 40, marginBottom: 15 }}>⚠️</Text>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
            Impossible de charger cette alerte
          </Text>
          <Text style={{ color: '#aaa', textAlign: 'center', marginHorizontal: 20, marginBottom: 20 }}>
            L'alerte a peut-être été supprimée ou une erreur réseau est survenue. (ID: {String(id)})
          </Text>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Retour</Text>
          </Pressable>
        </View>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Retour</Text>
        </Pressable>

        <Text style={styles.mainTitle}>📄 Détail de l'alerte</Text>

        <View style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.typeText}>{alerte.type}</Text>
            {(() => {
              const status = getStatusInfo(alerte.statut);
              return (
                <View style={{ backgroundColor: status.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: status.color, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <MaterialIcons name={status.icon as any} size={14} color={status.color} />
                  <Text style={{ color: status.color, fontSize: 11, fontWeight: 'bold' }}>{status.label.toUpperCase()}</Text>
                </View>
              );
            })()}
          </View>

          <View style={styles.divider} />

          <Text style={styles.label}>Déclarant :</Text>
          <Text style={styles.value}>
            {alerte.anonyme
              ? "👤 Anonyme (Option activée)"
              : `${alerte.agents?.prenom || ''} ${alerte.agents?.nom || 'Inconnu'}`
            }
          </Text>

          <Text style={styles.label}>Localisation :</Text>
          <Text style={styles.value}>{alerte.lieu || 'Non précisé'}</Text>

          <Text style={styles.label}>Message :</Text>
          <Text style={styles.value}>{alerte.description}</Text>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Gravité :</Text>
              <Text style={[styles.value, { color: alerte.gravite === 'important' || alerte.gravite === 'Haute' ? '#FF4444' : '#F8FF00' }]}>
                {alerte.gravite}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Date :</Text>
              <Text style={styles.value}>
                {new Date(alerte.inserted_at).toLocaleDateString('fr-FR')}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>📎 Pièces jointes (Documents, Photos, Vidéos)</Text>

        {(!alerte.attachments || alerte.attachments.length === 0) ? (
          <Text style={{ color: '#666' }}>Aucun fichier joint.</Text>
        ) : (
          alerte.attachments.map((att: any, index: number) => (
            <Pressable key={index} onPress={() => openAttachment(att)} style={styles.attachmentItem}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={{ color: '#fff' }} numberOfLines={1}>
                  {att.type === 'image' ? '🖼️ ' : att.type === 'video' ? '🎥 ' : '📄 '}
                  {att.name || `Fichier ${index + 1}`}
                </Text>
              </View>
              <Text style={{ color: '#F8FF00', fontWeight: 'bold' }}>Voir</Text>
            </Pressable>
          ))
        )}

        {role === 'admin' && (
          <Pressable
            onPress={handleDelete}
            disabled={isDeleting}
            style={[styles.deleteButton, { opacity: isDeleting ? 0.5 : 1 }]}
          >
            <Text style={styles.deleteButtonText}>
              {isDeleting ? "Suppression..." : "🗑️ Supprimer l'alerte"}
            </Text>
          </Pressable>
        )}
      </ScrollView>

      <Modal visible={viewerVisible} transparent animationType="fade">
        <Pressable onPress={() => setViewerVisible(false)} style={styles.modalOverlay}>
          {viewerImage && <Image source={{ uri: viewerImage }} style={styles.fullImage} resizeMode="contain" />}
          <View style={{ backgroundColor: '#F8FF00', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginTop: 20 }}>
            <Text style={{ color: '#000', fontWeight: 'bold' }}>Fermer</Text>
          </View>
        </Pressable>
      </Modal>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backButton: {
    backgroundColor: '#333',
    alignSelf: 'flex-start',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20
  },
  backButtonText: { color: '#F8FF00', fontWeight: 'bold' },
  mainTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  card: { backgroundColor: '#1a1a1a', borderRadius: 15, padding: 20, borderWidth: 1, borderColor: '#333' },
  typeText: { color: '#F8FF00', fontSize: 20, fontWeight: 'bold', textTransform: 'capitalize' },
  divider: { height: 1, backgroundColor: '#333', marginVertical: 15 },
  label: { color: '#888', fontSize: 12, textTransform: 'uppercase', marginBottom: 2 },
  value: { color: '#fff', fontSize: 16, marginBottom: 15 },
  row: { flexDirection: 'row' },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 30, marginBottom: 15 },
  attachmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#222',
    borderRadius: 10,
    marginBottom: 10
  },
  deleteButton: {
    marginTop: 40,
    backgroundColor: '#FF3B30',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 40
  },
  deleteButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  fullImage: { width: '95%', height: '80%' }
});