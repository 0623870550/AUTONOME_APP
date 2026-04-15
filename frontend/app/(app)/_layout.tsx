import { Stack } from 'expo-router';
import { useSession } from '../../context/SupabaseSessionProvider';

export default function AppLayout() {
  const { session } = useSession();

  if (session === undefined) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
