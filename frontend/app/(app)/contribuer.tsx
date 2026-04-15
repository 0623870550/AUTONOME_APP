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
  Alert as RNAlert
} from 'react-native';
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

const formatSize = (bytes: number) => {
  if (!bytes || bytes <= 0) return '—';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
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

  const addAttachment = async (uri: string, name: string) => {
    const info = await FileSystem.getInfoAsync(uri);
    const size = info.exists && typeof info.size === 'number' ? info.size : 0;
    const att: Attachment = {
      id: Math.random().toString(36).substring(7),
      uri,
      name,
      size,
      type: detectType(uri),
    };
    setAttachments((prev) => [...prev, att]);
  };

  const pickImage = async () => {
    setShowAttachmentMenu(false);
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!res.canceled) {
      const asset = res.assets[0];
      await addAttachment(asset.uri, asset.fileName || 'image.jpg');
    }
  };

  const handlePublish = async () => {
    if (!type || titre.trim().length < 3 || description.trim().length < 5) {
      RNAlert.alert('Erreur', 'Veuillez remplir correctement les champs obligatoires.');
      return;
    }

    setLoading(true);
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
      },
    ]);

    setLoading(false);

    if (error) {
      RNAlert.alert('Erreur', error.message);
    } else {
      RNAlert.alert('Succès', 'Votre proposition a été publiée avec succès !');
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

