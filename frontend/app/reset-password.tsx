import { useState, useRef } from 'react';
import {
  View,
  Alert,
  StyleSheet,
  Text,
  Animated,
  Vibration,
} from 'react-native';
import { supabase } from 'lib/supabase';
import { useRouter } from 'expo-router';

import LoaderAutonome from 'components/ui/LoaderAutonome';
import InputAutonome from 'components/ui/InputAutonome';
import ButtonAutonome from 'components/ui/ButtonAutonome';
import HeaderAuth from 'components/ui/HeaderAuth';

export default function ResetPassword() {
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
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

  // Force du mot de passe
  const passwordStrength = (() => {
    if (password.length < 6) return 'weak';
    if (password.length < 10) return 'medium';
    return 'strong';
  })();

  const allValid =
    password.length >= 6 &&
    passwordConfirm.length >= 6 &&
    password === passwordConfirm;

  const handleUpdate = async () => {
    if (!allValid) {
      triggerShake();
      Vibration.vibrate(50);
      Alert.alert('Erreur', 'Veuillez vérifier les champs.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      Alert.alert('Erreur', error.message);
      return;
    }

    Alert.alert('Succès', 'Votre mot de passe a été mis à jour.');
    router.replace('/login');
  };

  if (loading) return <LoaderAutonome />;

  return (
    <View style={styles.container}>
      <HeaderAuth title="Nouveau mot de passe" />

      <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
        <InputAutonome
          placeholder="Nouveau mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={[
            password.length > 0 && passwordStrength !== 'weak' && styles.validInput,
            password.length > 0 && passwordStrength === 'weak' && styles.invalidInput,
          ]}
        />

        <InputAutonome
          placeholder="Confirmer le mot de passe"
          value={passwordConfirm}
          onChangeText={setPasswordConfirm}
          secureTextEntry
          style={[
            passwordConfirm.length > 0 &&
              passwordConfirm === password &&
              styles.validInput,
            passwordConfirm.length > 0 &&
              passwordConfirm !== password &&
              styles.invalidInput,
          ]}
        />
      </Animated.View>

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

      <ButtonAutonome
        title="Mettre à jour"
        onPress={handleUpdate}
        disabled={!allValid}
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
