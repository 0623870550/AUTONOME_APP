import { Pressable, Text, StyleSheet, Platform } from 'react-native';

type BoutonAutonomeProps = {
  title: string;
  onPress: () => void;
};

export default function BoutonAutonome({ title, onPress }: BoutonAutonomeProps) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{
        color: 'rgba(0, 0, 0, 0.15)',
        borderless: false,
      }}
      style={({ pressed }) => [
        styles.button,
        pressed && Platform.OS === 'ios' && styles.buttonPressed,
      ]}
    >
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#F8FF00',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    overflow: 'hidden',
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
  text: {
    color: '#000',
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
  },
});
