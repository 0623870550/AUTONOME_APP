import PageContainer from 'components/PageContainer';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from 'lib/supabase';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  Linking,
  StyleSheet,
  Alert
} from 'react-native';
import { useAgentPermission } from '../../context/AgentPermissionContext';
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
      if (!id) return;
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
        // LOGIQUE ADMIN : Si on est admin, on passe. Sinon, on vérifie le rôle métier.
        if (role !== 'admin' && data.role_agent !== roleAgent) {
          Alert.alert("Accès refusé", "Vous n'avez pas les droits pour voir cette alerte.");
          router.back();
          return;
        }

        // On récupère manuellement l'agent pour éviter l'erreur de jointure
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
    Alert.alert(
      "Supprimer l'alerte",
      "Êtes-vous sûr de vouloir supprimer définitivement cette alerte et ses pièces jointes ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            const { error } = await supabase.from('alerte').delete().eq('id', id);
            if (!error) {
              router.back();
            } else {
              Alert.alert("Erreur", "Impossible de supprimer l'alerte.");
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  };

  const openAttachment = async (att: any) => {
    if (att.type === 'image') {
      setViewerImage(att.remoteUrl);
      setViewerVisible(true);
    } else {
      const supported = await Linking.canOpenURL(att.remoteUrl);
      if (supported) {
        await Linking.openURL(att.remoteUrl);
      } else {
        Alert.alert("Erreur", "Impossible d'ouvrir ce type de fichier.");
      }
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
            L'alerte a peut-être été supprimée ou une erreur réseau est survenue.
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

        {/* BOUTON RETOUR STYLE PJ2 */}
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Retour</Text>
        </Pressable>

        <Text style={styles.mainTitle}>📄 Détail de l'alerte</Text>

        <View style={styles.card}>
          <Text style={styles.typeText}>{alerte.type}</Text>

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
              <Text style={[styles.value, { color: alerte.gravite === 'Haute' ? '#FF4444' : '#F8FF00' }]}>
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
              <Text style={{ color: '#fff' }}>
                {att.type === 'image' ? '🖼️ ' : att.type === 'video' ? '🎥 ' : '📄 '}
                {att.name || `Fichier ${index + 1}`}
              </Text>
              <Text style={{ color: '#F8FF00' }}>Voir</Text>
            </Pressable>
          ))
        )}

        {/* BOUTON SUPPRIMER RÉSERVÉ ADMIN */}
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

      {/* MODAL IMAGE */}
      <Modal visible={viewerVisible} transparent>
        <Pressable onPress={() => setViewerVisible(false)} style={styles.modalOverlay}>
          {viewerImage && <Image source={{ uri: viewerImage }} style={styles.fullImage} resizeMode="contain" />}
          <Text style={{ color: '#fff', marginTop: 20 }}>Fermer</Text>
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
  typeText: { color: '#F8FF00', fontSize: 20, fontWeight: 'bold' },
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  fullImage: { width: '90%', height: '70%' }
});