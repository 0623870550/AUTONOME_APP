import { StyleProp, StyleSheet, TextInput, View, ViewStyle, TextInputProps } from 'react-native';

// L'astuce est le "& TextInputProps" : 
// On dit "Prends mon style de View, ET accepte TOUTES les options d'un TextInput classique"
type InputAutonomeProps = {
  style?: StyleProp<ViewStyle>;
} & TextInputProps;

export default function InputAutonome({
  style,
  ...props // "...props" capture tout (value, onChangeText, multiline, keyboardType...)
}: InputAutonomeProps) {
  return (
    <View style={[styles.container, style]}>
      <TextInput
        style={styles.input}
        placeholderTextColor="#777"
        autoCapitalize="none" // Valeur par défaut
        {...props} // On déverse toutes les options capturées directement dans le champ !
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