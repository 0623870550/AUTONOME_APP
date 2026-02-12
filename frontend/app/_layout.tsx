import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { AgentRoleProvider } from 'app/context/AgentRoleContext';
import { AlertProvider } from 'app/context/AlertContext';
import { SupabaseSessionProvider } from 'app/context/SupabaseSessionProvider';

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useColorScheme } from 'hooks/use-color-scheme';

import AuthGate from 'app/auth-gate';

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
