import { View, Text, StyleSheet } from 'react-native';

export default function HeaderAuth({ title }) {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>AUTONOME SDMIS</Text>
      <View style={styles.line} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>Accès réservé aux agents SDMIS</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 40,
    alignItems: 'center',
  },
  logo: {
    color: '#F8FF00',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 10,
  },
  line: {
    width: 80,
    height: 3,
    backgroundColor: '#F8FF00',
    marginBottom: 20,
    borderRadius: 2,
  },
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    color: '#aaa',
    fontSize: 14,
  },
});
