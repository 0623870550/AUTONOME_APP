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
      router.back();
    }
  };

  return (
    <AuthGate>
      <PageContainer>
        <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Text style={{ color: '#F8FF00' }}>← Retour</Text>
            </Pressable>
            <Text style={styles.title}>Publier une actualité</Text>
          </View>

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
                  style={[
                    styles.catBtn,
                    category === cat && styles.catBtnActive,
                  ]}
                >
                  <Text style={[
                    styles.catText,
                    category === cat && styles.catTextActive,
                  ]}>
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Lien Image (Optionnel)</Text>
            <TextInput
              style={styles.input}
              value={imageUrl}
              onChangeText={setImageUrl}
              placeholder="https://..."
              placeholderTextColor="#666"
            />

            <Text style={styles.label}>Contenu</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={content}
              onChangeText={setContent}
              placeholder="Ecrire l'actualité ici..."
              placeholderTextColor="#666"
              multiline
              numberOfLines={10}
            />

            <Pressable onPress={pickDocument} style={[styles.fileBtn, { marginTop: 10 }]}>
              <Text style={styles.fileBtnText}>📎 Joindre un média (Photo, Vidéo, PDF)</Text>
            </Pressable>

            {selectedFile && (
              <View style={styles.selectedFileContainer}>
                {selectedFile.mimeType?.startsWith('image/') ? (
                  <Image source={{ uri: selectedFile.uri }} style={styles.filePreview} />
                ) : (
                  <Text style={styles.fileIcon}>📄</Text>
                )}
                <Text style={styles.fileName} numberOfLines={1}>{selectedFile.name}</Text>
                <Pressable onPress={() => setSelectedFile(null)} style={styles.clearFileBtn}>
                  <Text style={styles.clearFileText}>✕</Text>
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
        </ScrollView>
      </PageContainer>
    </AuthGate>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 25 },
  backButton: { marginBottom: 10 },
  title: { color: '#F8FF00', fontSize: 24, fontWeight: 'bold' },
  form: { gap: 15 },
  label: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 5 },
  input: {
    backgroundColor: '#111',
    color: '#fff',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    fontSize: 16,
  },
  textArea: {
    height: 200,
    textAlignVertical: 'top',
  },
  categoryRow: { flexDirection: 'row', gap: 10 },
  catBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#222',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  catBtnActive: {
    backgroundColor: '#F8FF00',
    borderColor: '#F8FF00',
  },
  catText: { color: '#888', fontWeight: 'bold' },
  catTextActive: { color: '#000' },
  publishBtn: {
    backgroundColor: '#F8FF00',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  publishText: { color: '#000', fontWeight: 'bold', fontSize: 17 },
  fileBtn: {
    backgroundColor: '#222',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F8FF00',
    borderStyle: 'dashed',
    marginTop: -5,
    marginBottom: 10,
  },
  fileBtnText: {
    color: '#F8FF00',
    fontWeight: 'bold',
  },
  selectedFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 10,
  },
  filePreview: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 10,
  },
  fileIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  fileName: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
  },
  clearFileBtn: {
    padding: 10,
  },
  clearFileText: {
    color: '#FF4444',
    fontWeight: 'bold',
    fontSize: 18,
  },
});
