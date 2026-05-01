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
  const [linkUrl, setLinkUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [target, setTarget] = useState<'SPP' | 'PATS' | 'ALL'>('ALL');
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
        type: ['image/*', 'video/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedFile(result.assets[0]);
      }
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de sélectionner le fichier.');
    }
  };

  const handlePublish = async () => {
    console.log("Tentative de publication...");
    if (!title.trim() || !content.trim()) {
      return Alert.alert('Erreur', 'Le titre et le contenu sont obligatoires.');
    }

    setLoading(true);

    const publishData = async (imageUrl: string | null) => {
      try {
        const { error } = await supabase
          .from('actualites')
          .insert({ 
              title: title.trim(), 
              content: content.trim(), 
              image_url: imageUrl || null, 
              link_url: linkUrl || null, 
              is_published: true, 
              category: target,
              created_by: (await supabase.auth.getUser()).data.user?.id 
          });






        if (error) throw error;

        Alert.alert('Succès', 'Actualité publiée !');
        setTitle('');
        setContent('');
        setLinkUrl('');
        setSelectedFile(null);
        fetchActualites();
      } catch (insertError: any) {
        console.error("ERREUR INSERTION ACTUALITÉ:", insertError);
        Alert.alert('Erreur', insertError.message);
      } finally {
        setLoading(false);
      }
    };

    if (selectedFile) {
      try {
        const fileName = `${Date.now()}.jpg`;

        const xhr = new XMLHttpRequest();
        const blob: Blob = await new Promise((resolve, reject) => {
          xhr.onload = function () {
            resolve(xhr.response);
          };
          xhr.onerror = function (e) {
            reject(new TypeError("Échec de la lecture locale du fichier (Network request failed)."));
          };
          xhr.responseType = "blob";
          xhr.open("GET", selectedFile.uri, true);
          xhr.send(null);
        });

        const { data, error: uploadError } = await supabase.storage
          .from('actualites-media')
          .upload(fileName, blob, {
            contentType: selectedFile.mimeType || 'image/jpeg',
            upsert: true
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data: publicUrlData } = supabase.storage
          .from('actualites-media')
          .getPublicUrl(fileName);

        publishData(publicUrlData.publicUrl);
      } catch (uploadError: any) {
        setLoading(false);
        Alert.alert(
          'Erreur Upload',
          uploadError.message || "Échec de l'envoi de l'image. Vérifiez votre connexion internet."
        );
      }
    } else {
      publishData(null);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('actualites').delete().eq('id', id);
    if (!error) fetchActualites();
  };

  return (
    <AuthGate>
      <PageContainer>
        <ScrollView contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Text style={{ color: '#F8FF00' }}>← Retour</Text>
            </Pressable>
            <Text style={styles.title}>Admin Actualités</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Titre</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Titre..."
              placeholderTextColor="#666"
            />

            <Text style={styles.label}>Contenu</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={content}
              onChangeText={setContent}
              placeholder="Texte..."
              placeholderTextColor="#666"
              multiline
            />

            <Text style={styles.label}>Lien (Optionnel)</Text>
            <TextInput
              style={styles.input}
              value={linkUrl}
              onChangeText={setLinkUrl}
              placeholder="https://..."
              placeholderTextColor="#666"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Cible</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {['ALL', 'SPP', 'PATS'].map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setTarget(t as any)}
                  style={[styles.chip, target === t && styles.chipActive]}
                >
                  <Text style={[styles.chipText, target === t && styles.chipTextActive]}>{t}</Text>
                </Pressable>
              ))}
            </View>


            <Pressable onPress={pickDocument} style={styles.fileBtn}>
              <Text style={styles.fileBtnText}>📎 Joindre une photo</Text>
            </Pressable>

            {selectedFile && (
              <Text style={{ color: '#F8FF00', textAlign: 'center' }}>Fichier prêt</Text>
            )}

            <Pressable
              style={[styles.publishBtn, loading && { opacity: 0.5 }]}
              onPress={handlePublish}
              disabled={loading}
            >
              <Text style={styles.publishText}>
                {loading ? 'Publication...' : '🚀 Publier'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Actualités publiées</Text>

          {loadingList ? (
            <ActivityIndicator color="#F8FF00" />
          ) : (
            <View style={styles.newsList}>
              {actualites.map((item) => (
                <View key={item.id} style={styles.newsCardRow}>
                  <Text style={styles.newsTitleRow} numberOfLines={1}>{item.title}</Text>
                  <Pressable onPress={() => handleDelete(item.id)}>
                    <Text style={{ fontSize: 18 }}>🗑️</Text>
                  </Pressable>
                </View>
              ))}
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
  form: { gap: 15, backgroundColor: '#111', padding: 15, borderRadius: 15 },
  label: { color: '#aaa', fontSize: 13, textTransform: 'uppercase' },
  input: { backgroundColor: '#000', color: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#333' },
  textArea: { height: 100, textAlignVertical: 'top' },
  publishBtn: { backgroundColor: '#F8FF00', padding: 15, borderRadius: 8, alignItems: 'center' },
  publishText: { color: '#000', fontWeight: 'bold' },
  fileBtn: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#F8FF00', borderStyle: 'dashed', alignItems: 'center' },
  fileBtnText: { color: '#F8FF00', fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#333', marginVertical: 30 },
  sectionTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  newsList: { gap: 10 },
  newsCardRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#111', padding: 15, borderRadius: 10 },
  newsTitleRow: { color: '#fff', flex: 1, marginRight: 10 },
  chip: { flex: 1, paddingVertical: 8, borderRadius: 12, backgroundColor: '#000', borderWidth: 1, borderColor: '#333', alignItems: 'center' },
  chipActive: { backgroundColor: '#F8FF00', borderColor: '#F8FF00' },
  chipText: { color: '#888', fontWeight: 'bold', fontSize: 12 },
  chipTextActive: { color: '#000' },
});

