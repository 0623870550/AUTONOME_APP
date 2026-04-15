import { useEffect, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';

import { USE_NATIVE_DRIVER } from '../../lib/platform';

export default function Index() {
  const [opacity] = useState(new Animated.Value(0));

  // Animation d'apparition
  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.ease),
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity, alignItems: 'center' }}>
        <Image
          source={require('../assets/logo_autonome_sdmis.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>Bienvenue 👋</Text>
        <Text style={styles.subtitle}>Chargement de votre espace…</Text>

        <View style={styles.loader} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },

  logo: {
    width: 140,
    height: 140,
    marginBottom: 20,
  },

  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '600',
    marginTop: 10,
  },

  subtitle: {
    color: '#aaa',
    fontSize: 16,
    marginTop: 10,
  },

  loader: {
    marginTop: 30,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#fff',
    borderTopColor: 'transparent',
    opacity: 0.7,
  },
});
