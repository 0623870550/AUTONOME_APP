import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { supabase } from '../../../lib/supabase';
import PageContainer from '../../../components/PageContainer';
import AuthGate from '../../_auth-gate';
import { useRouter } from 'expo-router';
import { useSession } from '../../../context/SupabaseSessionProvider';
import * as DocumentPicker from 'expo-document-picker';

export default function AdminActualites() {
  const router = useRouter();
  const { session } = useSession();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [category, setCategory] = useState<'GENERAL' | 'SPP' | 'PATS'>('GENERAL');
  const [loading, setLoading] = useState(false);

  // État pour la liste des actualités
  const [actualites, setActualites] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  useEffect(() => {
    fetchActualites();
  }, []);

  const fetchActualites = async () => {
    setLoadingList(true);
    const { data, error } = await supabase
      .from('actualites')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) {
      setActualites(data || []);
    }
    setLoadingList(false);
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'video/*', 'application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedFile(result.assets[0]);
      }
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de sélectionner le fichier.');
    }
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = () => {
      executeDelete(id);
    };

    if (Platform.OS === 'web') {
      if (window.confirm("Voulez-vous vraiment supprimer cette actualité ?")) {
        confirmDelete();
      }
    } else {
      Alert.alert(
        "Suppression",
        "Voulez-vous vraiment supprimer cette actualité ?",
        [
          { text: "Annuler", style: "cancel" },
          { text: "Supprimer", style: "destructive", onPress: confirmDelete }
        ]
      );
    }
  };

  const executeDelete = async (id: string) => {
    const { error } = await supabase.from('actualites').delete().eq('id', id);
    if (error) {
      Alert.alert("Erreur", "Impossible de supprimer l'actualité.");
    } else {
      fetchActualites();
    }
  };

  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) {
      return Alert.alert('Erreur', 'Le titre et le contenu sont obligatoires.');
    }

    setLoading(true);

    let finalImageUrl = imageUrl.trim() || null;

    if (selectedFile) {
      try {
        const fileExt = selectedFile.name.split('.').pop() || 'bin';
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

        const response = await fetch(selectedFile.uri);
        const blob = await response.blob();

        const { error: uploadError } = await supabase.storage
          .from('actualites-media')
          .upload(filePath, blob, {
            contentType: selectedFile.mimeType || 'application/octet-stream',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('actualites-media')
          .getPublicUrl(filePath);

        finalImageUrl = publicUrlData.publicUrl;
      } catch (uploadError: any) {
        setLoading(false);
        return Alert.alert('Erreur d\'upload', uploadError.message || "Le fichier n'a pas pu être envoyé.");
      }
    }

    const { error } = await supabase.from('actualites').insert([
      {
        title: title.trim(),
        content: content.trim(),
        image_url: finalImageUrl,
        category,
        created_by: session?.user.id,
      },
    ]);

    setLoading(false);

    if (error) {
      Alert.alert('Erreur', error.message);
    } else {
      Alert.alert('Succès', 'Actualité publiée avec succès !');
      // Reset form
      setTitle('');
      setContent('');
      setImageUrl('');
      setSelectedFile(null);
      setCategory('GENERAL');
      // Refresh list
      fetchActualites();
    }
  };

  return (
    <AuthGate>
      <PageContainer>
        <ScrollView contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Text style={{ color: '#F8FF00' }}>← Retour</Text>
            </Pressable>
            <Text style={styles.title}>Dashboard Actualités</Text>
          </View>

          {/* FORMULAIRE DE CRÉATION */}
          <View style={styles.form}>
            <Text style={styles.label}>Titre</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Titre de l'actu..."
              placeholderTextColor="#666"
            />

            <Text style={styles.label}>Cible</Text>
            <View style={styles.categoryRow}>
              {['GENERAL', 'SPP', 'PATS'].map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => setCategory(cat as any)}
                  style={[styles.catBtn, category === cat && styles.catBtnActive]}
                >
                  <Text style={[styles.catText, category === cat && styles.catTextActive]}>
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Contenu</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={content}
              onChangeText={setContent}
              placeholder="Ecrire l'actualité ici..."
              placeholderTextColor="#666"
              multiline
              numberOfLines={6}
            />

            <Pressable onPress={pickDocument} style={styles.fileBtn}>
              <Text style={styles.fileBtnText}>📎 Joindre un média</Text>
            </Pressable>

            {selectedFile && (
              <View style={styles.selectedFileContainer}>
                <Text style={styles.fileName} numberOfLines={1}>✅ {selectedFile.name}</Text>
                <Pressable onPress={() => setSelectedFile(null)}>
                  <Text style={{ color: '#ff4444', fontWeight: 'bold' }}>Supprimer</Text>
                </Pressable>
              </View>
            )}

            <Pressable
              style={[styles.publishBtn, loading && { opacity: 0.5 }]}
              onPress={handlePublish}
              disabled={loading}
            >
              <Text style={styles.publishText}>
                {loading ? 'Publication...' : '🚀 Publier l\'actualité'}
              </Text>
            </Pressable>
          </View>

          {/* LISTE DES ACTUALITÉS PUBLIÉES */}
          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Actualités publiées</Text>

          {loadingList ? (
            <ActivityIndicator color="#F8FF00" style={{ marginTop: 20 }} />
          ) : (
            <View style={styles.newsList}>
              {actualites.map((item) => (
                <View key={item.id} style={styles.newsCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.newsTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.newsInfo}>
                      Cible: {item.category} • {new Date(item.created_at).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                  <Pressable onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                    <Text style={styles.deleteBtnText}>🗑️</Text>
                  </Pressable>
                </View>
              ))}
              {actualites.length === 0 && (
                <Text style={styles.emptyText}>Aucune actualité publiée pour le moment.</Text>
              )}
            </View>
          )}

        </ScrollView>
      </PageContainer>
    </AuthGate>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 25 },
  backButton: { marginBottom: 10 },
  title: { color: '#F8FF00', fontSize: 24, fontWeight: 'bold' },
  form: { gap: 15, backgroundColor: '#111', padding: 15, borderRadius: 15, borderWidth: 1, borderColor: '#333' },
  label: { color: '#aaa', fontSize: 13, fontWeight: '600', textTransform: 'uppercase' },
  input: {
    backgroundColor: '#000',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    fontSize: 15,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  categoryRow: { flexDirection: 'row', gap: 8 },
  catBtn: { flex: 1, padding: 10, borderRadius: 8, backgroundColor: '#222', alignItems: 'center' },
  catBtnActive: { backgroundColor: '#F8FF00' },
  catText: { color: '#888', fontWeight: 'bold', fontSize: 12 },
  catTextActive: { color: '#000' },
  publishBtn: { backgroundColor: '#F8FF00', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  publishText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  fileBtn: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#F8FF00', borderStyle: 'dashed', alignItems: 'center' },
  fileBtnText: { color: '#F8FF00', fontWeight: 'bold' },
  selectedFileContainer: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, backgroundColor: '#222', borderRadius: 8 },
  fileName: { color: '#fff', flex: 1, marginRight: 10 },
  
  divider: { height: 1, backgroundColor: '#333', marginVertical: 30 },
  sectionTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  newsList: { gap: 12 },
  newsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  newsTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  newsInfo: { color: '#666', fontSize: 12, marginTop: 4 },
  deleteBtn: { padding: 10, marginLeft: 10 },
  deleteBtnText: { fontSize: 18 },
  emptyText: { color: '#666', textAlign: 'center', marginTop: 20 },
});
