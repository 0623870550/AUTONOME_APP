import { useState, useRef } from 'react';
import {
  View,
  Alert,
  Platform,
  StyleSheet,
  Text,
  Animated,
  Vibration,
  Keyboard
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

  const handleReset = async () => {
    if (Platform.OS !== 'web') Keyboard.dismiss();
    const cleanEmail = email.trim().toLowerCase();

    if (!isValidSdmisEmail(cleanEmail)) {
      triggerShake();
      Vibration.vibrate(40);
      Alert.alert('Adresse invalide', 'Veuillez entrer votre adresse @sdmis.fr.');
      return;
    }

    setLoading(true);

    try {
      /**
       * CORRECTION CRUCIALE : 
       * On utilise 'autonome://auth/callback' car c'est ce qui est déclaré 
       * dans ton intentFilter Android (app.json) et ta liste Supabase.
       */
      const redirectUrl = Platform.OS === 'web'
        ? `${window.location.origin}/reset-password`
        : 'autonome://auth/callback';

      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      Alert.alert(
        'Email envoyé ✅',
        `Un lien a été envoyé à ${cleanEmail}.\n\nOuvrez ce mail sur votre téléphone et cliquez sur le lien pour revenir dans l'application.`,
        [{ text: 'OK', onPress: () => router.replace('/login') }]
      );

    } catch (error: any) {
      console.error("Erreur reset:", error.message);
      if (error.message.includes('rate limit')) {
        Alert.alert('Trop de tentatives', "Veuillez patienter une heure avant de réessayer.");
      } else {
        Alert.alert('Erreur', "Une erreur est survenue lors de l'envoi.");
      }
    } finally {
      setLoading(false);
    }
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
          autoCapitalize="none"
          keyboardType="email-address"
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
        style={styles.link}
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
  validInput: { borderColor: '#F8FF00' },
  invalidInput: { borderColor: '#FF4444' },
  link: {
    color: '#F8FF00',
    textAlign: 'center',
    marginTop: 20,
    fontWeight: '600',
  }
});