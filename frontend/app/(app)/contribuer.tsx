import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  Pressable, Text, TextInput, View, Switch,
  ActivityIndicator, Alert, Image, Platform, Keyboard, ScrollView, StyleSheet
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import PageContainer from '../../components/PageContainer';
import { useSession } from '../../context/SupabaseSessionProvider';
import AuthGate from '../_auth-gate';
import { supabase } from '../../lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
// FIX SDK 54 : On utilise le chemin /legacy
import * as FileSystem from 'expo-file-system/legacy';

// --- POLYFILL MAISON POUR MOBILE ---
const decodeBase64 = (base64: string) => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

export default function Contribuer() {
  const router = useRouter();
  const { session } = useSession();

  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<string | null>(null);
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [impact, setImpact] = useState<'faible' | 'modere' | 'fort'>('modere');
  const [tags, setTags] = useState<string[]>([]);
  const [attachment, setAttachment] = useState<{ uri: string, type: string, name: string } | null>(null);
  const [anonyme, setAnonyme] = useState(false);

  const toggleTag = (tag: string) => {
    setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  // --- LOGIQUE D'UPLOAD UNIVERSELLE (Web + Mobile) ---
  const uploadMedia = async (uri: string, fileType: string) => {
    try {
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const ext = uri.split('.').pop();
      const filePath = `${session?.user.id}/${fileName}.${ext}`;

      let body;

      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        body = await response.blob();
      } else {
        // Fix SDK 54 : Utilisation de la méthode legacy
        const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
        body = decodeBase64(base64);
      }

      const { data, error } = await supabase.storage
        .from('propositions')
        .upload(filePath, body, {
          contentType: fileType,
          upsert: true
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from('propositions').getPublicUrl(filePath);
      return publicUrl;
    } catch (err: any) {
      console.error('❌ Erreur upload:', err);
      return null;
    }
  };

  const pickMedia = async (mode: 'image' | 'video' | 'doc') => {
    if (mode === 'doc') {
      const res = await DocumentPicker.getDocumentAsync({ type: '*/*' });
      if (!res.canceled) setAttachment({ uri: res.assets[0].uri, type: res.assets[0].mimeType || 'application/pdf', name: res.assets[0].name });
    } else {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: mode === 'image' ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.Videos,
        quality: 0.6,
      });
      if (!res.canceled) {
        setAttachment({
          uri: res.assets[0].uri,
          type: mode === 'image' ? 'image/jpeg' : 'video/mp4',
          name: mode === 'image' ? 'media.jpg' : 'media.mp4'
        });
      }
    }
  };

  const handlePublish = async () => {
    if (Platform.OS !== 'web') Keyboard.dismiss();
    if (!type || !titre) return Alert.alert('Attention', 'Le type et le titre sont obligatoires.');

    setLoading(true);
    try {
      const { data: agent } = await supabase.from('agents').select('type_agent').eq('id', session?.user.id).single();
      let rolePropre = agent?.type_agent;
      if (!rolePropre || rolePropre.includes('ou')) rolePropre = 'SPP';

      let fileUrl = null;
      if (attachment) {
        fileUrl = await uploadMedia(attachment.uri, attachment.type);
      }

      // FIX ERREUR 400 : Suppression de doc_url qui n'existe pas en base
      const { error } = await supabase.from('contributions').insert([{
        type, titre: titre.trim(), description: description.trim(), impact, tags,
        role_agent: rolePropre, anonyme,
        image_url: attachment?.type.includes('image') ? fileUrl : null,
        video_url: attachment?.type.includes('video') ? fileUrl : null,
        created_by: session?.user.id,
        created_at: new Date().toISOString()
      }]);

      if (error) throw error;
      Alert.alert('Succès', 'Votre proposition a été envoyée !');
      router.replace('/explorer');
    } catch (err: any) {
      console.error("Détails erreur 400:", err);
      Alert.alert('Erreur', "Impossible de publier. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGate>
      <PageContainer>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>

          <View style={styles.header}>
            <Text style={styles.title}>Proposer</Text>
            <Pressable onPress={() => router.back()} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕ Quitter</Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Publier anonymement</Text>
            <Switch value={anonyme} onValueChange={setAnonyme} trackColor={{ false: '#333', true: '#F8FF00' }} />
          </View>

          <Text style={styles.sectionTitle}>Type de contribution</Text>
          <View style={styles.typeRow}>
            {[
              { key: 'idee', label: '💡 Idée' },
              { key: 'solution', label: '🛠️ Solution' },
              { key: 'besoin', label: '📣 Besoin' },
              { key: 'probleme', label: '🔁 Problème' },
              { key: 'retour', label: '🧩 Retour' },
              { key: 'suggestion', label: '📝 Suggestion' },
            ].map((item) => (
              <Pressable key={item.key} onPress={() => setType(item.key)} style={[styles.typeChip, type === item.key && styles.activeChip]}>
                <Text style={[styles.chipText, type === item.key && styles.activeChipText]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>

          <TextInput placeholder="Titre (Ex: Nouveau matériel...)" placeholderTextColor="#666" value={titre} onChangeText={setTitre} style={styles.input} />
          <TextInput placeholder="Description..." placeholderTextColor="#666" value={description} onChangeText={setDescription} multiline style={[styles.input, styles.textArea]} />

          <Text style={styles.sectionTitle}>Niveau d'impact agent</Text>
          <View style={styles.impactRow}>
            {[
              { key: 'faible', label: 'Faible', color: '#34C759' },
              { key: 'modere', label: 'Modéré', color: '#FF9500' },
              { key: 'fort', label: 'Fort', color: '#FF3B30' },
            ].map((lvl) => (
              <Pressable key={lvl.key} onPress={() => setImpact(lvl.key as any)} style={[styles.impactBtn, impact === lvl.key && styles.activeImpact]}>
                <View style={[styles.dot, { backgroundColor: lvl.color }]} />
                <Text style={[styles.impactText, impact === lvl.key && styles.activeImpactText]}>{lvl.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Média (optionnel)</Text>
          <View style={styles.mediaRow}>
            <Pressable onPress={() => pickMedia('image')} style={styles.mediaBtn}>
              <MaterialIcons name="photo-camera" size={24} color="#F8FF00" />
              <Text style={styles.mediaBtnText}>Photo</Text>
            </Pressable>
            <Pressable onPress={() => pickMedia('video')} style={styles.mediaBtn}>
              <MaterialIcons name="videocam" size={24} color="#F8FF00" />
              <Text style={styles.mediaBtnText}>Vidéo</Text>
            </Pressable>
            <Pressable onPress={() => pickMedia('doc')} style={styles.mediaBtn}>
              <MaterialIcons name="insert-drive-file" size={24} color="#F8FF00" />
              <Text style={styles.mediaBtnText}>Doc</Text>
            </Pressable>
          </View>

          {attachment && (
            <View style={styles.previewContainer}>
              <Text style={styles.previewText}>✓ {attachment.name}</Text>
              <Pressable onPress={() => setAttachment(null)}><Ionicons name="trash-outline" size={18} color="#ff4444" /></Pressable>
            </View>
          )}

          <Text style={styles.sectionTitle}>Tags</Text>
          <View style={styles.tagRow}>
            {['Opérationnel', 'Matériel', 'RH', 'Organisation', 'Sécurité'].map((tag) => (
              <Pressable key={tag} onPress={() => toggleTag(tag)} style={[styles.tagChip, tags.includes(tag) && styles.activeTag]}>
                <Text style={[styles.tagText, tags.includes(tag) && styles.activeTagText]}>{tag}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable onPress={handlePublish} disabled={loading} style={[styles.publishBtn, loading && { opacity: 0.7 }]}>
            {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.publishBtnText}>PUBLIER MA PROPOSITION</Text>}
          </Pressable>

          <Pressable onPress={() => router.push('/explorer')} style={styles.explorerBtn}>
            <Text style={styles.explorerBtnText}>🔎 EXPLORER LES PROPOSITIONS</Text>
          </Pressable>

        </ScrollView>
      </PageContainer>
    </AuthGate>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { color: '#F8FF00', fontSize: 28, fontWeight: '700' },
  closeBtn: { backgroundColor: '#222', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  closeText: { color: '#aaa', fontSize: 12, fontWeight: 'bold' },
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, backgroundColor: '#111', padding: 15, borderRadius: 12 },
  cardLabel: { color: '#fff', fontSize: 16 },
  sectionTitle: { color: '#fff', fontSize: 16, marginBottom: 12, fontWeight: '600', marginTop: 10 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  typeChip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 25, backgroundColor: '#111', borderWidth: 1, borderColor: '#333' },
  activeChip: { backgroundColor: '#F8FF00', borderColor: '#F8FF00' },
  chipText: { color: '#fff', fontWeight: '600' },
  activeChipText: { color: '#000' },
  input: { backgroundColor: '#111', color: '#fff', padding: 15, borderRadius: 10, marginBottom: 15 },
  textArea: { height: 120, textAlignVertical: 'top' },
  impactRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  impactBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#111', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#333' },
  activeImpact: { backgroundColor: '#F8FF00', borderColor: '#F8FF00' },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  impactText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  activeImpactText: { color: '#000' },
  mediaRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  mediaBtn: { flex: 1, backgroundColor: '#111', padding: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  mediaBtnText: { color: '#fff', fontSize: 11, marginTop: 6 },
  previewContainer: { backgroundColor: '#222', padding: 12, borderRadius: 10, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  previewText: { color: '#F8FF00', fontSize: 13 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 30 },
  tagChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#111', borderWidth: 1, borderColor: '#333' },
  activeTag: { backgroundColor: '#F8FF00', borderColor: '#F8FF00' },
  tagText: { color: '#aaa', fontSize: 12 },
  activeTagText: { color: '#000', fontWeight: 'bold' },
  publishBtn: { backgroundColor: '#F8FF00', padding: 20, borderRadius: 15, alignItems: 'center' },
  publishBtnText: { color: '#000', fontWeight: '900', fontSize: 18 },
  explorerBtn: { marginTop: 15, padding: 15, borderRadius: 15, borderWidth: 1, borderColor: '#F8FF00', borderStyle: 'dashed', alignItems: 'center' },
  explorerBtnText: { color: '#F8FF00', fontWeight: '700', fontSize: 14 },
});