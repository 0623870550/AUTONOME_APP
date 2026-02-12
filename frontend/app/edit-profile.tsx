import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  Animated,
  Vibration,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from 'lib/supabase';
import { useSession } from 'context/SupabaseSessionProvider';
import { useRouter } from 'expo-router';

export default function EditProfileScreen() {
  const session = useSession();
  const router = useRouter();

  const [agent, setAgent] = useState<any>(null);
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [typeAgent, setTypeAgent] = useState('');
  const [telephone, setTelephone] = useState('');
  const [loading, setLoading] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    if (!session?.user) return;

    const fetchAgent = async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('id', session.user.id) // ✅ filtrage par id
        .single();

      if (!error) {
        setAgent(data);
        setPrenom(data.prenom);
        setNom(data.nom);
        setTypeAgent(data.type_agent);
        setTelephone(data.telephone || '');
      }
    };

    fetchAgent();
  }, [session]);

  const isValidPhone = (value: string) =>
    /^(\+33|0)[1-9](\d{2}){4}$/.test(value.replace(/\s+/g, ''));

  const handleSave = async () => {
    if (!prenom.trim() || !nom.trim()) {
      triggerShake();
      Vibration.vibrate(50);
      Alert.alert('Erreur', 'Prénom et nom sont obligatoires.');
      return;
    }

    if (telephone && !isValidPhone(telephone)) {
      triggerShake();
      Vibration.vibrate(50);
      Alert.alert('Numéro invalide', 'Veuillez entrer un numéro français valide.');
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from('agents')
      .update({
        prenom,
        nom,
        type_agent: typeAgent,
        telephone: telephone || null,
      })
      .eq('id', session.user.id); // ✅ mise à jour sécurisée via id

    setLoading(false);

    if (error) {
      Alert.alert('Erreur', error.message);
      return;
    }

    Alert.alert('Succès', 'Votre profil a été mis à jour.');
    router.replace('/profile');
  };

  if (!agent) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ color: '#fff' }}>Chargement...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
        <Text style={styles.label}>Prénom</Text>
        <TextInput
          style={[styles.input, prenom.trim() ? styles.validInput : styles.invalidInput]}
          value={prenom}
          onChangeText={setPrenom}
        />

        <Text style={styles.label}>Nom</Text>
        <TextInput
          style={[styles.input, nom.trim() ? styles.validInput : styles.invalidInput]}
          value={nom}
          onChangeText={setNom}
        />

        <Text style={styles.label}>Type d’agent</Text>
        <View style={styles.typeRow}>
          <Pressable
            style={[styles.typeButton, typeAgent === 'SPP' && styles.typeSelected]}
            onPress={() => setTypeAgent('SPP')}
          >
            <Text style={styles.typeText}>SPP</Text>
          </Pressable>

          <Pressable
            style={[styles.typeButton, typeAgent === 'PATS' && styles.typeSelected]}
            onPress={() => setTypeAgent('PATS')}
          >
            <Text style={styles.typeText}>PATS</Text>
          </Pressable>
        </View>

        <Text style={styles.label}>Téléphone</Text>
        <TextInput
          style={[
            styles.input,
            telephone.length === 0
              ? null
              : isValidPhone(telephone)
              ? styles.validInput
              : styles.invalidInput,
          ]}
          value={telephone}
          onChangeText={setTelephone}
          placeholder="06 12 34 56 78"
          keyboardType="phone-pad"
        />
      </Animated.View>

      <Pressable style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Enregistrer</Text>
      </Pressable>

      <Pressable style={styles.cancelButton} onPress={() => router.back()}>
        <Text style={styles.cancelButtonText}>Annuler</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  label: {
    color: '#F8FF00',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 15,
  },
  input: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    marginTop: 5,
  },
  validInput: {
    borderColor: '#F8FF00',
    shadowColor: '#F8FF00',
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  invalidInput: {
    borderColor: '#FF4444',
  },
  typeRow: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 10,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#111',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    marginRight: 10,
  },
  typeSelected: {
    backgroundColor: '#F8FF00',
    borderColor: '#F8FF00',
  },
  typeText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: '#F8FF00',
    padding: 14,
    borderRadius: 8,
    marginTop: 30,
  },
  saveButtonText: {
    textAlign: 'center',
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
  },
  cancelButton: {
    padding: 14,
    borderRadius: 8,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#444',
  },
  cancelButtonText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: '700',
  },
});
