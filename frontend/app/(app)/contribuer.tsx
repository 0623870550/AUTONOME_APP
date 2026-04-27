import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
  Switch,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import PageContainer from '../../components/PageContainer';
import { useAgentRole } from '../../context/AgentRoleContext';
import { useSession } from '../../context/SupabaseSessionProvider';
import AuthGate from '../_auth-gate';
import { supabase } from '../../lib/supabase';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import React from 'react';

type AttachmentType = 'image' | 'video' | 'document';

interface Attachment {
  id: string;
  uri: string;
  name: string;
  size: number;
  type: AttachmentType;
}

type ContributionType = 'idee' | 'solution' | 'besoin' | 'probleme' | 'retour' | 'suggestion';
type ImpactLevel = 'faible' | 'modere' | 'fort';

export default function Contribuer() {
  const router = useRouter();
  const { session } = useSession();
  const { roleAgent } = useAgentRole();

  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<ContributionType | null>(null);
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [impact, setImpact] = useState<ImpactLevel>('modere');
  const [tags, setTags] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [anonyme, setAnonyme] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const uriToBlob = async (uri: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob;
  };

  const pickImage = async () => {
    setShowAttachmentMenu(false);
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!res.canceled) {
      setAttachments([{
        id: 'img-' + Date.now(),
        uri: res.assets[0].uri,
        name: 'image.jpg',
        size: 0,
        type: 'image'
      }]);
    }
  };

  const pickVideo = async () => {
    setShowAttachmentMenu(false);
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.7,
    });
    if (!res.canceled) {
      setAttachments([{
        id: 'vid-' + Date.now(),
        uri: res.assets[0].uri,
        name: 'video.mp4',
        size: 0,
        type: 'video'
      }]);
    }
  };

  const uploadMedia = async (uri: string, type: 'image' | 'video') => {
    try {
      const fileName = `${Date.now()}.${type === 'image' ? 'jpg' : 'mp4'}`;
      const filePath = `${session?.user.id}/${fileName}`;

      let fileBody;
      if (Platform.OS === 'web') {
        fileBody = await uriToBlob(uri);
      } else {
        const extension = type === 'image' ? 'jpg' : 'mp4';
        const formData = new FormData();
        formData.append('file', {
          uri,
          name: fileName,
          type: type === 'image' ? 'image/jpeg' : 'video/mp4',
        } as any);
        fileBody = formData;
      }

      // Upload vers le bucket 'propositions'
      const { data, error } = await supabase.storage
        .from('propositions')
        .upload(filePath, fileBody, {
          contentType: type === 'image' ? 'image/jpeg' : 'video/mp4',
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Récupération de l'URL publique (Correction 404)
      const { data: { publicUrl } } = supabase.storage
        .from('propositions')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      console.error('Upload error:', err);
      return null;
    }
  };

  const handlePublish = async () => {
    if (!type || titre.trim().length < 3 || description.trim().length < 5) {
      Alert.alert('Erreur', 'Veuillez remplir correctement les champs obligatoires.');
      return;
    }

    setLoading(true);

    let imageUrl = null;
    let videoUrl = null;

    if (attachments.length > 0) {
      const att = attachments[0];
      const url = await uploadMedia(att.uri, att.type as any);
      if (att.type === 'image') imageUrl = url;
      else if (att.type === 'video') videoUrl = url;
    }

    // CALCUL DE L'HEURE DE PARIS (Correction décalage 2h)
    const now = new Date();
    const parisTime = new Date(now.getTime() + (2 * 60 * 60 * 1000));

    const { error } = await supabase.from('contributions').insert([
      {
        type,
        titre: titre.trim(),
        description: description.trim(),
        impact,
        tags,
        role_agent: roleAgent,
        anonyme,
        created_by: session?.user.id,
        image_url: imageUrl,
        video_url: videoUrl,
        votes_count: 0,
        created_at: parisTime.toISOString() // On force l'heure de Paris
      },
    ]);

    setLoading(false);

    if (error) {
      Alert.alert('Erreur', error.message);
    } else {
      Alert.alert('Succès', 'Votre proposition a été publiée avec succès !');
      setType(null);
      setTitre('');
      setDescription('');
      setImpact('modere');
      setTags([]);
      setAttachments([]);
      setAnonyme(false);
    }
  };

  return (
    <AuthGate>
      <PageContainer>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <Text style={{ color: '#F8FF00', fontSize: 26, fontWeight: '700' }}>
            Proposer
          </Text>
          <Pressable
            onPress={() => router.push('/')}
            style={{ backgroundColor: '#222', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#333' }}
          >
            <Text style={{ color: '#aaa', fontSize: 12, fontWeight: 'bold' }}>✕ Quitter</Text>
          </Pressable>
        </View>
        <Text style={{ color: '#ccc', fontSize: 15, marginBottom: 20 }}>
          Partage une idée, une proposition, un besoin ou un retour d’expérience.
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, backgroundColor: '#111', padding: 12, borderRadius: 10 }}>
          <Text style={{ color: '#fff', fontSize: 16 }}>Publier anonymement</Text>
          <Switch
            value={anonyme}
            onValueChange={setAnonyme}
            trackColor={{ false: '#333', true: '#F8FF00' }}
            thumbColor={anonyme ? '#fff' : '#888'}
          />
        </View>

        <Text style={{ color: '#fff', fontSize: 16, marginBottom: 8 }}>Type de contribution</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {[
            { key: 'idee', label: '💡 Idée' },
            { key: 'solution', label: '🛠️ Solution' },
            { key: 'besoin', label: '📣 Besoin' },
            { key: 'probleme', label: '🔁 Problème' },
            { key: 'retour', label: '🧩 Retour' },
            { key: 'suggestion', label: '📝 Suggestion' },
          ].map((item) => (
            <Pressable
              key={item.key}
              onPress={() => setType(item.key as any)}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 20,
                backgroundColor: type === item.key ? '#F8FF00' : 'rgba(255,255,255,0.1)',
              }}
            >
              <Text style={{ color: type === item.key ? '#000' : '#fff', fontWeight: '600' }}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={{ color: '#fff', fontSize: 16, marginBottom: 8 }}>Titre</Text>
        <TextInput
          value={titre}
          onChangeText={setTitre}
          placeholder="Ex : Améliorer les régimes de garde"
          placeholderTextColor="#666"
          style={{ backgroundColor: '#111', color: '#fff', padding: 12, borderRadius: 8, marginBottom: 20 }}
        />

        <Text style={{ color: '#fff', fontSize: 16, marginBottom: 8 }}>Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Explique ton idée..."
          placeholderTextColor="#666"
          multiline
          style={{ backgroundColor: '#111', color: '#fff', padding: 12, borderRadius: 8, height: 120, textAlignVertical: 'top', marginBottom: 20 }}
        />

        <Text style={{ color: '#fff', fontSize: 16, marginBottom: 8 }}>Niveau d’impact agent</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
          {[
            { key: 'faible', label: 'Faible', color: '#34C759' },
            { key: 'modere', label: 'Modéré', color: '#FF9500' },
            { key: 'fort', label: 'Fort', color: '#FF3B30' },
          ].map((lvl) => (
            <Pressable
              key={lvl.key}
              onPress={() => setImpact(lvl.key as any)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 20,
                backgroundColor: impact === lvl.key ? '#F8FF00' : 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                borderColor: impact === lvl.key ? '#F8FF00' : 'rgba(255,255,255,0.05)',
              }}
            >
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: lvl.color,
                  marginRight: 8,
                  borderWidth: 1.5,
                  borderColor: 'rgba(0,0,0,0.2)'
                }}
              />
              <Text style={{
                color: impact === lvl.key ? '#000' : '#fff',
                fontWeight: '700',
                fontSize: 14
              }}>
                {lvl.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={{ color: '#fff', fontSize: 16, marginBottom: 8 }}>Média (optionnel)</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
          <Pressable
            onPress={pickImage}
            style={{ flex: 1, backgroundColor: '#111', padding: 15, borderRadius: 12, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#444' }}
          >
            <MaterialIcons name="photo" size={24} color="#F8FF00" />
            <Text style={{ color: '#aaa', fontSize: 12, marginTop: 5 }}>Photo</Text>
          </Pressable>
          <Pressable
            onPress={pickVideo}
            style={{ flex: 1, backgroundColor: '#111', padding: 15, borderRadius: 12, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#444' }}
          >
            <MaterialIcons name="videocam" size={24} color="#F8FF00" />
            <Text style={{ color: '#aaa', fontSize: 12, marginTop: 5 }}>Vidéo</Text>
          </Pressable>
        </View>

        {attachments.length > 0 && (
          <View style={{ marginBottom: 20, backgroundColor: '#111', borderRadius: 12, overflow: 'hidden' }}>
            {attachments[0].type === 'image' ? (
              <Image source={{ uri: attachments[0].uri }} style={{ width: '100%', height: 150 }} />
            ) : (
              <View style={{ height: 150, alignItems: 'center', justifyContent: 'center', backgroundColor: '#222' }}>
                <MaterialIcons name="videocam" size={40} color="#F8FF00" />
                <Text style={{ color: '#fff', marginTop: 10 }}>Vidéo sélectionnée</Text>
              </View>
            )}
            <Pressable
              onPress={() => setAttachments([])}
              style={{ position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 15, padding: 5 }}
            >
              <MaterialIcons name="close" size={20} color="#fff" />
            </Pressable>
          </View>
        )}

        <Text style={{ color: '#fff', fontSize: 16, marginBottom: 8 }}>Tags (optionnel)</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {['Opérationnel', 'Matériel', 'RH', 'Organisation', 'Sécurité', 'Formation'].map((tag) => (
            <Pressable
              key={tag}
              onPress={() => toggleTag(tag)}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 20,
                backgroundColor: tags.includes(tag) ? '#F8FF00' : 'rgba(255,255,255,0.1)',
              }}
            >
              <Text style={{ color: tags.includes(tag) ? '#000' : '#fff', fontWeight: '600' }}>{tag}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={handlePublish}
          disabled={loading}
          style={{
            backgroundColor: loading ? '#444' : '#F8FF00',
            padding: 16,
            borderRadius: 10,
            marginTop: 10,
            alignItems: 'center'
          }}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={{ color: '#000', fontSize: 17, fontWeight: '700' }}>Publier ma proposition</Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => router.push('/explorer')}
          style={{ marginTop: 20, padding: 16, borderRadius: 10, borderWidth: 1, borderColor: '#F8FF00', borderStyle: 'dashed', alignItems: 'center' }}
        >
          <Text style={{ color: '#F8FF00', fontWeight: '700', fontSize: 16 }}>
            🔎 Explorer les propositions existantes
          </Text>
        </Pressable>

        <View style={{ height: 80 }} />
      </PageContainer>
    </AuthGate>
  );
}