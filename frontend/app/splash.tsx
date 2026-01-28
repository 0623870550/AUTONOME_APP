import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>AUTONOME SDMIS</Text>
      <Text style={styles.subtitle}>Application Agents</Text>

      <ActivityIndicator size="large" color="#F8FF00" style={{ marginTop: 30 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#F8FF00',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 2,
  },
  subtitle: {
    color: '#ccc',
    fontSize: 16,
    marginTop: 10,
  },
});
