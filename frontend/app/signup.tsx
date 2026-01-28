import { useState, useRef } from 'react';
import {
  View,
  Alert,
  StyleSheet,
  Pressable,
  Text,
  Animated,
  Vibration,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';

import LoaderAutonome from '@/components/ui/LoaderAutonome';
import InputAutonome from '@/components/ui/InputAutonome';
import ButtonAutonome from '@/components/ui/ButtonAutonome';
import HeaderAuth from '@/components/ui/HeaderAuth';

export default function Signup() {
  const router = useRouter();

  const [pseudo, setPseudo] = useState('');
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [typeAgent, setTypeAgent] = useState<'SPP' | 'PATS' | ''>('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  // Animation shake
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

  const isValidSdmisEmail = (value: string) =>
    /^[a-zA-Z0-9._%+-]+@sdmis\.fr$/.test(value.trim());

  const passwordStrength = (() => {
    if (password.length < 6) return 'weak';
    if (password.length < 10) return 'medium';
    return 'strong';
  })();

  const allValid =
    pseudo.trim() &&
    prenom.trim() &&
    nom.trim() &&
    typeAgent &&
    isValidSdmisEmail(email) &&
    password.length >= 6 &&
    password === passwordConfirm;

  const handleSignup = async () => {
    if (!allValid) {
      triggerShake();
      Vibration.vibrate(50);
      Alert.alert('Champs incomplets', 'Veuillez remplir correctement tous les champs.');
      return;
    }

    setLoading(true);

    // 1️⃣ Création du compte Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      setLoading(false);
      Alert.alert('Erreur', authError?.message);
      return;
    }

    // 2️⃣ Appel à la Edge Function pour créer l'agent côté serveur
    await fetch("https://cnskvexluuaxdxsquwzc.supabase.co/functions/v1/smart-service", {
  method: "POST",
  mode: "cors",   // 🔥 AJOUT ICI
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    user_id: authData.user.id,
    email,
  }),
});

    // 3️⃣ Fin du processus
    setLoading(false);

    Alert.alert(
      'Email envoyé',
      'Un lien de confirmation vous a été envoyé. Consultez votre boîte mail SDMIS.'
    );

    router.replace('/splash');
  };

  if (loading) return <LoaderAutonome />;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.container}>
          <HeaderAuth title="Créer un compte" />

          <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
            <InputAutonome
              placeholder="Identifiant / Pseudo"
              value={pseudo}
              onChangeText={setPseudo}
              style={[pseudo && styles.validInput]}
            />

            <InputAutonome
              placeholder="Prénom"
              value={prenom}
              onChangeText={setPrenom}
              style={[prenom && styles.validInput]}
            />

            <InputAutonome
              placeholder="Nom"
              value={nom}
              onChangeText={setNom}
              style={[nom && styles.validInput]}
            />

            {/* Sélecteur SPP / PATS */}
            <View style={styles.selectorRow}>
              <Pressable
                style={[styles.selector, typeAgent === 'SPP' && styles.selectorActive]}
                onPress={() => setTypeAgent('SPP')}
              >
                <Text style={styles.selectorText}>SPP</Text>
              </Pressable>

              <Pressable
                style={[styles.selector, typeAgent === 'PATS' && styles.selectorActive]}
                onPress={() => setTypeAgent('PATS')}
              >
                <Text style={styles.selectorText}>PATS</Text>
              </Pressable>
            </View>

            <InputAutonome
              placeholder="prenom.nom@sdmis.fr"
              value={email}
              onChangeText={setEmail}
              style={[
                email && isValidSdmisEmail(email) && styles.validInput,
                email && !isValidSdmisEmail(email) && styles.invalidInput,
              ]}
            />

            <InputAutonome
              placeholder="Mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              style={[
                password && passwordStrength !== 'weak' && styles.validInput,
                password && passwordStrength === 'weak' && styles.invalidInput,
              ]}
            />

            <InputAutonome
              placeholder="Confirmer le mot de passe"
              value={passwordConfirm}
              onChangeText={setPasswordConfirm}
              secureTextEntry={!showPassword}
              style={[
                passwordConfirm &&
                  passwordConfirm === password &&
                  styles.validInput,
                passwordConfirm &&
                  passwordConfirm !== password &&
                  styles.invalidInput,
              ]}
            />
          </Animated.View>

          {/* Afficher / masquer */}
          <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
            <Text style={{ color: '#F8FF00', fontSize: 16 }}>
              {showPassword ? '👁️‍🗨️ Masquer' : '👁️ Afficher'}
            </Text>
          </Pressable>

          {/* Jauge de force */}
          {password.length > 0 && (
            <Text
              style={[
                styles.strength,
                passwordStrength === 'weak' && { color: '#FF4444' },
                passwordStrength === 'medium' && { color: '#F8FF00' },
                passwordStrength === 'strong' && { color: '#00FF88' },
              ]}
            >
              Force du mot de passe : {passwordStrength}
            </Text>
          )}

          <ButtonAutonome title="Créer mon compte" onPress={handleSignup} disabled={!allValid} />

          <Pressable onPress={() => router.push('/login')} style={{ marginTop: 20 }}>
            <Text style={{ color: '#F8FF00', textAlign: 'center' }}>
              Déjà un compte ? Se connecter
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
    justifyContent: 'center',
  },
  selectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  selector: {
    flex: 1,
    padding: 12,
    marginHorizontal: 5,
    backgroundColor: '#111',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  selectorActive: {
    backgroundColor: '#F8FF00',
    borderColor: '#F8FF00',
  },
  selectorText: {
    color: '#fff',
    fontWeight: '700',
  },
  eyeButton: {
    marginBottom: 10,
    alignSelf: 'flex-end',
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
  strength: {
    marginBottom: 20,
    fontWeight: '700',
  },
});
