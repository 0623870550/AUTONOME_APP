import { useState, useRef } from 'react';
import {
  View,
  Alert,
  Platform,
  StyleSheet,
  Text,
  Animated,
  Vibration,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { USE_NATIVE_DRIVER } from '../lib/platform';
import { useRouter } from 'expo-router';

import LoaderAutonome from 'components/ui/LoaderAutonome';
import InputAutonome from 'components/ui/InputAutonome';
import ButtonAutonome from 'components/ui/ButtonAutonome';
import HeaderAuth from 'components/ui/HeaderAuth';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // Animation shake
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

  const isValidSdmisEmail = (value: string) =>
    /^[a-zA-Z0-9._%+-]+@sdmis\.fr$/.test(value.trim());

  const handleReset = async () => {
    if (!isValidSdmisEmail(email)) {
      triggerShake();
      Vibration.vibrate(40);
      Alert.alert('Adresse invalide', 'Veuillez entrer votre adresse @sdmis.fr.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: 'autonome://auth/callback',
    });

    setLoading(false);

    if (error) {
      Alert.alert('Erreur', error.message);
      return;
    }

    Alert.alert(
      'Email envoyé ✅',
      'Un lien de réinitialisation vous a été envoyé. Cliquez dessus depuis votre téléphone pour définir un nouveau mot de passe.',
      [{ text: 'OK', onPress: () => router.replace('/login') }]
    );

  };

  if (loading) return <LoaderAutonome />;

  const emailValid = isValidSdmisEmail(email);

  return (
    <View style={styles.container}>
      <HeaderAuth title="Mot de passe oublié" />

      <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
        <InputAutonome
          placeholder="prenom.nom@sdmis.fr"
          value={email}
          onChangeText={setEmail}
          style={[
            email.length > 0 && emailValid && styles.validInput,
            email.length > 0 && !emailValid && styles.invalidInput,
          ]}
        />
      </Animated.View>

      <ButtonAutonome
        title="Envoyer le lien"
        onPress={handleReset}
        disabled={!emailValid}
      />

      <Text
        style={{ color: '#F8FF00', textAlign: 'center', marginTop: 20 }}
        onPress={() => router.push('/login')}
      >
        Retour à la connexion
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
    justifyContent: 'center',
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
