import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { supabase } from '../../../lib/supabase';
import PageContainer from '../../../components/PageContainer';
import AuthGate from '../../_auth-gate';
import { useRouter } from 'expo-router';

export default function UserManagement() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (search.trim() === '') {
      setFilteredUsers(users);
    } else {
      const s = search.toLowerCase();
      const filtered = users.filter(
        (u) =>
          u.nom?.toLowerCase().includes(s) ||
          u.prenom?.toLowerCase().includes(s) ||
          u.email?.toLowerCase().includes(s)
      );
      setFilteredUsers(filtered);
    }
  }, [search, users]);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .order('nom', { ascending: true });

    if (!error) {
      setUsers(data || []);
      setFilteredUsers(data || []);
    }
    setLoading(false);
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    const { error } = await supabase
      .from('agents')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      Alert.alert('Erreur', error.message);
    } else {
      fetchUsers();
    }
  };

  const handleRoleChange = (user: any) => {
    Alert.alert(
      'Modifier le rôle',
      `Quel rôle souhaitez-vous attribuer à ${user.prenom} ${user.nom} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Agent', onPress: () => updateUserRole(user.id, 'agent') },
        { text: 'Délégué', onPress: () => updateUserRole(user.id, 'delegue') },
        { text: 'Administrateur', onPress: () => updateUserRole(user.id, 'admin') },
      ]
    );
  };

  return (
    <AuthGate>
      <PageContainer>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={{ color: '#F8FF00' }}>← Retour</Text>
          </Pressable>
          <Text style={styles.title}>Gestion des Utilisateurs</Text>
        </View>

        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un agent (nom, email...)"
          placeholderTextColor="#666"
          value={search}
          onChangeText={setSearch}
        />

        {loading ? (
          <ActivityIndicator size="large" color="#F8FF00" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.userCard}>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>
                    {item.nom} {item.prenom}
                  </Text>
                  <Text style={styles.userSub}>
                    {item.role_agent || 'SDMIS'} • {item.email || 'Pas d\'email'}
                  </Text>
                </View>
                <Pressable
                  style={[
                    styles.roleBadge,
                    item.role === 'admin' ? styles.adminBadge : item.role === 'delegue' ? styles.delegueBadge : styles.agentBadge
                  ]}
                  onPress={() => handleRoleChange(item)}
                >
                  <Text style={styles.roleText}>
                    {item.role === 'admin' ? 'ADN' : item.role === 'delegue' ? 'DEL' : 'AGE'}
                  </Text>
                </Pressable>
              </View>
            )}
            ListEmptyComponent={
              <Text style={{ color: '#aaa', textAlign: 'center', marginTop: 30 }}>
                Aucun utilisateur trouvé.
              </Text>
            }
          />
        )}
      </PageContainer>
    </AuthGate>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 20 },
  backButton: { marginBottom: 10 },
  title: { color: '#F8FF00', fontSize: 24, fontWeight: 'bold' },
  searchInput: {
    backgroundColor: '#111',
    color: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
    fontSize: 15,
  },
  userCard: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  userInfo: { flex: 1 },
  userName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  userSub: { color: '#888', fontSize: 13, marginTop: 4 },
  roleBadge: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentBadge: { backgroundColor: '#333' },
  delegueBadge: { backgroundColor: '#007AFF' },
  adminBadge: { backgroundColor: '#F8FF00' },
  roleText: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#fff',
  },
});
