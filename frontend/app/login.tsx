import { memo, useCallback, useMemo, useRef, useState } from 'react';
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
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';

import { USE_NATIVE_DRIVER } from '../lib/platform';
import ButtonAutonome from 'components/ui/ButtonAutonome';
import HeaderAuth from 'components/ui/HeaderAuth';
import InputAutonome from 'components/ui/InputAutonome';
import LoaderAutonome from 'components/ui/LoaderAutonome';

const MemoInput = memo(InputAutonome);

export default function Login() {
  const router = useRouter();
  const emailRef = useRef('');
  const passwordRef = useRef('');
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
    const email = emailRef.current;
    const password = passwordRef.current;

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

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

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
    } catch (err) {
      Alert.alert('Erreur', 'Un problème technique est survenu.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoaderAutonome />;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled={Platform.OS !== 'web'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.container, { pointerEvents: 'auto' }]}>
            {Platform.OS !== 'web' && (
              <Pressable
                onPress={Keyboard.dismiss}
                style={StyleSheet.absoluteFill}
              />
            )}

            <HeaderAuth title="Connexion" />

            <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
              <MemoInput
                key="login-email-input"
                placeholder="prenom.nom@sdmis.fr"
                defaultValue={emailRef.current}
                onChangeText={(text) => { emailRef.current = text; }}
                blurOnSubmit={false}
              />
            </Animated.View>

            <View style={styles.passwordRow}>
              <MemoInput
                key="login-password-input"
                placeholder="Mot de passe"
                defaultValue={passwordRef.current}
                onChangeText={(text) => { passwordRef.current = text; }}
                secureTextEntry={!showPassword}
                blurOnSubmit={false}
                style={{ flex: 1, marginBottom: 0 }}
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
            />

            <Pressable onPress={() => router.push('/forgot-password')} style={{ marginTop: 15 }}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 60,
  },
  container: {
    flex: 1,
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