import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import PageContainer from '../../components/PageContainer';
import AuthGate from '../_auth-gate';
import { supabase } from '../../lib/supabase';
import { useAgentRole } from '../../context/AgentRoleContext';
import { useSession } from '../../context/SupabaseSessionProvider';
import { useRouter } from 'expo-router';

export default function DeleguesScreen() {
  const { roleAgent } = useAgentRole();
  const { session } = useSession();
  const router = useRouter();
  const [delegues, setDelegues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [myProfile, setMyProfile] = useState<any>(null);

  useEffect(() => {
    if (roleAgent) {
      loadDelegues();
    }
  }, [roleAgent]);

  const loadDelegues = async () => {
    setLoading(true);
    // On récupère les admins et délégués filtrés par rôle_agent
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .in('role', ['admin', 'delegue'])
      .eq('role_agent', roleAgent)
      .order('nom', { ascending: true });

    if (!error) {
      const all = data || [];
      // On sépare le profil de l'utilisateur actuel s'il est dans la liste
      const me = all.find(d => d.id === session?.user.id);
      const others = all.filter(d => d.id !== session?.user.id);
      
      setMyProfile(me);
      setDelegues(others);
    }
    setLoading(false);
  };

  const handleCall = (phone: string) => {
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email: string) => {
    if (email) Linking.openURL(`mailto:${email}`);
  };

  if (loading) {
    return (
      <PageContainer>
        <ActivityIndicator size="large" color="#F8FF00" style={{ marginTop: 50 }} />
      </PageContainer>
    );
  }

  return (
    <AuthGate>
      <PageContainer>
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <Text style={styles.title}>Vos Délégués</Text>
          <Pressable 
            onPress={() => router.push('/')}
            style={{ backgroundColor: '#222', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#333' }}
          >
            <Text style={{ color: '#aaa', fontSize: 12, fontWeight: 'bold' }}>✕ Quitter</Text>
          </Pressable>
        </View>
          <Text style={styles.subtitle}>
            {myProfile?.role === 'admin' 
              ? '🛡️ Tous les agents' 
              : (roleAgent === 'SPP' 
                ? '🚒 Vos représentants Sapeurs-Pompiers' 
                : '🏢 Vos représentants PATS')}
          </Text>

          {/* VOTRE PROFIL (SI EXISTANT) */}
          {myProfile && (
            <View style={[styles.card, { borderColor: '#F8FF00', borderWidth: 2, marginBottom: 25, backgroundColor: 'rgba(248, 255, 0, 0.05)' }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 }}>
                <Text style={{ color: '#F8FF00', fontWeight: '900', fontSize: 13, letterSpacing: 1 }}>VOTRE PROFIL RÉFÉRENT</Text>
                <Pressable 
                  onPress={() => router.push('/compte')}
                  style={{ backgroundColor: '#F8FF00', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}
                >
                  <Text style={{ color: '#000', fontSize: 11, fontWeight: 'bold' }}>Modifier</Text>
                </Pressable>
              </View>

              <View style={styles.cardTop}>
                <View style={[styles.avatarContainer, { backgroundColor: '#F8FF00' }]}>
                  <Text style={[styles.avatarText, { color: '#000' }]}>{myProfile.prenom[0]}{myProfile.nom[0]}</Text>
                </View>
                <View style={styles.info}>
                  <Text style={styles.name}>{myProfile.prenom} {myProfile.nom}</Text>
                  <Text style={[styles.specialite, { color: '#F8FF00' }]}>🛡️ {myProfile.role === 'admin' ? 'Administrateur' : 'Délégué'}</Text>
                </View>
              </View>
            </View>
          )}

          {delegues.length > 0 && (
             <Text style={[styles.subtitle, { marginBottom: 15, fontWeight: 'bold', color: '#fff' }]}>Vos Collègues Représentants</Text>
          )}

          <View style={styles.list}>
            {delegues.map((d) => (
              <View key={d.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>{d.prenom[0]}{d.nom[0]}</Text>
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.name}>{d.prenom} {d.nom}</Text>
                    <Text style={styles.specialite}>{d.specialite || 'Délégué Syndical'}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.cardActions}>
                  <Pressable style={styles.actionBtn} onPress={() => handleCall(d.telephone)}>
                    <Text style={styles.actionIcon}>📞</Text>
                    <Text style={styles.actionText}>Appeler</Text>
                  </Pressable>
                  <View style={styles.verticalDivider} />
                  <Pressable style={styles.actionBtn} onPress={() => handleEmail(d.email)}>
                    <Text style={styles.actionIcon}>✉️</Text>
                    <Text style={styles.actionText}>E-mail</Text>
                  </Pressable>
                </View>
              </View>
            ))}

            {delegues.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>🛡️</Text>
                <Text style={styles.emptyText}>
                  Aucun délégué répertorié pour cette catégorie pour le moment.
                </Text>
              </View>
            )}
          </View>

        </ScrollView>
      </PageContainer>
    </AuthGate>
  );
}

const styles = StyleSheet.create({
  title: { color: '#F8FF00', fontSize: 26, fontWeight: '700', marginBottom: 6 },
  subtitle: { color: '#ccc', fontSize: 15, marginBottom: 25 },
  list: { gap: 16 },
  card: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F8FF00',
  },
  avatarText: { color: '#F8FF00', fontSize: 18, fontWeight: 'bold' },
  info: { marginLeft: 15, flex: 1 },
  name: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  specialite: { color: '#888', fontSize: 14, marginTop: 4 },
  divider: { height: 1, backgroundColor: '#222', marginBottom: 15 },
  cardActions: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionIcon: { fontSize: 18 },
  actionText: { color: '#F8FF00', fontWeight: 'bold', fontSize: 14 },
  verticalDivider: { width: 1, height: 20, backgroundColor: '#222' },
  emptyContainer: { alignItems: 'center', marginTop: 50, padding: 20 },
  emptyEmoji: { fontSize: 50, marginBottom: 15 },
  emptyText: { color: '#666', textAlign: 'center', fontSize: 15, lineHeight: 22 },
});

