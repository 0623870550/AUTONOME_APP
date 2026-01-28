import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  Pressable,
  Image,
  Switch,
  ScrollView,
} from 'react-native';

import AuthGate from '@/app/auth-gate';
import PageContainer from '../../components/PageContainer';

import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as WebBrowser from 'expo-web-browser';

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';

import { supabase } from '@/lib/supabase';
import { useAgentRole } from '@/context/AgentRoleContext';
import { useRouter } from 'expo-router';

/* ---------------------------------------------
   TYPES
---------------------------------------------- */

type AttachmentType = 'image' | 'video' | 'document';

interface Attachment {
  id: string;
  uri: string;
  name: string;
  size: number;
  type: AttachmentType;
  remoteUrl?: string;
}

/* ---------------------------------------------
   HELPERS
---------------------------------------------- */

const generateId = () => Math.random().toString(36).substring(2, 12);

const renameFile = (originalName: string) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const ext = originalName.split('.').pop();
  return `fichier_${timestamp}.${ext}`;
};

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
   UPLOAD SUPABASE
---------------------------------------------- */

const uploadAttachmentToSupabase = async (
  fileUri: string,
  fileName: string
): Promise<string | null> => {
  try {
    const fileData = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const filePath = `${Date.now()}_${fileName}`;

    const { data, error } = await supabase.storage
      .from('alerte_files')
      .upload(filePath, Buffer.from(fileData, 'base64'), {
        contentType: 'application/octet-stream',
        upsert: false,
      });

    if (error) {
      console.log('Erreur upload Supabase :', error);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from('alerte_files')
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl ?? null;
  } catch (e) {
    console.log('Erreur upload :', e);
    return null;
  }
};

/* ---------------------------------------------
   SCREEN
---------------------------------------------- */

export default function AlerteScreen() {
  const router = useRouter();
  const { roleAgent } = useAgentRole(); // 🟨 RÉCUPÉRATION DU RÔLE SPP/PATS

  /* ---------------------------------------------
     USER
  ---------------------------------------------- */

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user ?? null);
    };
    loadUser();
  }, []);

  /* ---------------------------------------------
     STATES
  ---------------------------------------------- */

  const [type, setType] = useState('');
  const [lieu, setLieu] = useState('');
  const [description, setDescription] = useState('');
  const [gravite, setGravite] = useState('');
  const [anonyme, setAnonyme] = useState(false);

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [commentInterne, setCommentInterne] = useState('');

  /* ---------------------------------------------
     VIEWER IMAGE
  ---------------------------------------------- */

  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  const openAttachment = async (att: Attachment) => {
    if (att.type === 'image') {
      setViewerImage(att.uri);
      setViewerVisible(true);
      return;
    }

    try {
      await WebBrowser.openBrowserAsync(att.remoteUrl || att.uri);
    } catch (e) {
      console.log('Erreur ouverture fichier :', e);
    }
  };

  /* ---------------------------------------------
     ANIMATION BOUTON DECLARER
  ---------------------------------------------- */

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const gesture = Gesture.Tap()
    .onBegin(() => {
      scale.value = withSpring(0.95);
    })
    .onFinalize(() => {
      scale.value = withSpring(1);
    });

  /* ---------------------------------------------
     AJOUT DE PIECE JOINTE
  ---------------------------------------------- */

  const addAttachment = async (uri: string, name: string, size: number) => {
    const type = detectType(uri);
    const renamed = renameFile(name);

    const remoteUrl = await uploadAttachmentToSupabase(uri, renamed);

    const newAttachment: Attachment = {
      id: generateId(),
      uri,
      name: renamed,
      size,
      type,
      remoteUrl: remoteUrl || undefined,
    };

    setAttachments((prev) => [...prev, newAttachment]);
  };

  /* ---------------------------------------------
     PICKERS
  ---------------------------------------------- */

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      await addAttachment(asset.uri, asset.fileName || 'image.jpg', asset.fileSize || 0);
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      multiple: false,
      copyToCacheDirectory: true,
    });

    if (result.type === 'success') {
      await addAttachment(result.uri, result.name, result.size || 0);
    }
  };

  /* ---------------------------------------------
     CREATION ALERTE
  ---------------------------------------------- */

  const createAlerte = async () => {
    if (!user) {
      alert('Utilisateur non connecté');
      return;
    }

    if (!type || !lieu || !description || !gravite) {
      alert('Merci de remplir tous les champs');
      return;
    }

    if (!roleAgent) {
      alert("Impossible de déterminer votre rôle (SPP/PATS)");
      return;
    }

    const payload = {
      type,
      lieu,
      description,
      gravite,
      statut: 'en_cours',
      anonyme,
      created_by: user.id,
      role_agent: roleAgent, // 🟨 AJOUT ESSENTIEL
      attachments,
      comment_interne: commentInterne,

      events: [
        {
          type: 'creation',
          date: new Date().toISOString(),
        },
      ],
    };

    const { error } = await supabase.from('alerte').insert(payload);

    if (error) {
      console.log('Erreur insertion alerte :', error);
      alert('Erreur lors de la création de l’alerte');
      return;
    }

    // Reset
    setType('');
    setLieu('');
    setDescription('');
    setGravite('');
    setAnonyme(false);
    setAttachments([]);
    setCommentInterne('');

    alert('Alerte envoyée');
  };

  /* ---------------------------------------------
     RENDER
  ---------------------------------------------- */

  return (
    <AuthGate>
      <PageContainer>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text style={{ fontSize: 26, fontWeight: 'bold', marginBottom: 20 }}>
            🚨 Déclarer une alerte
          </Text>

          {/* TYPE */}
          <Text style={{ fontWeight: '600', marginBottom: 6 }}>Type d’alerte</Text>
          <TextInput
            value={type}
            onChangeText={setType}
            placeholder="Ex : Agression, matériel défectueux…"
            style={{
              borderWidth: 1,
              borderColor: '#ccc',
              padding: 12,
              borderRadius: 8,
              marginBottom: 15,
            }}
          />

          {/* LIEU */}
          <Text style={{ fontWeight: '600', marginBottom: 6 }}>Lieu</Text>
          <TextInput
            value={lieu}
            onChangeText={setLieu}
            placeholder="Ex : Caserne X, intervention Y…"
            style={{
              borderWidth: 1,
              borderColor: '#ccc',
              padding: 12,
              borderRadius: 8,
              marginBottom: 15,
            }}
          />

          {/* DESCRIPTION */}
          <Text style={{ fontWeight: '600', marginBottom: 6 }}>Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Décris précisément la situation…"
            multiline
            style={{
              borderWidth: 1,
              borderColor: '#ccc',
              padding: 12,
              borderRadius: 8,
              height: 120,
              textAlignVertical: 'top',
              marginBottom: 15,
            }}
          />

          {/* GRAVITE */}
          <Text style={{ fontWeight: '600', marginBottom: 6 }}>Gravité</Text>
          <TextInput
            value={gravite}
            onChangeText={setGravite}
            placeholder="Ex : faible, modérée, élevée…"
            style={{
              borderWidth: 1,
              borderColor: '#ccc',
              padding: 12,
              borderRadius: 8,
              marginBottom: 15,
            }}
          />

          {/* ANONYME */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <Switch value={anonyme} onValueChange={setAnonyme} />
            <Text style={{ marginLeft: 10 }}>Envoyer anonymement</Text>
          </View>

          {/* PIECES JOINTES */}
          <Text style={{ fontWeight: '600', marginBottom: 10 }}>Pièces jointes</Text>

          <View style={{ flexDirection: 'row', marginBottom: 15 }}>
            <Pressable
              onPress={pickImage}
              style={{
                backgroundColor: '#FFD500',
                padding: 10,
                borderRadius: 8,
                marginRight: 10,
              }}
            >
              <Text>📸 Image</Text>
            </Pressable>

            <Pressable
              onPress={pickDocument}
              style={{
                backgroundColor: '#FFD500',
                padding: 10,
                borderRadius: 8,
              }}
            >
              <Text>📄 Document</Text>
            </Pressable>
          </View>

          {attachments.map((att) => (
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
                {iconForType(att.type)} {att.name}
              </Text>
            </Pressable>
          ))}

          {/* BOUTON MES ALERTES */}
          <Pressable
            onPress={() => router.push('/mes-alertes')}
            style={{
              marginTop: 10,
              marginBottom: 10,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#007AFF', fontSize: 16 }}>
              🔎 Voir mes alertes
            </Text>
          </Pressable>

          {/* BOUTON DECLARER */}
          <GestureDetector gesture={gesture}>
            <Animated.View style={[animatedStyle]}>
              <Pressable
                onPress={createAlerte}
                style={{
                  backgroundColor: '#FFD500',
                  padding: 15,
                  borderRadius: 10,
                  alignItems: 'center',
                  marginTop: 25,
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
                  🚨 Déclarer l’alerte
                </Text>
              </Pressable>
            </Animated.View>
          </GestureDetector>
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
    </AuthGate>
  );
}
