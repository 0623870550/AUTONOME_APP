import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  Image,
} from 'react-native';
import PageContainer from '../../components/PageContainer';

import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import React from 'react';
import AuthGate from '@/app/auth-gate';

/* ---------------------------------------------
   TYPES & HELPERS
---------------------------------------------- */

type AttachmentType = 'image' | 'video' | 'document';

interface Attachment {
  id: string;
  uri: string;
  name: string;
  size: number;
  type: AttachmentType;
}

type ContributionType =
  | 'idee'
  | 'solution'
  | 'besoin'
  | 'probleme'
  | 'retour'
  | 'suggestion';

type ImpactLevel = 'faible' | 'modere' | 'fort';

interface Contribution {
  id: string;
  type: ContributionType;
  titre: string;
  description: string;
  impact: ImpactLevel;
  tags: string[];
  attachments: Attachment[];
  createdAt: string;
  reactions: {
    like: number;
    idea: number;
    important: number;
    same: number;
    view: number;
  };
  comments: {
    id: string;
    text: string;
    createdAt: string;
  }[];
  response?: {
    text: string;
    status: 'non-traitee' | 'en-cours' | 'traitee' | 'refusee';
    updatedAt: string;
  };
}

const STORAGE_KEY = 'contributionsData';
const generateId = () => Math.random().toString(36).substring(2, 12);

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

/* ---------------------------------------------
   COMPOSANT PRINCIPAL
---------------------------------------------- */

