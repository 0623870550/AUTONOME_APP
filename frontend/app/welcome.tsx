import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import AuthGate from '@/app/auth-gate';

export default function Welcome() {
  const router = useRouter();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Animation d’apparition
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Après 1,5 seconde → redirection vers les onglets
    const timer = setTimeout(() => {
      router.replace('/(tabs)');
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AuthGate>
      <View style={styles.container}>
        <Animated.View style={{ opacity, transform: [{ translateY }] }}>
          <Text style={styles.title}>Bienvenue</Text>
          <Text style={styles.subtitle}>Agent du SDMIS</Text>
        </Animated.View>
      </View>
    </AuthGate>
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
    textAlign: 'center',
  },
  subtitle: {
    color: '#ccc',
    fontSize: 18,
    marginTop: 10,
    textAlign: 'center',
  },
});
