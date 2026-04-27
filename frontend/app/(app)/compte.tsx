import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { useEffect, useState } from 'react';
import * as RN from 'react-native';
import PageContainer from '../../components/PageContainer';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

type GradeOption = { label: string; value: string };

const GRADES_SPP: GradeOption[] = [
  { label: 'Sapeur', value: 'Sapeur' },
  { label: 'Caporal', value: 'Caporal' },
  { label: 'Sergent', value: 'Sergent' },
  { label: 'Adjudant', value: 'Adjudant' },
];

const GRADES_PATS: GradeOption[] = [
  { label: 'Catégorie C', value: 'Catégorie C' },
  { label: 'Catégorie B', value: 'Catégorie B' },
  { label: 'Catégorie A', value: 'Catégorie A' },
];

export default function Compte() {
  const [user, setUser] = useState<any>(null);
  const [agent, setAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [matricule, setMatricule] = useState('');
  const [grade, setGrade] = useState('');
  const [affectation, setAffectation] = useState('');
  const [dateEntree, setDateEntree] = useState<Date | null>(null);
  const [dateNomination, setDateNomination] = useState<Date | null>(null);
  const [dateEntreeWeb, setDateEntreeWeb] = useState('');
  const [dateNominationWeb, setDateNominationWeb] = useState('');
  const [phone, setPhone] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const [showDatePicker, setShowDatePicker] = useState<'entree' | 'nomination' | null>(null);
  const [showGradeModal, setShowGradeModal] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: agentData, error } = await supabase
          .from('agents')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!error && agentData) {
          setAgent(agentData);
          setMatricule(agentData.matricule || '');
          setGrade(agentData.grade || '');
          setAffectation(agentData.affectation || '');

          const de = agentData.date_entree ? new Date(agentData.date_entree) : null;
          const dn = agentData.date_nomination ? new Date(agentData.date_nomination) : null;

          setDateEntree(de);
          setDateNomination(dn);
          setDateEntreeWeb(agentData.date_entree || '');
          setDateNominationWeb(agentData.date_nomination || '');

          setPhone(agentData.telephone || '');
          setProfileImage(agentData.photo_url || null);
        }
      }
    } catch (err) {
      console.error('Erreur chargement profil:', err);
    } finally {
      setLoading(false);
    }
  };

  const safeIsoDate = (date: any) => {
    if (date instanceof Date && !isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    return null;
  };

  const handleUpdate = async () => {
    if (!user) return;
    setSaving(true);

    const updates = {
      matricule: matricule || null,
      grade: grade || null,
      affectation: affectation || null,
      date_entree: RN.Platform.OS === 'web' ? (dateEntreeWeb || null) : safeIsoDate(dateEntree),
      date_nomination: RN.Platform.OS === 'web' ? (dateNominationWeb || null) : safeIsoDate(dateNomination),
      telephone: phone || null,
      photo_url: profileImage || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('agents')
      .update(updates)
      .eq('id', user.id);

    setSaving(false);
    if (error) {
      RN.Alert.alert('Erreur Sauvegarde', JSON.stringify(error));
    } else {
      setIsEditing(false);
      loadProfile();
      RN.Alert.alert('Succès', 'Profil mis à jour !');
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <RN.View style={styles.center}>
          <RN.ActivityIndicator size="large" color="#F8FF00" />
          <RN.Text style={styles.loadingText}>Chargement du profil…</RN.Text>
        </RN.View>
      </PageContainer>
    );
  }

  const grades = agent?.role_agent === 'PATS' ? GRADES_PATS : GRADES_SPP;

  return (
    <PageContainer>
      <RN.ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        <RN.View style={styles.header}>
          <RN.View style={styles.avatarContainer}>
            <RN.Pressable onPress={isEditing ? pickImage : undefined}>
              {profileImage ? (
                <RN.Image source={{ uri: profileImage }} style={styles.avatarImage} />
              ) : (
                <RN.View style={styles.avatar}>
                  <RN.Text style={styles.avatarLetter}>
                    {user?.email?.charAt(0).toUpperCase()}
                  </RN.Text>
                </RN.View>
              )}
              {isEditing && (
                <RN.View style={styles.editBadge}>
                  <MaterialIcons name="photo-camera" size={16} color="#000" />
                </RN.View>
              )}
            </RN.Pressable>
          </RN.View>

          <RN.View style={{ flex: 1 }}>
            <RN.View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <RN.Text style={styles.userEmail}>{user?.email}</RN.Text>
              {grade && grade !== '' && grade !== 'Non renseigné' && (
                <RN.Image
                  source={{ uri: `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/assets_grades/${grade.toLowerCase().replace(/ /g, '_')}.png` }}
                  style={{ width: 24, height: 24 }}
                  resizeMode="contain"
                />
              )}
            </RN.View>
            <RN.View style={styles.roleBadge}>
              <RN.Text style={styles.roleText}>{agent?.role_agent || 'Agent'} SDMIS</RN.Text>
            </RN.View>
          </RN.View>

          <RN.Pressable
            onPress={() => isEditing ? handleUpdate() : setIsEditing(true)}
            style={[styles.editBtn, isEditing && styles.saveBtn]}
          >
            {saving ? (
              <RN.ActivityIndicator size="small" color="#000" />
            ) : (
              <MaterialIcons name={isEditing ? "check" : "edit"} size={20} color="#000" />
            )}
          </RN.Pressable>
        </RN.View>

        <RN.View style={styles.card}>
          <RN.View style={styles.cardHeader}>
            <MaterialIcons name="person" size={20} color="#F8FF00" />
            <RN.Text style={styles.cardTitle}>Informations Agent</RN.Text>
          </RN.View>

          <RN.View style={styles.field}>
            <RN.Text style={styles.label}>Matricule</RN.Text>
            {isEditing ? (
              <RN.TextInput
                style={styles.input}
                value={matricule}
                onChangeText={setMatricule}
                placeholder="Ex: 12345"
                placeholderTextColor="#666"
                keyboardType="numeric"
              />
            ) : (
              <RN.Text style={styles.value}>{matricule || 'Non renseigné'}</RN.Text>
            )}
          </RN.View>

          <RN.View style={styles.field}>
            <RN.Text style={styles.label}>Grade / Classe d'emploi</RN.Text>
            {isEditing ? (
              <RN.Pressable style={styles.input} onPress={() => setShowGradeModal(true)}>
                <RN.Text style={{ color: grade ? '#fff' : '#666' }}>{grade || 'Sélectionner...'}</RN.Text>
              </RN.Pressable>
            ) : (
              <RN.Text style={styles.value}>{grade || 'Non renseigné'}</RN.Text>
            )}
          </RN.View>

          <RN.View style={styles.field}>
            <RN.Text style={styles.label}>{agent?.role_agent === 'PATS' ? 'Service' : 'Caserne / Affectation'}</RN.Text>
            {isEditing ? (
              <RN.TextInput
                style={styles.input}
                value={affectation}
                onChangeText={setAffectation}
                placeholder="Ex: Lyon-Corneille"
                placeholderTextColor="#666"
              />
            ) : (
              <RN.Text style={styles.value}>{affectation || 'Non renseignée'}</RN.Text>
            )}
          </RN.View>
        </RN.View>

        <RN.View style={styles.card}>
          <RN.View style={styles.cardHeader}>
            <MaterialIcons name="event" size={20} color="#F8FF00" />
            <RN.Text style={styles.cardTitle}>Dates Clés</RN.Text>
          </RN.View>

          <RN.View style={styles.field}>
            <RN.Text style={styles.label}>Date d'entrée au SDMIS</RN.Text>
            {isEditing ? (
              RN.Platform.OS === 'web' ? (
                <RN.TextInput
                  style={styles.input}
                  value={dateEntreeWeb}
                  onChangeText={setDateEntreeWeb}
                  placeholder="AAAA-MM-JJ"
                  placeholderTextColor="#666"
                />
              ) : (
                <RN.Pressable style={styles.input} onPress={() => setShowDatePicker('entree')}>
                  <RN.Text style={{ color: '#fff' }}>{dateEntree ? dateEntree.toLocaleDateString('fr-FR') : 'Sélectionner...'}</RN.Text>
                </RN.Pressable>
              )
            ) : (
              <RN.Text style={styles.value}>{dateEntree ? dateEntree.toLocaleDateString('fr-FR') : 'Non renseignée'}</RN.Text>
            )}
          </RN.View>

          <RN.View style={styles.field}>
            <RN.Text style={styles.label}>Date de nomination grade actuel</RN.Text>
            {isEditing ? (
              RN.Platform.OS === 'web' ? (
                <RN.TextInput
                  style={styles.input}
                  value={dateNominationWeb}
                  onChangeText={setDateNominationWeb}
                  placeholder="AAAA-MM-JJ"
                  placeholderTextColor="#666"
                />
              ) : (
                <RN.Pressable style={styles.input} onPress={() => setShowDatePicker('nomination')}>
                  <RN.Text style={{ color: '#fff' }}>{dateNomination ? dateNomination.toLocaleDateString('fr-FR') : 'Sélectionner...'}</RN.Text>
                </RN.Pressable>
              )
            ) : (
              <RN.Text style={styles.value}>{dateNomination ? dateNomination.toLocaleDateString('fr-FR') : 'Non renseignée'}</RN.Text>
            )}
          </RN.View>
        </RN.View>

        <RN.View style={styles.card}>
          <RN.View style={styles.cardHeader}>
            <MaterialIcons name="phone" size={20} color="#F8FF00" />
            <RN.Text style={styles.cardTitle}>Contact</RN.Text>
          </RN.View>

          <RN.View style={styles.field}>
            <RN.Text style={styles.label}>Téléphone professionnel / personnel</RN.Text>
            {isEditing ? (
              <RN.TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="06 00 00 00 00"
                placeholderTextColor="#666"
                keyboardType="phone-pad"
              />
            ) : (
              <RN.Text style={styles.value}>{phone || 'Non renseigné'}</RN.Text>
            )}
          </RN.View>
        </RN.View>

        {isEditing && (
          <RN.Pressable style={styles.cancelBtn} onPress={() => setIsEditing(false)}>
            <RN.Text style={styles.cancelBtnText}>Annuler les modifications</RN.Text>
          </RN.Pressable>
        )}

        <RN.View style={styles.actions}>
          <RN.Pressable
            style={styles.logoutBtn}
            onPress={async () => {
              await supabase.auth.signOut();
            }}
          >
            <RN.Text style={styles.logoutText}>Se déconnecter</RN.Text>
          </RN.Pressable>
        </RN.View>

        {showDatePicker && RN.Platform.OS !== 'web' && (
          <DateTimePicker
            value={showDatePicker === 'entree' ? (dateEntree || new Date()) : (dateNomination || new Date())}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(null);
              if (selectedDate) {
                if (showDatePicker === 'entree') setDateEntree(selectedDate);
                else setDateNomination(selectedDate);
              }
            }}
          />
        )}

        <RN.Modal visible={showGradeModal} transparent animationType="fade">
          <RN.View style={styles.modalOverlay}>
            <RN.View style={styles.modalContent}>
              <RN.Text style={styles.modalTitle}>Sélectionner un grade</RN.Text>
              {grades.map((g) => (
                <RN.Pressable
                  key={g.value}
                  style={styles.gradeOption}
                  onPress={() => {
                    setGrade(g.value);
                    setShowGradeModal(false);
                  }}
                >
                  <RN.Text style={styles.gradeOptionText}>{g.label}</RN.Text>
                  {grade === g.value && <MaterialIcons name="check" size={20} color="#F8FF00" />}
                </RN.Pressable>
              ))}
              <RN.Pressable style={styles.closeModalBtn} onPress={() => setShowGradeModal(false)}>
                <RN.Text style={styles.closeModalText}>Fermer</RN.Text>
              </RN.Pressable>
            </RN.View>
          </RN.View>
        </RN.Modal>

      </RN.ScrollView>
    </PageContainer>
  );
}

const styles = RN.StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    gap: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F8FF00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 36,
    fontWeight: '700',
    color: '#000',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#F8FF00',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#F8FF00',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  userEmail: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  roleBadge: {
    marginTop: 4,
    backgroundColor: '#F8FF00',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  roleText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 10,
  },
  editBtn: {
    backgroundColor: '#F8FF00',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    backgroundColor: '#4CAF50',
  },
  card: {
    backgroundColor: '#111',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
    padding: 20,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    paddingBottom: 10,
  },
  cardTitle: {
    color: '#F8FF00',
    fontSize: 18,
    fontWeight: '700',
  },
  field: {
    marginBottom: 15,
  },
  label: {
    color: '#666',
    fontSize: 12,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  value: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  actions: {
    marginTop: 20,
  },
  logoutBtn: {
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ff444455',
  },
  logoutText: {
    color: '#ff4444',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 16,
  },
  cancelBtn: {
    marginBottom: 20,
  },
  cancelBtnText: {
    color: '#666',
    textAlign: 'center',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalTitle: {
    color: '#F8FF00',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  gradeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  gradeOptionText: {
    color: '#fff',
    fontSize: 16,
  },
  closeModalBtn: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#222',
    borderRadius: 12,
  },
  closeModalText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
