import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="sondages" />
      <Stack.Screen name="actualites" />
      <Stack.Screen name="statistiques" />
      <Stack.Screen name="utilisateurs" />
      <Stack.Screen name="moderation" />
    </Stack>
  );
}
