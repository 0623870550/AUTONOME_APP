import { View, Text, StyleSheet } from 'react-native';
import AuthGate from '@/app/auth-gate';

export default function DelegueDashboard() {
  return (
    <AuthGate>
      <View style={styles.container}>
        <Text style={styles.title}>Espace Délégué</Text>
        <Text style={styles.subtitle}>
          Outils et informations pour votre mission syndicale.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🚨 Alertes à traiter</Text>
          <Text style={styles.cardText}>
            Consultez les alertes des agents et répondez-y.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🗳️ Sondages</Text>
          <Text style={styles.cardText}>
            Accédez aux listes des votants et aux résultats détaillés.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📄 Documents internes</Text>
          <Text style={styles.cardText}>
            Accédez aux modèles, procédures et ressources internes.
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
