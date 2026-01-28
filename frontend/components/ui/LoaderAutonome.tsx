import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

export default function LoaderAutonome() {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const textOpacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    // Animation du cercle (pulse)
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animation du texte (fade)
    Animated.loop(
      Animated.sequence([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(textOpacity, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.circle,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />

      <Animated.Text style={[styles.text, { opacity: textOpacity }]}>
        Chargement…
      </Animated.Text>
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
  circle: {
    width: 70,
    height: 70,
    borderRadius: 70,
    backgroundColor: '#F8FF00',
    shadowColor: '#F8FF00',
    shadowOpacity: 0.6,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 0 },
    marginBottom: 30,
  },
  text: {
    color: '#F8FF00',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
