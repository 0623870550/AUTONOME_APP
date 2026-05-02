import { useEffect, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  Alert
} from 'react-native';

import PageContainer from '../../components/PageContainer';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as WebBrowser from 'expo-web-browser';

import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';

import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAgentRole } from '../../context/AgentRoleContext';

/* ---------------------------------------------
   TYPES
---------------------------------------------- */
type AttachmentType = 'image' | 'video' | 'document';

interface Attachment {
  id: string;
  uri: string;
  name: string;
  type: AttachmentType;
  mimeType?: string;
  remoteUrl?: string;
}

/* ---------------------------------------------
   HELPERS
---------------------------------------------- */
const generateId = () => Math.random().toString(36).substring(2, 12);

const detectType = (uri: string): AttachmentType => {
  if (uri.match(/\.(jpg|jpeg|png|gif)$/i)) return 'image';
  if (uri.match(/\.(mp4|mov|avi)$/i)) return 'video';
  return 'document';
};

const iconForType = (type: AttachmentType) => {
  if (type === 'image') return '🖼️';
  if (type === 'video') return '🎥';
  return '📄';
};

/* ---------------------------------------------
   UPLOAD LOGIC (FIXED)
---------------------------------------------- */
const uploadFile = async (att: Attachment): Promise<string | null> => {
  try {
    const response = await fetch(att.uri);
    const blob = await response.blob();
    const fileExt = att.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('alerte_files')
      .upload(fileName, blob, {
        contentType: att.mimeType || 'application/octet-stream',
        upsert: false,
      });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
      .from('alerte_files')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  } catch (e) {
    console.error('Erreur upload storage:', e);
    return null;
  }
};

