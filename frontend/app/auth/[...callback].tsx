import { useEffect, useState } from 'react';
import { Text, View, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from 'lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [status, setStatus] = useState('Initialisation...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const access_token = params.access_token as string | undefined;
    const refresh_token = params.refresh_token as string | undefined;
    const type = params.type as string | undefined;

    // Cas 1 : lien de confirmation Supabase (type=recovery)
    if (access_token && type === 'recovery') {
      setStatus('➡️ Confirmation reçue, connexion en cours...');

      supabase.auth.setSession({
        access_token,
        refresh_token: refresh_token ?? ''
      })
        .then(({ error }) => {
          if (error) {
            setStatus('❌ Erreur Supabase');
            setErrorMessage(error.message);
            return;
          }

          setStatus('✅ Compte confirmé, redirection...');
          router.replace('/(tabs)');
        });

      return;
    }

    // Cas 2 : lien OAuth ou magic link (avec refresh_token)
    if (access_token && refresh_token) {
      setStatus('➡️ Token reçu, tentative de connexion...');

      supabase.auth.setSession({ access_token, refresh_token })
        .then(({ error }) => {
          if (error) {
            setStatus('❌ Erreur Supabase');
            setErrorMessage(error.message);
            return;
          }

          setStatus('✅ Connexion réussie, redirection...');
          router.replace('/(tabs)');
        });

      return;
    }

    // Cas 3 : rien de valide
    setStatus('❌ Token manquant ou lien invalide');
  }, [params]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <ActivityIndicator size="large" color="#FFD700" />
      <Text style={{ marginTop: 20, fontSize: 16, textAlign: 'center' }}>{status}</Text>
      {errorMessage && (
        <Text style={{ marginTop: 10, fontSize: 14, color: 'red', textAlign: 'center' }}>
          {errorMessage}
        </Text>
      )}
    </View>
  );
}
