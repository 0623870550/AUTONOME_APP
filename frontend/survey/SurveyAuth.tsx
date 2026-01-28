import AuthGate from '@/app/auth-gate';

export default function SurveyAuth() {
  return (
    <AuthGate>
      {/* Cet écran n'est plus utilisé car l'authentification est gérée par Supabase */}
    </AuthGate>
  );
}
