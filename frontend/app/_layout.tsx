import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// ⚠️ Tous les alias @/... remplacés par des chemins relatifs
import { AlertProvider } from './context/AlertContext';
import { useColorScheme } from './hooks/use-color-scheme';
import { SupabaseSessionProvider } from './context/SupabaseSessionProvider';
import { AgentRoleProvider } from './context/AgentRoleContext';

import AuthGate from './auth-gate';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SupabaseSessionProvider>
        <AgentRoleProvider>
          <AuthGate>
            <AlertProvider>
              <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <Stack screenOptions={{ headerShown: false }} />
                <StatusBar style="auto" />
              </ThemeProvider>
            </AlertProvider>
          </AuthGate>
        </AgentRoleProvider>
      </SupabaseSessionProvider>
    </GestureHandlerRootView>
  );
}
