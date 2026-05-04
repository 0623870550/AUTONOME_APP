import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  Platform,
} from 'react-native';
import { supabase } from '../../../lib/supabase';
import PageContainer from '../../../components/PageContainer';
import AuthGate from '../../_auth-gate';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

interface ContributionPending {
  id: string;
  titre: string;
  image_url: string | null;
  video_url?: string | null;
  created_at: string;
  created_by: string;
  agents: {
    nom: string;
    prenom: string;
  } | null;
}

export default function ModerationPropositions() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [propositions, setPropositions] = useState<ContributionPending[]>([]);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    // On récupère d'abord les contributions
    const { data, error } = await supabase
      .from('contributions')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      console.error("Détails de l'erreur Supabase (Moderation) :", error);
      Alert.alert('Erreur', 'Impossible de charger les propositions.');
    } else if (data) {
      // On récupère les profils des auteurs pour chaque contribution
      const authorIds = [...new Set(data.map(item => item.created_by))].filter(Boolean);
      
      if (authorIds.length > 0) {
        const { data: agentsData } = await supabase
          .from('agents')
          .select('id, nom, prenom')
          .in('id', authorIds);

        const agentsMap = (agentsData || []).reduce((acc: any, agent: any) => {
          acc[agent.id] = agent;
          return acc;
        }, {});

        const merged = data.map(item => ({
          ...item,
          agents: agentsMap[item.created_by] || null
        }));
        setPropositions(merged);
      } else {
        setPropositions(data);
      }
    }
    setLoading(false);
  };

  const handleValidate = async (id: string) => {
    const { error } = await supabase
      .from('contributions')
      .update({ 
        status: 'validated',
        valide: true 
      })
      .eq('id', id);

    if (error) {
      Alert.alert('Erreur', 'Validation échouée.');
    } else {
      setPropositions((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const executeDelete = async (item: ContributionPending) => {
    // Nettoyage Storage
    const storage = supabase.storage.from('propositions');
    if (item.image_url) {
      const filePath = item.image_url.split('/propositions/')[1];
      if (filePath) await storage.remove([filePath]);
    }
    if (item.video_url) {
      const filePath = item.video_url.split('/propositions/')[1];
      if (filePath) await storage.remove([filePath]);
    }

    const { error } = await supabase
      .from('contributions')
      .delete()
      .eq('id', item.id);

    if (error) {
      Alert.alert('Erreur', 'Suppression échouée.');
    } else {
      setPropositions((prev) => prev.filter((p) => p.id !== item.id));
    }
  };

  const handleDelete = (id: string) => {
    const item = propositions.find(p => p.id === id);
    if (!item) return;

    const msg = 'Voulez-vous vraiment supprimer cette proposition ?';
    
    if (Platform.OS === 'web') {
      if (window.confirm(msg)) {
        executeDelete(item);
      }
    } else {
      Alert.alert(
        'Confirmation',
        msg,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: () => executeDelete(item),
          },
        ]
      );
    }
  };

  const renderItem = ({ item }: { item: ContributionPending }) => (
    <View style={styles.card}>
      {item.image_url && (
        <Image source={{ uri: item.image_url }} style={styles.image} />
      )}
      <View style={styles.cardContent}>
        <Text style={styles.title}>{item.titre}</Text>
        <Text style={styles.author}>
          Par : {item.agents ? `${item.agents.prenom} ${item.agents.nom}` : 'Agent inconnu'}
        </Text>
        <Text style={styles.date}>
          Le {new Date(item.created_at).toLocaleDateString('fr-FR')}
        </Text>

        <View style={styles.actions}>
          <Pressable
            style={[styles.btn, styles.btnValidate]}
            onPress={() => handleValidate(item.id)}
          >
            <Text style={styles.btnText}>✅ Valider</Text>
          </Pressable>
          <Pressable
            style={[styles.btn, styles.btnDelete]}
            onPress={() => handleDelete(item.id)}
          >
            <Text style={styles.btnText}>🗑️ Supprimer</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );

  return (
    <AuthGate>
      <PageContainer>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={{ color: '#F8FF00' }}>← Retour</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Modération</Text>
        </View>

        {loading ? (
          <ActivityIndicator color="#F8FF00" style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={propositions}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 50 }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>Aucune proposition en attente ✨</Text>
              </View>
            }
          />
        )}
      </PageContainer>
    </AuthGate>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 20 },
  backButton: { marginBottom: 10 },
  headerTitle: { color: '#F8FF00', fontSize: 24, fontWeight: 'bold' },
  card: {
    backgroundColor: '#111',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
  },
  image: { width: '100%', height: 150, resizeMode: 'cover' },
  cardContent: { padding: 15 },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  author: { color: '#F8FF00', fontSize: 14, marginBottom: 2 },
  date: { color: '#666', fontSize: 12, marginBottom: 15 },
  actions: { flexDirection: 'row', gap: 10 },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnValidate: { backgroundColor: 'rgba(76, 175, 80, 0.2)', borderWidth: 1, borderColor: '#4CAF50' },
  btnDelete: { backgroundColor: 'rgba(244, 67, 54, 0.2)', borderWidth: 1, borderColor: '#F44336' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  empty: { marginTop: 100, alignItems: 'center' },
  emptyText: { color: '#666', fontSize: 16 },
});
