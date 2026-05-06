import { useState, useRef, memo } from 'react';
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
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from 'lib/supabase';
import { USE_NATIVE_DRIVER } from '../lib/platform';
import { useRouter } from 'expo-router';

import LoaderAutonome from 'components/ui/LoaderAutonome';
import InputAutonome from 'components/ui/InputAutonome';
import ButtonAutonome from 'components/ui/ButtonAutonome';
import HeaderAuth from 'components/ui/HeaderAuth';

const MemoInput = memo(InputAutonome);

export default function Signup() {
  const router = useRouter();

  // 1. REFS (Focus stable sur mobile)
  const prenomRef = useRef('');
  const nomRef = useRef('');
  const emailRef = useRef('');
  const passwordRef = useRef('');
  const passwordConfirmRef = useRef('');

  // 2. STATES (UI uniquement)
  const [typeAgent, setTypeAgent] = useState<'SPP' | 'PATS' | ''>('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Animation shake
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: USE_NATIVE_DRIVER }),
    ]).start();
  };

  const isValidSdmisEmail = (value: string) =>
    /^[a-zA-Z0-9._%+-]+@sdmis\.fr$/.test(value.trim());

  const handleSignup = async () => {
    if (Platform.OS !== 'web') Keyboard.dismiss();
    console.log("🚀 Lancement du processus d'inscription...");

    const prenom = prenomRef.current.trim();
    const nom = nomRef.current.trim();
    const email = emailRef.current.trim();
    const password = passwordRef.current;
    const passwordConfirm = passwordConfirmRef.current;

    // VALIDATION
    if (!prenom || !nom || !typeAgent || !isValidSdmisEmail(email) || password.length < 6 || password !== passwordConfirm) {
      triggerShake();
      Vibration.vibrate(50);
      let msg = 'Veuillez remplir correctement tous les champs.';
      if (password && password.length < 6) msg = 'Le mot de passe est trop court (6 min).';
      if (password !== passwordConfirm) msg = 'Les mots de passe ne correspondent pas.';
      if (email && !isValidSdmisEmail(email)) msg = 'Utilisez votre mail @sdmis.fr uniquement.';
      if (!typeAgent) msg = 'Veuillez sélectionner SPP ou PATS.';

      Alert.alert('Champs incomplets', msg);
      return;
    }

    setLoading(true);

    try {
      // 1️⃣ Inscription Supabase avec Metadata propres
      // On envoie les deux clés (type_agent et role_agent) pour être sûr que le Trigger SQL fonctionne
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            prenom: prenom,
            nom: nom,
            type_agent: typeAgent, // 'SPP' ou 'PATS'
            role_agent: typeAgent, // Doublon de sécurité pour la table public.agents
            role: 'agent',
          }
        }
      });

      if (authError) {
        // Si l'utilisateur existe déjà en Auth mais pas en table agents, c'est ici que ça coince
        console.error("Erreur Auth SignUp:", authError.message);
        throw new Error(authError.message);
      }

      console.log("✅ Inscription Auth réussie pour:", authData.user?.email);

      // 2️⃣ Message de succès et redirection
      Alert.alert(
        'Inscription réussie !',
        'Votre compte a été créé. Vous pouvez maintenant vous connecter.',
        [{
          text: 'OK',
          onPress: () => {
            setTimeout(() => {
              router.replace('/login');
            }, 500);
          }
        }]
      );

    } catch (err: any) {
      console.error('Signup Global Error:', err.message);
      // On affiche le message d'erreur réel de Supabase (ex: "Database error saving new user")
      Alert.alert('Erreur lors de la création', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoaderAutonome />;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            {Platform.OS !== 'web' && (
              <Pressable onPress={Keyboard.dismiss} style={StyleSheet.absoluteFill} />
            )}

            <HeaderAuth title="Inscription" />

            <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
              <MemoInput
                placeholder="Prénom"
                defaultValue={prenomRef.current}
                onChangeText={(t) => { prenomRef.current = t; }}
                blurOnSubmit={false}
              />

              <MemoInput
                placeholder="Nom"
                defaultValue={nomRef.current}
                onChangeText={(t) => { nomRef.current = t; }}
                blurOnSubmit={false}
              />

              <Text style={styles.label}>Type d'agent</Text>
              <View style={styles.selectorRow}>
                <Pressable
                  style={[styles.selector, typeAgent === 'SPP' && styles.selectorActive]}
                  onPress={() => setTypeAgent('SPP')}
                >
                  <Text style={[styles.selectorText, typeAgent === 'SPP' && styles.selectorTextActive]}>SPP</Text>
                </Pressable>

                <Pressable
                  style={[styles.selector, typeAgent === 'PATS' && styles.selectorActive]}
                  onPress={() => setTypeAgent('PATS')}
                >
                  <Text style={[styles.selectorText, typeAgent === 'PATS' && styles.selectorTextActive]}>PATS</Text>
                </Pressable>
              </View>

              <MemoInput
                placeholder="prenom.nom@sdmis.fr"
                defaultValue={emailRef.current}
                onChangeText={(t) => { emailRef.current = t; }}
                autoCapitalize="none"
                keyboardType="email-address"
                blurOnSubmit={false}
              />

              <MemoInput
                placeholder="Mot de passe (6 car. min)"
                defaultValue={passwordRef.current}
                onChangeText={(t) => { passwordRef.current = t; }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                blurOnSubmit={false}
              />

              <MemoInput
                placeholder="Confirmer mot de passe"
                defaultValue={passwordConfirmRef.current}
                onChangeText={(t) => { passwordConfirmRef.current = t; }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                blurOnSubmit={false}
              />
            </Animated.View>

            <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
              <Text style={styles.eyeText}>{showPassword ? '👁️ Masquer' : '👁️ Afficher'}</Text>
            </Pressable>

            <ButtonAutonome title="Créer mon compte" onPress={handleSignup} />

            <Pressable onPress={() => router.push('/login')} style={styles.loginLink}>
              <Text style={styles.loginLinkText}>Déjà inscrit ? Connexion</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000' },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 30,
    justifyContent: 'flex-start',
  },
  label: { color: '#666', fontSize: 14, marginBottom: 10, marginLeft: 5 },
  selectorRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
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
  selectorActive: { backgroundColor: '#F8FF00', borderColor: '#F8FF00' },
  selectorText: { color: '#fff', fontWeight: '700' },
  selectorTextActive: { color: '#000' },
  eyeButton: { marginBottom: 20, alignSelf: 'flex-end' },
  eyeText: { color: '#F8FF00', fontSize: 14 },
  loginLink: { marginTop: 20 },
  loginLinkText: { color: '#F8FF00', textAlign: 'center' },
});