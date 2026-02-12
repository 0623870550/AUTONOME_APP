import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from 'lib/supabase';
import { useSession } from 'context/SupabaseSessionProvider';
import { useRouter } from 'expo-router';

export default function DashboardAgent() {
  const session = useSession();
  const router = useRouter();

  const [agent, setAgent] = useState<any>(null);

  useEffect(() => {
    if (!session?.user) return;

    const fetchAgent = async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('email', session.user.email)
        .single();

      if (!error) setAgent(data);
    };

    fetchAgent();
  }, [session]);

  // ÉTAT : Chargement
  if (!agent) {
    return (
      <SafeAreaView style={styles.container}>
        <Image
          source={require('@/assets/images/logo_autonome_sdmis.png')}
          style={styles.logo}
        />
        <Text style={{ color: '#fff', marginTop: 20 }}>Chargement...</Text>
      </SafeAreaView>
    );
  }

  // ÉTAT : Dashboard agent
  return (
    <SafeAreaView style={styles.container}>

      {/* LOGO AUTONOME */}
      <Image
        source={require('@/assets/images/logo_autonome_sdmis.png')}
        style={styles.logo}
      />

      {/* CARTE AGENT */}
      <View style={styles.card}>
        <Image
          source={{ uri: agent.avatar_url || 'https://via.placeholder.com/100' }}
          style={styles.avatar}
        />

        <Text style={styles.prenom}>Bonjour {agent.prenom} 👋</Text>
        <Text style={styles.nom}>{agent.nom.toUpperCase()}</Text>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>{agent.type_agent}</Text>
        </View>

        <Pressable style={styles.profileButton} onPress={() => router.push('/profile')}>
          <Text style={styles.profileButtonText}>Voir mon profil</Text>
        </Pressable>
      </View>

      {/* ACCÈS RAPIDE */}
      <View style={styles.quickAccess}>
        <Pressable style={styles.tile} onPress={() => router.push('/alerte')}>
          <Text style={styles.tileText}>📢 Alerte</Text>
        </Pressable>

        <Pressable style={styles.tile} onPress={() => router.push('/sondages')}>
          <Text style={styles.tileText}>📊 Sondages</Text>
        </Pressable>

        <Pressable style={styles.tile} onPress={() => router.push('/documents')}>
          <Text style={styles.tileText}>📁 Documents</Text>
        </Pressable>

        <Pressable style={styles.tile} onPress={() => router.push('/contact')}>
          <Text style={styles.tileText}>📞 Contact</Text>
        </Pressable>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  logo: {
    width: 140,
    height: 140,
    marginTop: 10,
    marginBottom: 10,
    resizeMode: 'contain',
  },

  card: {
    width: '100%',
    backgroundColor: '#111',
    padding: 25,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#F8FF00',
    marginBottom: 15,
  },

  prenom: {
    color: '#F8FF00',
    fontSize: 22,
    fontWeight: '700',
  },

  nom: {
    color: '#fff',
    fontSize: 18,
    marginTop: 4,
  },

  badge: {
    marginTop: 10,
    backgroundColor: '#F8FF00',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 6,
  },

  badgeText: {
    fontWeight: '700',
    color: '#000',
  },

  profileButton: {
    marginTop: 20,
    backgroundColor: '#F8FF00',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },

  profileButtonText: {
    color: '#000',
    fontWeight: '700',
  },

  quickAccess: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  tile: {
    width: '48%',
    backgroundColor: '#111',
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 15,
  },

  tileText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
