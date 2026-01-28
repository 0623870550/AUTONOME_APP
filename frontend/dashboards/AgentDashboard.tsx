import { View, Text, StyleSheet } from 'react-native';
import AuthGate from '@/app/auth-gate';

export default function AgentDashboard() {
  return (
    <AuthGate>
      <View style={styles.container}>
        <Text style={styles.title}>Espace Agent</Text>
        <Text style={styles.subtitle}>
          Bienvenue dans votre espace personnel.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🗳️ Sondages</Text>
          <Text style={styles.cardText}>
            Consultez les sondages en cours et vos participations.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🚨 Alertes</Text>
          <Text style={styles.cardText}>
            Retrouvez vos alertes envoyées et leur statut.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📢 Actualités</Text>
          <Text style={styles.cardText}>
            Suivez les dernières informations du SDMIS.
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
