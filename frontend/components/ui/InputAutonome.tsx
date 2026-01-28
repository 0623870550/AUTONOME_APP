import { View, TextInput, StyleSheet } from 'react-native';

export default function InputAutonome({
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  style,
}) {
  return (
    <View style={[styles.container, style]}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#777"
        autoCapitalize="none"
        secureTextEntry={secureTextEntry}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#111',
    borderColor: '#333',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
  },
});
