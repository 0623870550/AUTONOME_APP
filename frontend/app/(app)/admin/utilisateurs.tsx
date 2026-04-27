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
  Modal,
  Platform,
  RefreshControl,
} from 'react-native';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AuthGate from '../../_auth-gate';

export default function UserManagement() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

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
    if (!refreshing) setLoading(true);
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .order('nom', { ascending: true });

    if (!error) {
      setUsers(data || []);
      setFilteredUsers(data || []);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    const { error } = await supabase
      .from('agents')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      Alert.alert('Erreur', error.message);
    } else {
      setModalVisible(false);
      fetchUsers();
    }
  };

  const openRoleModal = (user: any) => {
    setSelectedUser(user);
    setModalVisible(true);
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={{ color: '#F8FF00', fontSize: 16 }}>← Retour</Text>
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
    </View>
  );

  return (
    <AuthGate>
      <SafeAreaView style={styles.container}>
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F8FF00" />
          }
          renderItem={({ item }) => (
            <View style={styles.userCard}>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.nom} {item.prenom}</Text>
                <Text style={styles.userSub}>
                  {item.role_agent || 'SDMIS'} • {item.email || 'Pas d\'email'}
                </Text>
              </View>
              <Pressable
                style={[
                  styles.roleBadge,
                  item.role === 'admin' ? styles.adminBadge : item.role === 'delegue' ? styles.delegueBadge : styles.agentBadge,
                  Platform.OS === 'web' && { cursor: 'pointer' } as any
                ]}
                onPress={() => openRoleModal(item)}
              >
                <Text style={styles.roleText}>
                  {item.role === 'admin' ? 'ADN' : item.role === 'delegue' ? 'DEL' : 'AGE'}
                </Text>
              </Pressable>
            </View>
          )}
          ListEmptyComponent={
            !loading ? (
              <Text style={styles.emptyText}>Aucun utilisateur trouvé.</Text>
            ) : null
          }
          ListFooterComponent={loading && !refreshing ? <ActivityIndicator size="large" color="#F8FF00" style={{ marginTop: 20 }} /> : null}
        />

        <Modal visible={modalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Modifier le rôle</Text>
              <Text style={styles.modalSub}>Attribuer un rôle à {selectedUser?.prenom} {selectedUser?.nom}</Text>
              {['agent', 'delegue', 'admin'].map((role) => (
                <Pressable key={role} style={styles.modalOption} onPress={() => updateUserRole(selectedUser.id, role)}>
                  <Text style={[styles.modalOptionText, selectedUser?.role === role && { color: '#F8FF00' }]}>
                    {role.charAt(0).toUpperCase() + role.slice(1)} {selectedUser?.role === role ? '✓' : ''}
                  </Text>
                </Pressable>
              ))}
              <Pressable style={styles.closeButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButtonText}>Annuler</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </AuthGate>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  headerContainer: { paddingHorizontal: 16, paddingTop: 10 },
  listContent: { paddingBottom: 40 },
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
  },
  userCard: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  userInfo: { flex: 1 },
  userName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  userSub: { color: '#888', fontSize: 13, marginTop: 4 },
  roleBadge: { width: 45, height: 45, borderRadius: 22.5, alignItems: 'center', justifyContent: 'center' },
  agentBadge: { backgroundColor: '#333' },
  delegueBadge: { backgroundColor: '#007AFF' },
  adminBadge: { backgroundColor: '#F8FF00' },
  roleText: { fontWeight: 'bold', fontSize: 12, color: '#000' },
  emptyText: { color: '#aaa', textAlign: 'center', marginTop: 30 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#111', borderRadius: 20, padding: 25, width: '100%', maxWidth: 400, borderWidth: 1, borderColor: '#333' },
  modalTitle: { color: '#F8FF00', fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  modalSub: { color: '#aaa', fontSize: 14, marginBottom: 20 },
  modalOption: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#222' },
  modalOptionText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  closeButton: { marginTop: 20, alignItems: 'center' },
  closeButtonText: { color: '#FF4444', fontSize: 16, fontWeight: 'bold' },
});
