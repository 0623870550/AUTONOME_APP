import { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase'; // Vérifie bien le chemin vers ta lib supabase

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // Cette fonction "écoute" ce que Supabase reçoit du lien magique ou du mail
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔔 Événement Auth détecté :", event);

      if (event === 'PASSWORD_RECOVERY') {
        // C'est l'événement déclenché par le mail "Reset Password"
        console.log("🚀 Direction : Page de nouveau mot de passe");
        router.replace('/reset-password');
      }
      else if (event === 'SIGNED_IN') {
        // Pour les connexions normales ou liens magiques
        router.replace('/(tabs)');
      }
      else if (event === 'INITIAL_SESSION' && !session) {
        // Si après 3 secondes rien ne se passe, on renvoie à la connexion
        const timer = setTimeout(() => {
          router.replace('/login');
        }, 3000);
        return () => clearTimeout(timer);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
      <ActivityIndicator size="large" color="#F8FF00" />
      <Text style={{ color: '#F8FF00', marginTop: 20, fontWeight: 'bold' }}>
        Authentification en cours...
      </Text>
    </View>
  );
}