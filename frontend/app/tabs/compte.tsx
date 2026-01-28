import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Pressable, StyleSheet, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import PageContainer from '../../components/PageContainer';
import AuthGate from '@/app/auth-gate';

// Dashboards (sans props)
import AgentDashboard from '../../dashboards/AgentDashboard';
import DelegueDashboard from '../../dashboards/DelegueDashboard';
import AdminDashboard from '../../dashboards/AdminDashboard';

// Supabase
import { supabase } from '@/lib/supabase';

export default function Compte() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user || null);
      setLoading(false);
    };

    loadUser();
  }, []);

  // Sélection photo (stockage local OK)
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setProfileImage(uri);
    }
  };

  // ÉCRAN DE CHARGEMENT
  if (loading) {
    return (
      <AuthGate>
        <PageContainer>
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#F8FF00" />
            <Text style={styles.loadingText}>Chargement du profil…</Text>
          </View>
        </PageContainer>
      </AuthGate>
    );
  }

  // PAS D’UTILISATEUR
  if (!user) {
    return (
      <AuthGate>
        <PageContainer>
          <Text style={styles.noUserText}>
            Aucun utilisateur connecté.
          </Text>
        </PageContainer>
      </AuthGate>
    );
  }

  // UTILISATEUR CONNECTÉ → PAGE PREMIUM
  return (
    <AuthGate>
      <PageContainer>

        {/* HEADER PREMIUM */}
        <View style={styles.header}>
          <Pressable onPress={pickImage}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarLetter}>
                  {user.email.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </Pressable>

          <View>
            <Text style={styles.userEmail}>{user.email}</Text>

            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>Agent SDMIS</Text>
            </View>
          </View>
        </View>

        {/* CARTE IDENTITÉ */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Identité syndicale</Text>

          <Text style={styles.cardLine}>📧 Email : {user.email}</Text>
          <Text style={styles.cardLine}>🆔 ID : {user.id}</Text>
        </View>

        {/* DASHBOARD SPÉCIFIQUE */}
        <View style={{ marginTop: 20 }}>
          <AgentDashboard />
        </View>

        {/* ACTIONS */}
        <View style={styles.actions}>
          <Pressable
            style={styles.actionButton}
            onPress={async () => {
              await supabase.auth.signOut();
            }}
          >
            <Text style={styles.actionText}>Se déconnecter</Text>
          </Pressable>
        </View>

      </PageContainer>
    </AuthGate>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    marginTop: 40,
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
  },
  noUserText: {
    color: '#fff',
    fontSize: 16,
  },

  // HEADER PREMIUM
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    gap: 16,
  },

  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F8FF00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
  },
  avatarImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#F8FF00',
  },

  userEmail: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  roleBadge: {
    marginTop: 4,
    backgroundColor: '#F8FF00',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  roleText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 12,
  },

  // CARTE IDENTITÉ
  card: {
    backgroundColor: '#111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    padding: 16,
  },
  cardTitle: {
    color: '#F8FF00',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  cardLine: {
    color: '#ccc',
    marginBottom: 6,
  },

  // ACTIONS
  actions: {
    marginTop: 30,
  },
  actionButton: {
    backgroundColor: '#222',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  actionText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
});
