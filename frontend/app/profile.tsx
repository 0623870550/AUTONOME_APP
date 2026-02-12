import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, ScrollView, Pressable } from 'react-native';
import { supabase } from 'lib/supabase';
import { useRouter } from 'expo-router';

export default function Profile() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [agent, setAgent] = useState<any>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);

    // 1️⃣ Récupérer l'utilisateur connecté
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      Alert.alert('Erreur', 'Impossible de récupérer votre session.');
      router.replace('/login');
      return;
    }

    const userId = authData.user.id;

    // 2️⃣ Charger la ligne dans agents (RLS: auth.uid() = id)
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      Alert.alert('Erreur', error.message);
      return;
    }

    setAgent(data);
    setLoading(false);
  };

  // 🔐 Déconnexion
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      Alert.alert('Erreur', error.message);
      return;
    }

    router.replace('/login');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#F8FF00" />
        <Text style={{ color: '#fff', marginTop: 10 }}>Chargement du profil...</Text>
      </View>
    );
  }

  if (!agent) {
    return (
      <View style={styles.center}>
        <Text style={{ color: '#fff' }}>Aucune donnée trouvée.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Mon Profil</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Pseudo</Text>
        <Text style={styles.value}>{agent.pseudo}</Text>

        <Text style={styles.label}>Prénom</Text>
        <Text style={styles.value}>{agent.prenom}</Text>

        <Text style={styles.label}>Nom</Text>
        <Text style={styles.value}>{agent.nom}</Text>

        <Text style={styles.label}>Type d’agent</Text>
        <Text style={styles.value}>{agent.type_agent}</Text>

        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{agent.email}</Text>
      </View>

      {/* Bouton modifier */}
      <Text
        style={styles.editButton}
        onPress={() => router.push('/edit-profile')}
      >
        ✏️ Modifier mon profil
      </Text>

      {/* 🚪 Bouton déconnexion */}
      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 Se déconnecter</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  title: {
    color: '#F8FF00',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#111',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  label: {
    color: '#888',
    fontSize: 14,
    marginTop: 10,
  },
  value: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  editButton: {
    marginTop: 30,
    color: '#F8FF00',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },

  // 🔐 Styles du bouton déconnexion
  logoutButton: {
    marginTop: 25,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#222',
    borderWidth: 1,
    borderColor: '#F8FF00',
  },
  logoutText: {
    textAlign: 'center',
    color: '#F8FF00',
    fontWeight: '700',
    fontSize: 16,
  },
});
