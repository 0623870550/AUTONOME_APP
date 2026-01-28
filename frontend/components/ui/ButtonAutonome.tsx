import { Pressable, Text, StyleSheet, Animated } from 'react-native';
import { useRef } from 'react';

export default function ButtonAutonome({ title, onPress, disabled }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const animate = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
  };

  const handlePress = () => {
    animate();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        style={[styles.button, disabled && { opacity: 0.5 }]}
        onPress={handlePress}
        disabled={disabled}
      >
        <Text style={styles.text}>{title}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#F8FF00',
    padding: 16,
    borderRadius: 10,
    shadowColor: '#F8FF00',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  text: {
    color: '#000',
    fontWeight: '800',
    textAlign: 'center',
    fontSize: 17,
    letterSpacing: 0.5,
  },
});
