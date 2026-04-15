import { Platform } from 'react-native';

/**
 * useNativeDriver n'est pas supporté sur web.
 * Utiliser cette constante dans toutes les animations Animated.
 */
export const USE_NATIVE_DRIVER = Platform.OS !== 'web';
