import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  Vibration,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';

import { USE_NATIVE_DRIVER } from '../lib/platform';
import ButtonAutonome from 'components/ui/ButtonAutonome';
import HeaderAuth from 'components/ui/HeaderAuth';
import InputAutonome from 'components/ui/InputAutonome';
import LoaderAutonome from 'components/ui/LoaderAutonome';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: USE_NATIVE_DRIVER }),
    ]).start();
  };

  const handleLogin = async () => {
    if (!email.trim() || !email.includes('@')) {
      triggerShake();
      Vibration.vibrate(40);
      Alert.alert('Adresse invalide', 'Veuillez entrer une adresse email valide.');
      return;
    }

    if (!password.trim()) {
      triggerShake();
      Vibration.vibrate(40);
      Alert.alert('Mot de passe requis', 'Veuillez entrer votre mot de passe.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      triggerShake();
      Vibration.vibrate(60);

      let message = 'Une erreur est survenue.';

      if (error.message.includes('Invalid login credentials')) {
        message = 'Adresse ou mot de passe incorrect.';
      }

      Alert.alert('Erreur', message);
      return;
    }

    router.replace('/');
  };

  const handleResetPassword = async () => {
    if (!email.trim() || !email.includes('@')) {
      triggerShake();
      Vibration.vibrate(40);
      Alert.alert('Adresse invalide', 'Veuillez entrer une adresse email valide.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'autonome://auth/callback',
    });

    setLoading(false);

    if (error) {
      triggerShake();
      Vibration.vibrate(60);
      Alert.alert('Erreur', error.message);
      return;
    }

    Alert.alert(
      'Email envoyé',
      'Un lien de réinitialisation a été envoyé à votre adresse.'
    );
  };

  if (loading) return <LoaderAutonome />;

  const emailValid = email.includes('@');
  const passwordValid = password.length > 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.container}>
          <HeaderAuth title="Connexion" />

          <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
            <InputAutonome
              placeholder="prenom.nom@sdmis.fr"
              value={email}
              onChangeText={setEmail}
              style={[
                emailValid && styles.validInput,
                !emailValid && email.length > 0 && styles.invalidInput,
              ]}
            />
          </Animated.View>

          <View style={styles.passwordRow}>
            <InputAutonome
              placeholder="Mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              style={[
                { flex: 1, marginBottom: 0 },
                passwordValid && styles.validInput,
              ]}
            />

            <Pressable
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
            >
              <Text style={{ color: '#F8FF00', fontSize: 16 }}>
                {showPassword ? '👁️‍🗨️' : '👁️'}
              </Text>
            </Pressable>
          </View>

          <ButtonAutonome
            title="Se connecter"
            onPress={handleLogin}
            disabled={!emailValid || !passwordValid}
          />

          <Pressable onPress={handleResetPassword} style={{ marginTop: 15 }}>
            <Text style={{ color: '#F8FF00', textAlign: 'center' }}>
              Mot de passe oublié
            </Text>
          </Pressable>

          <Pressable onPress={() => router.push('/signup')} style={{ marginTop: 20 }}>
            <Text style={{ color: '#F8FF00', textAlign: 'center' }}>
              Pas encore de compte ? Créer un compte
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
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  eyeButton: {
    padding: 10,
    marginLeft: 8,
    backgroundColor: '#222',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  validInput: {
    borderColor: '#F8FF00',
    ...Platform.select({
      web: { boxShadow: '0px 0px 6px rgba(248, 255, 0, 0.4)' },
      default: { shadowColor: '#F8FF00', shadowOpacity: 0.4, shadowRadius: 6 },
    }),
  },
  invalidInput: {
    borderColor: '#FF4444',
  },
});