/* ---------------------------------------------
   SCREEN
---------------------------------------------- */
export default function AlerteScreen() {
  const router = useRouter();
  const { roleAgent } = useAgentRole();
  const [user, setUser] = useState<any>(null);

  const [type, setType] = useState('');
  const [lieu, setLieu] = useState('');
  const [description, setDescription] = useState('');
  const [gravite, setGravite] = useState('');
  const [anonyme, setAnonyme] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [commentInterne, setCommentInterne] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user ?? null);
    };
    loadUser();
  }, []);

  const openAttachment = async (att: Attachment) => {
    if (att.type === 'image') {
      setViewerImage(att.uri);
      setViewerVisible(true);
      return;
    }
    try {
      await WebBrowser.openBrowserAsync(att.uri);
    } catch (e) {
      console.log('Erreur ouverture fichier :', e);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      const newAtt: Attachment = {
        id: generateId(),
        uri: asset.uri,
        name: asset.fileName || `image_${Date.now()}.jpg`,
        type: detectType(asset.uri),
        mimeType: asset.mimeType
      };
      setAttachments([...attachments, newAtt]);
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      multiple: false,
    });
    if (!result.canceled) {
      const file = result.assets?.[0];
      if (file) {
        const newAtt: Attachment = {
          id: generateId(),
          uri: file.uri,
          name: file.name,
          type: detectType(file.uri),
          mimeType: file.mimeType
        };
        setAttachments([...attachments, newAtt]);
      }
    }
  };

  const createAlerte = async () => {
    if (!user) { Alert.alert('Erreur', 'Utilisateur non connecté'); return; }
    if (!type || !lieu || !description || !gravite) { Alert.alert('Champs requis', 'Merci de remplir tous les champs'); return; }
    if (!roleAgent) { Alert.alert('Erreur', "Impossible de déterminer votre rôle (SPP/PATS)"); return; }

    setIsSubmitting(true);

    try {
      // 1. Upload des fichiers
      const updatedAttachments = await Promise.all(
        attachments.map(async (att) => {
          const remoteUrl = await uploadFile(att);
          return { ...att, remoteUrl: remoteUrl || undefined };
        })
      );

      // 2. Préparation du payload
      const now = new Date();
      const parisTime = new Date(now.getTime() + (2 * 60 * 60 * 1000));

      const payload = {
        type,
        lieu,
        description,
        gravite,
        statut: 'pending',
        anonyme,
        created_by: user.id,
        role_agent: roleAgent,
        attachments: updatedAttachments,
        comment_interne: commentInterne,
        inserted_at: parisTime.toISOString(),
      };

      // 3. Insertion en base
      const { error } = await supabase.from('alerte').insert(payload);

      if (error) throw error;

      Alert.alert('Succès', 'Votre alerte a été transmise avec succès.');
      
      // Reset
      setType(''); setLieu(''); setDescription(''); setGravite('');
      setAnonyme(false); setAttachments([]); setCommentInterne('');
      router.back();

    } catch (error: any) {
      console.error('Erreur createAlerte:', error);
      Alert.alert('Erreur', "Une erreur est survenue lors de l'envoi de l'alerte.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Animation bouton
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const gesture = Gesture.Tap()
    .onBegin(() => { scale.value = withSpring(0.95); })
    .onFinalize(() => { scale.value = withSpring(1); });

  return (
    <PageContainer>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Text style={{ fontSize: 26, fontWeight: 'bold', color: '#FFF' }}>
            🚨 Déclarer une alerte
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={{ backgroundColor: '#222', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#333' }}
          >
            <Text style={{ color: '#aaa', fontSize: 12, fontWeight: 'bold' }}>✕ Quitter</Text>
          </Pressable>
        </View>

        <Text style={{ fontWeight: '600', marginBottom: 6, color: '#FFF' }}>Type d’alerte</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 15 }}>
          {['opérationnelle', 'sous-effectif', 'matériels', 'management', 'RH', 'agression', 'autres'].map((key) => (
            <Pressable
              key={key}
              onPress={() => setType(key)}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 20,
                backgroundColor: type === key ? '#FFD500' : 'rgba(255,255,255,0.1)',
              }}
            >
              <Text style={{ color: type === key ? '#000' : '#fff', fontWeight: '600', textTransform: 'capitalize' }}>
                {key}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={{ fontWeight: '600', marginBottom: 6, color: '#FFF' }}>Lieu</Text>
        <TextInput
          value={lieu}
          onChangeText={setLieu}
          placeholder="Ex : Caserne X, intervention Y…"
          placeholderTextColor="#999"
          style={{ borderWidth: 1, borderColor: '#333', padding: 12, borderRadius: 8, marginBottom: 15, color: '#FFF', backgroundColor: '#111' }}
        />

        <Text style={{ fontWeight: '600', marginBottom: 6, color: '#FFF' }}>Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Détaillez les faits ici..."
          placeholderTextColor="#999"
          multiline
          style={{ borderWidth: 1, borderColor: '#333', padding: 12, borderRadius: 8, height: 120, textAlignVertical: 'top', marginBottom: 15, color: '#FFF', backgroundColor: '#111' }}
        />

        <Text style={{ fontWeight: '600', marginBottom: 6, color: '#FFF' }}>Gravité</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15 }}>
          {[
            { key: 'faible', label: '🟢 Faible' },
            { key: 'modéré', label: '🟡 Modéré' },
            { key: 'important', label: '🔴 Important' },
          ].map((item) => (
            <Pressable
              key={item.key}
              onPress={() => setGravite(item.key)}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 20,
                backgroundColor: gravite === item.key ? '#FFD500' : 'rgba(255,255,255,0.1)',
              }}
            >
              <Text style={{ color: gravite === item.key ? '#000' : '#fff', fontWeight: '600' }}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
          <Switch value={anonyme} onValueChange={setAnonyme} trackColor={{ true: '#FFD500' }} />
          <Text style={{ marginLeft: 10, color: '#FFF' }}>Envoyer anonymement</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <Switch value={commentInterne === 'contact_oui'} onValueChange={(v) => setCommentInterne(v ? 'contact_oui' : '')} trackColor={{ true: '#FFD500' }} />
          <Text style={{ marginLeft: 10, color: '#FFF' }}>Je souhaite être contacté</Text>
        </View>

        <Text style={{ fontWeight: '600', marginBottom: 10, color: '#FFF' }}>Pièces jointes</Text>
        <View style={{ flexDirection: 'row', marginBottom: 15 }}>
          <Pressable onPress={pickImage} style={{ backgroundColor: '#222', padding: 12, borderRadius: 8, marginRight: 10, borderWidth: 1, borderColor: '#333' }}>
            <Text style={{ color: '#FFD500', fontWeight: 'bold' }}>📸 Image / Vidéo</Text>
          </Pressable>
          <Pressable onPress={pickDocument} style={{ backgroundColor: '#222', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#333' }}>
            <Text style={{ color: '#FFD500', fontWeight: 'bold' }}>📄 Document</Text>
          </Pressable>
        </View>

        {attachments.map((att) => (
          <View key={att.id} style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderWidth: 1, borderColor: '#333', borderRadius: 8, marginBottom: 10, backgroundColor: '#111' }}>
            <Text style={{ color: '#FFF', flex: 1 }}>{iconForType(att.type)} {att.name}</Text>
            <Pressable onPress={() => setAttachments(attachments.filter(a => a.id !== att.id))}>
              <Text style={{ color: '#FF4444', fontWeight: 'bold' }}>Supprimer</Text>
            </Pressable>
          </View>
        ))}

        <GestureDetector gesture={gesture}>
          <Animated.View style={[animatedStyle]}>
            <Pressable
              onPress={createAlerte}
              disabled={isSubmitting}
              style={{ backgroundColor: '#FFD500', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 25, opacity: isSubmitting ? 0.6 : 1 }}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#000' }}>🚨 Déclarer l’alerte</Text>
              )}
            </Pressable>
          </Animated.View>
        </GestureDetector>
      </ScrollView>

      <Modal visible={viewerVisible} transparent animationType="fade">
        <Pressable onPress={() => setViewerVisible(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' }}>
          {viewerImage && <Image source={{ uri: viewerImage }} style={{ width: '90%', height: '70%', resizeMode: 'contain' }} />}
          <Text style={{ color: '#FFF', marginTop: 20, fontWeight: 'bold' }}>Fermer</Text>
        </Pressable>
      </Modal>
    </PageContainer>
  );
}