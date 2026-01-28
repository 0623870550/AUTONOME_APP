import { View, Text, StyleSheet } from 'react-native';
import AuthGate from '@/app/auth-gate';

export default function AdminDashboard() {
  return (
    <AuthGate>
      <View style={styles.container}>
        <Text style={styles.title}>Espace Admin</Text>
        <Text style={styles.subtitle}>
          Gestion complète de l’application syndicale.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🗳️ Gestion des sondages</Text>
          <Text style={styles.cardText}>
            Créez, activez et analysez les sondages.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📢 Actualités</Text>
          <Text style={styles.cardText}>
            Publiez et gérez les actualités syndicales.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>👥 Gestion des délégués</Text>
          <Text style={styles.cardText}>
            Ajoutez, modifiez ou supprimez des délégués.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📊 Statistiques</Text>
          <Text style={styles.cardText}>
            Suivez l’activité globale de l’application.
          </Text>
        </View>
      </View>
    </AuthGate>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    color: '#F8FF00',
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    color: '#ccc',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#111',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    color: '#F8FF00',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardText: {
    color: '#aaa',
    fontSize: 14,
  },
});
