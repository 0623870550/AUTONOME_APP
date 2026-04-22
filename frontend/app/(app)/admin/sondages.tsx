import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
} from 'react-native';
import { supabase } from '../../../lib/supabase';
import PageContainer from '../../../components/PageContainer';
import AuthGate from '../../_auth-gate';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImageManipulator from 'expo-image-manipulator';

type PollType = 'qcm' | 'yn' | 'text' | 'dropdown';
type TargetRole = 'SPP' | 'PATS' | 'ALL';

interface Question {
  id: string;
  label: string;
  type: PollType;
  options: string[];
}

export default function AdminSondages() {
  const router = useRouter();
  const [sondages, setSondages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [target, setTarget] = useState<TargetRole>('ALL');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video' | 'doc' | null>(null);
  const [questions, setQuestions] = useState<Question[]>([
    { id: Math.random().toString(), label: '', type: 'qcm', options: ['', ''] }
  ]);

  useEffect(() => {
    fetchSondages();
  }, []);

  const fetchSondages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sondages')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setSondages(data || []);
    setLoading(false);
  };

  const pickFile = async (type: 'image' | 'video' | 'doc') => {
    try {
      const mimeTypes = {
        image: ['image/*'],
        video: ['video/*'],
        doc: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      };

      const result = await DocumentPicker.getDocumentAsync({
        type: mimeTypes[type],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedFile(result.assets[0]);
        setFileType(type);
      }
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de sélectionner le fichier.');
    }
  };

  const uploadMedia = async (file: any, type: 'image' | 'video' | 'doc' | null) => {
    const fileExt = file.name.split('.').pop() || 'bin';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${fileName}`;

    let uriToUpload = file.uri;
    let mimeType = file.mimeType || 'application/octet-stream';

    // Compression d'image (Mobile uniquement pour ImageManipulator)
    if (type === 'image' && Platform.OS !== 'web') {
      try {
        const manipResult = await ImageManipulator.manipulateAsync(
          file.uri,
          [{ resize: { width: 800 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        uriToUpload = manipResult.uri;
        mimeType = 'image/jpeg';
      } catch (e) {
        console.log('Erreur compression, envoi original', e);
      }
    }

    let body;
    if (Platform.OS === 'web') {
      body = file.file || file; 
    } else {
      const response = await fetch(uriToUpload);
      body = await response.blob();
    }

    const { error: uploadError } = await supabase.storage
      .from('sondages')
      .upload(filePath, body, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from('sondages')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  };

  const handleCreate = async () => {
    if (!title.trim()) return Alert.alert('Erreur', 'Le titre est obligatoire');

    // Action Flash : Envoi simplifié de l'objet titre + questions JSON
    setLoading(true);

    let finalImageUrl = imageUrl.trim() || null;
    let finalVideoUrl = videoUrl.trim() || null;
    let finalDocumentUrl = documentUrl.trim() || null;

    if (selectedFile) {
      const performUpload = async (): Promise<boolean> => {
        try {
          const uploadedUrl = await uploadMedia(selectedFile, fileType);
          if (fileType === 'image') finalImageUrl = uploadedUrl;
          else if (fileType === 'video') finalVideoUrl = uploadedUrl;
          else if (fileType === 'doc') finalDocumentUrl = uploadedUrl;
          return true;
        } catch (err: any) {
          return new Promise((resolve) => {
            Alert.alert(
              'Échec de l\'upload',
              `Connexion instable (${err.message}). Que souhaitez-vous faire ?`,
              [
                { text: 'Réessayer', onPress: () => resolve(performUpload()) },
                { text: 'Créer sans média', onPress: () => resolve(true) },
                { text: 'Annuler', onPress: () => { setLoading(false); resolve(false); }, style: 'cancel' },
              ]
            );
          });
        }
      };

      const uploadSuccess = await performUpload();
      if (!uploadSuccess) return; // L'utilisateur a annulé
    }

    const { error: sError } = await supabase
      .from('sondages')
      .insert({
        question: title,
        questions: questions,
        description: description || null,
        target: target,
        image_url: finalImageUrl,
        video_url: finalVideoUrl,
        document_url: finalDocumentUrl,
        is_active: true,
      });

    if (sError) {
      console.error(sError);
      return Alert.alert('Erreur', sError.message);
    }

    setShowCreateModal(false);
    resetForm();
    fetchSondages();
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTarget('ALL');
    setImageUrl('');
    setVideoUrl('');
    setDocumentUrl('');
    setSelectedFile(null);
    setFileType(null);
    setQuestions([{ id: Math.random().toString(), label: '', type: 'qcm', options: ['', ''] }]);
  };

  const toggleArchive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('sondages')
      .update({ is_archived: !currentStatus, is_active: currentStatus })
      .eq('id', id);

    if (error) Alert.alert('Erreur', error.message);
    else fetchSondages();
  };

  const deleteSondage = (id: string) => {
    Alert.alert('Confirmation', 'Supprimer définitivement ce sondage ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('sondages').delete().eq('id', id);
          if (error) Alert.alert('Erreur', error.message);
          else fetchSondages();
        },
      },
    ]);
  };

  return (
    <AuthGate>
      <PageContainer>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={{ color: '#F8FF00' }}>← Retour</Text>
          </Pressable>
          <Text style={styles.title}>Gestion des Sondages</Text>
        </View>

        <Pressable style={styles.createBtn} onPress={() => setShowCreateModal(true)}>
          <Text style={styles.createBtnText}>+ Créer un nouveau sondage</Text>
        </Pressable>

        <ScrollView showsVerticalScrollIndicator={false}>
          {sondages.map((s) => (
            <View key={s.id} style={[styles.card, s.is_archived && { opacity: 0.6 }]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardType}>{s.type.toUpperCase()}</Text>
                <Text style={[styles.cardTarget, { color: s.target === 'ALL' ? '#aaa' : '#F8FF00' }]}>
                  Cible: {s.target}
                </Text>
              </View>
              <Text style={styles.cardQuestion}>{s.question}</Text>
              {s.is_archived && <Text style={styles.archivedLabel}>📁 Archivé</Text>}
              
              <View style={styles.actions}>
                <Pressable
                  style={[styles.actionBtn, { borderColor: '#555' }]}
                  onPress={() => toggleArchive(s.id, s.is_archived)}
                >
                  <Text style={{ color: '#fff' }}>{s.is_archived ? 'Désarchiver' : 'Archiver'}</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionBtn, { borderColor: '#F44' }]}
                  onPress={() => deleteSondage(s.id)}
                >
                  <Text style={{ color: '#F44' }}>Supprimer</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* MODAL CREATION */}
        <Modal visible={showCreateModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView>
                <Text style={styles.modalTitle}>Nouveau Sondage</Text>

                <Text style={styles.label}>Cible</Text>
                <View style={styles.row}>
                  {['ALL', 'SPP', 'PATS'].map((t) => (
                    <Pressable
                      key={t}
                      onPress={() => setTarget(t as TargetRole)}
                      style={[styles.chip, target === t && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, target === t && styles.chipTextActive]}>{t}</Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.label}>Titre du Sondage</Text>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Ex: Enquête sur les conditions de travail..."
                  placeholderTextColor="#666"
                />

                <Text style={styles.label}>Description (Optionnelle)</Text>
                <TextInput
                  style={[styles.input, { height: 80 }]}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  placeholder="Expliquez l'enjeu du sondage..."
                  placeholderTextColor="#666"
                />

                <Text style={styles.label}>Médias (Optionnel)</Text>
                <View style={{ gap: 10, marginBottom: 10 }}>
                  <TextInput
                    style={styles.input}
                    value={imageUrl}
                    onChangeText={setImageUrl}
                    placeholder="URL Image (ex: https://...)"
                    placeholderTextColor="#666"
                  />
                  
                  <View style={styles.row}>
                    <Pressable onPress={() => pickFile('image')} style={[styles.mediaMiniBtn, fileType === 'image' && styles.mediaMiniBtnActive]}>
                      <Text style={[styles.mediaMiniText, fileType === 'image' && styles.mediaMiniTextActive]}>🖼️ Photo</Text>
                    </Pressable>
                    <Pressable onPress={() => pickFile('video')} style={[styles.mediaMiniBtn, fileType === 'video' && styles.mediaMiniBtnActive]}>
                      <Text style={[styles.mediaMiniText, fileType === 'video' && styles.mediaMiniTextActive]}>🎬 Vidéo</Text>
                    </Pressable>
                    <Pressable onPress={() => pickFile('doc')} style={[styles.mediaMiniBtn, fileType === 'doc' && styles.mediaMiniBtnActive]}>
                      <Text style={[styles.mediaMiniText, fileType === 'doc' && styles.mediaMiniTextActive]}>📄 PDF</Text>
                    </Pressable>
                  </View>

                  {selectedFile && (
                    <View style={styles.selectedFileBox}>
                      <Text style={{ color: '#F8FF00', fontSize: 12, flex: 1 }} numberOfLines={1}>📎 {selectedFile.name}</Text>
                      <Pressable onPress={() => { setSelectedFile(null); setFileType(null); }}>
                        <Text style={{ color: '#F44', fontWeight: 'bold' }}>✕</Text>
                      </Pressable>
                    </View>
                  )}
                </View>

                <View style={styles.divider} />
                <Text style={styles.modalTitle}>Questions</Text>

                {questions.map((q, index) => (
                  <View key={q.id} style={styles.questionCard}>
                    <View style={styles.questionHeader}>
                      <Text style={styles.questionNumber}>Question {index + 1}</Text>
                      {questions.length > 1 && (
                        <Pressable onPress={() => {
                          const newQ = [...questions];
                          newQ.splice(index, 1);
                          setQuestions(newQ);
                        }}>
                          <Text style={styles.deleteQuestionText}>🗑️ Supprimer</Text>
                        </Pressable>
                      )}
                    </View>

                    <Text style={styles.label}>Type de réponse</Text>
                    <View style={styles.rowWrap}>
                      {[
                        { k: 'qcm', l: 'QCM' },
                        { k: 'yn', l: 'Oui/Non' },
                        { k: 'text', l: 'Texte Libre' },
                        { k: 'dropdown', l: 'Menu' },
                      ].map((it) => (
                        <Pressable
                          key={it.k}
                          onPress={() => {
                            const newQ = [...questions];
                            newQ[index].type = it.k as PollType;
                            setQuestions(newQ);
                          }}
                          style={[styles.chip, q.type === it.k && styles.chipActive]}
                        >
                          <Text style={[styles.chipText, q.type === it.k && styles.chipTextActive]}>{it.l}</Text>
                        </Pressable>
                      ))}
                    </View>

                    <Text style={styles.label}>Intitulé de la question</Text>
                    <TextInput
                      style={styles.input}
                      value={q.label}
                      onChangeText={(txt) => {
                        const newQ = [...questions];
                        newQ[index].label = txt;
                        setQuestions(newQ);
                      }}
                      placeholder="Ex: Quel est votre avis sur..."
                      placeholderTextColor="#666"
                    />

                    {(q.type === 'qcm' || q.type === 'dropdown') && (
                      <View style={{ marginTop: 10 }}>
                        <Text style={styles.label}>Options de réponse</Text>
                        {q.options.map((opt, optIdx) => (
                          <View key={optIdx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                            <TextInput
                              style={[styles.input, { flex: 1 }]}
                              value={opt}
                              onChangeText={(txt) => {
                                const newQ = [...questions];
                                newQ[index].options[optIdx] = txt;
                                setQuestions(newQ);
                              }}
                              placeholder={`Option ${optIdx + 1}`}
                              placeholderTextColor="#666"
                            />
                            {q.options.length > 2 && (
                              <Pressable
                                onPress={() => {
                                  const newQ = [...questions];
                                  newQ[index].options.splice(optIdx, 1);
                                  setQuestions(newQ);
                                }}
                                style={{ padding: 10, marginLeft: 5 }}
                              >
                                <Text style={{ color: '#FF4444', fontSize: 20 }}>✕</Text>
                              </Pressable>
                            )}
                          </View>
                        ))}
                        <Pressable
                          onPress={() => {
                            const newQ = [...questions];
                            newQ[index].options.push('');
                            setQuestions(newQ);
                          }}
                          style={styles.addOptionBtn}
                        >
                          <Text style={{ color: '#F8FF00' }}>+ Ajouter une option</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                ))}

                <Pressable
                  onPress={() => {
                    setQuestions([...questions, { id: Math.random().toString(), label: '', type: 'qcm', options: ['', ''] }]);
                  }}
                  style={styles.addQuestionBtn}
                >
                  <Text style={styles.addQuestionText}>➕ Ajouter une question</Text>
                </Pressable>

                <View style={styles.modalActions}>
                  <Pressable style={styles.cancelBtn} onPress={() => setShowCreateModal(false)}>
                    <Text style={{ color: '#fff' }}>Annuler</Text>
                  </Pressable>
                  <Pressable style={styles.submitBtn} onPress={handleCreate}>
                    <Text style={{ color: '#000', fontWeight: 'bold' }}>Créer</Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </PageContainer>
    </AuthGate>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 20 },
  backButton: { marginBottom: 10 },
  title: { color: '#F8FF00', fontSize: 24, fontWeight: 'bold' },
  createBtn: {
    backgroundColor: '#F8FF00',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  createBtnText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  card: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardType: { color: '#666', fontSize: 12, fontWeight: 'bold' },
  cardTarget: { fontSize: 12, fontWeight: 'bold' },
  cardQuestion: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 15 },
  archivedLabel: { color: '#aaa', fontSize: 13, marginBottom: 10 },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#111',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalTitle: { color: '#F8FF00', fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  label: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 15 },
  input: {
    backgroundColor: '#222',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 15,
  },
  row: { flexDirection: 'row', gap: 10 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#222',
    borderWidth: 1,
    borderColor: '#333',
  },
  chipActive: { backgroundColor: '#F8FF00', borderColor: '#F8FF00' },
  chipText: { color: '#aaa', fontWeight: '600' },
  chipTextActive: { color: '#000' },
  addOptionBtn: { paddingVertical: 10 },
  modalActions: { flexDirection: 'row', gap: 15, marginTop: 10, marginBottom: 50 },
  cancelBtn: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  submitBtn: { flex: 2, backgroundColor: '#F8FF00', padding: 16, borderRadius: 12, alignItems: 'center' },
  divider: { height: 1, backgroundColor: '#333', marginVertical: 20 },
  questionCard: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 15,
  },
  questionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  questionNumber: { color: '#F8FF00', fontWeight: 'bold', fontSize: 16 },
  deleteQuestionText: { color: '#FF4444', fontWeight: 'bold' },
  addQuestionBtn: {
    backgroundColor: '#222',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F8FF00',
    borderStyle: 'dashed',
    alignItems: 'center',
    marginBottom: 20,
  },
  addQuestionText: { color: '#F8FF00', fontWeight: 'bold', fontSize: 16 },
  mediaMiniBtn: {
    flex: 1,
    padding: 10,
    backgroundColor: '#222',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  mediaMiniBtnActive: {
    backgroundColor: '#F8FF0033',
    borderColor: '#F8FF00',
  },
  mediaMiniText: { color: '#888', fontSize: 12, fontWeight: 'bold' },
  mediaMiniTextActive: { color: '#F8FF00' },
  selectedFileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F8FF0055',
  },
});