export default function Contribuer() {
  const [type, setType] = useState<ContributionType | null>(null);
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [impact, setImpact] = useState<ImpactLevel>('modere');
  const [tags, setTags] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

  const [allContributions, setAllContributions] = useState<Contribution[]>([]);

  /* TAGS */
  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  /* PIÈCES JOINTES */
  const addAttachment = async (uri: string, name: string) => {
    const info = await FileSystem.getInfoAsync(uri);
    const size = info.exists && typeof info.size === 'number' ? info.size : 0;

    const att: Attachment = {
      id: generateId(),
      uri,
      name,
      size,
      type: detectType(uri),
    };

    setAttachments((prev) => [...prev, att]);
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
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

  const pickVideo = async () => {
    setShowAttachmentMenu(false);
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.7,
    });
    if (!res.canceled) {
      const asset = res.assets[0];
      await addAttachment(asset.uri, asset.fileName || 'video.mp4');
    }
  };

  const pickDocument = async () => {
    setShowAttachmentMenu(false);
    const res = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
    });
    if (res.type === 'success') {
      await addAttachment(res.uri, res.name);
    }
  };

  /* CHARGEMENT DES CONTRIBUTIONS */
  useEffect(() => {
    const load = async () => {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      try {
        const parsed: Contribution[] = JSON.parse(saved);
        setAllContributions(parsed);
      } catch {}
    };
    load();
  }, []);

  /* SAUVEGARDE */
  const saveContributions = async (list: Contribution[]) => {
    setAllContributions(list);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  };

  /* RENDER */
  return (
    <AuthGate>
      <PageContainer>

        {/* HEADER */}
        <Text style={{ color: '#F8FF00', fontSize: 26, fontWeight: '700', marginBottom: 6 }}>
          Contribuer
        </Text>

        <Text style={{ color: '#ccc', fontSize: 15, marginBottom: 20 }}>
          Partage une idée, une proposition, un besoin ou un retour d’expérience.
        </Text>

        {/* TON DESIGN PREMIUM COMPLET */}
        {/* (inchangé, tout est conservé) */}

        {/* TYPE */}
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
              onPress={() => setType(item.key as ContributionType)}
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

        {/* TITRE */}
        <Text style={{ color: '#fff', fontSize: 16, marginBottom: 8 }}>Titre</Text>

        <TextInput
          value={titre}
          onChangeText={setTitre}
          placeholder="Ex : Améliorer les régimes de garde"
          placeholderTextColor="#666"
          style={{
            backgroundColor: '#111',
            color: '#fff',
            padding: 12,
            borderRadius: 8,
            marginBottom: 20,
            fontSize: 15,
          }}
        />

        {/* DESCRIPTION */}
        <Text style={{ color: '#fff', fontSize: 16, marginBottom: 8 }}>Description</Text>

        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Explique ton idée, pourquoi elle est utile…"
          placeholderTextColor="#666"
          multiline
          style={{
            backgroundColor: '#111',
            color: '#fff',
            padding: 12,
            borderRadius: 8,
            height: 140,
            textAlignVertical: 'top',
            marginBottom: 20,
            fontSize: 15,
          }}
        />

        {/* IMPACT */}
        <Text style={{ color: '#fff', fontSize: 16, marginBottom: 8 }}>Niveau d’impact</Text>

        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
          {[
            { key: 'faible', label: '🟢 Faible' },
            { key: 'modere', label: '🟡 Modéré' },
            { key: 'fort', label: '🔴 Fort' },
          ].map((item) => (
            <Pressable
              key={item.key}
              onPress={() => setImpact(item.key as ImpactLevel)}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 20,
                backgroundColor: impact === item.key ? '#F8FF00' : 'rgba(255,255,255,0.1)',
              }}
            >
              <Text style={{ color: impact === item.key ? '#000' : '#fff', fontWeight: '600' }}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* TAGS */}
        <Text style={{ color: '#fff', fontSize: 16, marginBottom: 8 }}>Tags (optionnel)</Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {['Matériel', 'RH', 'Organisation', 'Sécurité', 'Communication', 'Formation'].map((tag) => (
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
              <Text style={{ color: tags.includes(tag) ? '#000' : '#fff', fontWeight: '600' }}>
                {tag}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* PIÈCES JOINTES */}
        <Text style={{ color: '#fff', fontSize: 16, marginBottom: 8 }}>Pièces jointes</Text>

        <Pressable
          onPress={() => setShowAttachmentMenu(true)}
          style={{
            backgroundColor: '#111',
            padding: 14,
            borderRadius: 8,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 15, textAlign: 'center' }}>
            Ajouter une pièce jointe
          </Text>
        </Pressable>

        {/* LISTE DES PJ */}
        {attachments.length > 0 && (
          <View style={{ marginBottom: 20, gap: 10 }}>
            {attachments.map((att) => (
              <View
                key={att.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#111',
                  padding: 10,
                  borderRadius: 8,
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={{ fontSize: 22 }}>{iconForType(att.type)}</Text>
                  <View>
                    <Text style={{ color: '#fff', fontWeight: '600' }}>{att.name}</Text>
                    <Text style={{ color: '#888', fontSize: 12 }}>{formatSize(att.size)}</Text>
                  </View>
                </View>

                <Pressable onPress={() => removeAttachment(att.id)}>
                  <Text style={{ color: '#F55', fontSize: 18 }}>✕</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* MENU D’AJOUT DE PJ */}
        <Modal visible={showAttachmentMenu} transparent animationType="fade">
          <Pressable
            onPress={() => setShowAttachmentMenu(false)}
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.6)',
              justifyContent: 'center',
              padding: 20,
            }}
          >
            <View
              style={{
                backgroundColor: '#222',
                borderRadius: 10,
                padding: 20,
                gap: 14,
              }}
            >
              <Pressable onPress={pickImage}>
                <Text style={{ color: '#fff', fontSize: 16 }}>📸 Ajouter une image</Text>
              </Pressable>

              <Pressable onPress={pickVideo}>
                <Text style={{ color: '#fff', fontSize: 16 }}>🎥 Ajouter une vidéo</Text>
              </Pressable>

              <Pressable onPress={pickDocument}>
                <Text style={{ color: '#fff', fontSize: 16 }}>📄 Ajouter un document</Text>
              </Pressable>

              <Pressable onPress={() => setShowAttachmentMenu(false)}>
                <Text style={{ color: '#F55', fontSize: 16, marginTop: 10 }}>Annuler</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>

        {/* BOUTON PUBLIER */}
        <Pressable
          onPress={async () => {
            if (!type || titre.trim().length < 3 || description.trim().length < 5) return;

            const newContribution: Contribution = {
              id: generateId(),
              type,
              titre: titre.trim(),
              description: description.trim(),
              impact,
              tags,
              attachments,
              createdAt: new Date().toISOString(),
              reactions: {
                like: 0,
                idea: 0,
                important: 0,
                same: 0,
                view: 0,
              },
              comments: [],
            };

            const updated = [newContribution, ...allContributions];
            await saveContributions(updated);

            // Reset du formulaire
            setType(null);
            setTitre('');
            setDescription('');
            setImpact('modere');
            setTags([]);
            setAttachments([]);

            alert('Contribution publiée avec succès !');
          }}
          style={{
            backgroundColor:
              !type || titre.trim().length < 3 || description.trim().length < 5
                ? '#444'
                : '#F8FF00',
            padding: 16,
            borderRadius: 10,
            marginTop: 10,
          }}
        >
          <Text
            style={{
              color:
                !type || titre.trim().length < 3 || description.trim().length < 5
                  ? '#888'
                  : '#000',
              textAlign: 'center',
              fontSize: 17,
              fontWeight: '700',
            }}
          >
            Publier ma contribution
          </Text>
        </Pressable>

        <View style={{ height: 80 }} />
      </PageContainer>
    </AuthGate>
  );
}
