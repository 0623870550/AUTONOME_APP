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
} from 'react-native';
import { supabase } from '../../../lib/supabase';
import PageContainer from '../../../components/PageContainer';
import AuthGate from '../../_auth-gate';
import { useRouter } from 'expo-router';

type PollType = 'qcm' | 'yn' | 'text' | 'dropdown';
type TargetRole = 'SPP' | 'PATS' | 'ALL';

export default function AdminSondages() {
  const router = useRouter();
  const [sondages, setSondages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states
  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<PollType>('qcm');
  const [target, setTarget] = useState<TargetRole>('ALL');
  const [options, setOptions] = useState<string[]>(['', '']);

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

  const handleCreate = async () => {
    if (!question.trim()) return Alert.alert('Erreur', 'La question est obligatoire');

    const { data: newSondage, error: sError } = await supabase
      .from('sondages')
      .insert([
        {
          question,
          description,
          type,
          target,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (sError) return Alert.alert('Erreur', sError.message);

    // If QCM or Dropdown, add options
    if (type === 'qcm' || type === 'dropdown') {
      const validOptions = options.filter((o) => o.trim() !== '');
      if (validOptions.length < 2) {
        return Alert.alert('Erreur', 'Il faut au moins 2 options');
      }

      const optionsToInsert = validOptions.map((label) => ({
        sondage_id: newSondage.id,
        label,
      }));

      const { error: oError } = await supabase.from('sondage_options').insert(optionsToInsert);
      if (oError) Alert.alert('Erreur Options', oError.message);
    }

    setShowCreateModal(false);
    resetForm();
    fetchSondages();
  };

  const resetForm = () => {
    setQuestion('');
    setDescription('');
    setType('qcm');
    setTarget('ALL');
    setOptions(['', '']);
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
                      onPress={() => setType(it.k as PollType)}
                      style={[styles.chip, type === it.k && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, type === it.k && styles.chipTextActive]}>{it.l}</Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.label}>Question</Text>
                <TextInput
                  style={styles.input}
                  value={question}
                  onChangeText={setQuestion}
                  placeholder="Ex: Que pensez-vous du nouveau régime..."
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

                {(type === 'qcm' || type === 'dropdown') && (
                  <View>
                    <Text style={styles.label}>Options</Text>
                    {options.map((opt, idx) => (
                      <TextInput
                        key={idx}
                        style={styles.input}
                        value={opt}
                        onChangeText={(txt) => {
                          const newOpts = [...options];
                          newOpts[idx] = txt;
                          setOptions(newOpts);
                        }}
                        placeholder={`Option ${idx + 1}`}
                        placeholderTextColor="#666"
                      />
                    ))}
                    <Pressable
                      onPress={() => setOptions([...options, ''])}
                      style={styles.addOptionBtn}
                    >
                      <Text style={{ color: '#F8FF00' }}>+ Ajouter une option</Text>
                    </Pressable>
                  </View>
                )}

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
  modalActions: { flexDirection: 'row', gap: 15, marginTop: 30, marginBottom: 50 },
  cancelBtn: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  submitBtn: { flex: 2, backgroundColor: '#F8FF00', padding: 16, borderRadius: 12, alignItems: 'center' },
});
