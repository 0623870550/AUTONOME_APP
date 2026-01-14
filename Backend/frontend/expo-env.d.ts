import { useEffect, useState } from 'react';
import { Text, View, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [status, setStatus] = useState('Initialisation...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const code = params.code as string | undefined;
    const token = params.token as string | undefined;
    const value = code || token;

    if (!value) {
      setStatus('❌ Aucun code/token reçu dans l’URL');
      return;
    }

    setStatus('➡️ Code/token reçu, tentative de connexion...');

    supabase.auth.exchangeCodeForSession(value).then(({ error }) => {
      if (error) {
        setStatus('❌ Erreur Supabase');
        setErrorMessage(error.message);
        return;
      }

      setStatus('✅ Connexion réussie, redirection...');
      router.replace('/(tabs)');
    });
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
