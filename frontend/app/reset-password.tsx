import { useState, useRef } from 'react';
import { View, Alert, StyleSheet, Text, Animated, Vibration, Keyboard } from 'react-native';
import { supabase } from 'lib/supabase';
import { USE_NATIVE_DRIVER } from '../lib/platform';
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
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const handleUpdate = async () => {
    Keyboard.dismiss();
    if (password.length < 6 || password !== passwordConfirm) {
      Vibration.vibrate(50);
      Alert.alert('Erreur', 'Vérifiez la conformité des mots de passe.');
      return;
    }

    setLoading(true);
    // Cette méthode fonctionne car le lien du mail contient un token de session
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      Alert.alert('Erreur', error.message);
      return;
    }

    Alert.alert('Succès', 'Votre mot de passe a été mis à jour.', [
      { text: 'OK', onPress: () => router.replace('/login') }
    ]);
  };

  if (loading) return <LoaderAutonome />;

  return (
    <View style={styles.container}>
      <HeaderAuth title="Nouveau mot de passe" />
      <InputAutonome placeholder="Nouveau mot de passe" value={password} onChangeText={setPassword} secureTextEntry />
      <InputAutonome placeholder="Confirmer le mot de passe" value={passwordConfirm} onChangeText={setPasswordConfirm} secureTextEntry />
      <ButtonAutonome title="Mettre à jour" onPress={handleUpdate} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 20, justifyContent: 'center' }
});