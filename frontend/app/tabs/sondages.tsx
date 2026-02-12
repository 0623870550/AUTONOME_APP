import { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import PageContainer from '../../components/PageContainer';
import AuthGate from 'app/auth-gate';

export default function Sondages() {
  const [activeSurvey, setActiveSurvey] = useState<any>(null);

  useEffect(() => {
    // Sondage statique pour l’instant (sera remplacé par Supabase)
    const survey = {
      id: '2025-conditions-travail',
      question: 'Comment évalues-tu tes conditions de travail actuelles ?',
      description:
        'Ce sondage nous aide à orienter nos actions syndicales pour les SPP et les PATS.',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
    };

    setActiveSurvey(survey);
  }, []);

  if (!activeSurvey) {
    return (
      <AuthGate>
        <PageContainer>
          <Text style={{ color: '#fff' }}>Chargement…</Text>
        </PageContainer>
      </AuthGate>
    );
  }

  return (
    <AuthGate>
      <PageContainer>
        <Text style={{ color: '#F8FF00', fontSize: 26, fontWeight: '700', marginBottom: 6 }}>
          Sondages & Consultation
        </Text>

        <Text style={{ color: '#ccc', fontSize: 15, marginBottom: 20 }}>
          Exprime-toi. Le Syndicat AUTONOME SDMIS construit ses actions avec toi.
        </Text>

        <View
          style={{
            backgroundColor: '#111',
            borderRadius: 10,
            borderWidth: 1,
            borderColor: '#333',
            padding: 16,
            marginBottom: 24,
          }}
        >
          <Text style={{ color: '#F8FF00', fontSize: 20, fontWeight: '700', marginBottom: 8 }}>
            🗳️ {activeSurvey.question}
          </Text>

          <Text style={{ color: '#aaa', marginBottom: 12 }}>
            {activeSurvey.description}
          </Text>

          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: '#F8FF00',
              padding: 14,
              borderRadius: 10,
              marginBottom: 10,
            }}
          >
            <Text style={{ color: '#000', fontWeight: '700', textAlign: 'center' }}>
              Participer au sondage
            </Text>
          </Pressable>

          <Text style={{ color: '#666', fontSize: 12 }}>
            📅 Du {activeSurvey.startDate} au {activeSurvey.endDate}
          </Text>
        </View>

        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: '#222',
            padding: 14,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: '#333',
          }}
        >
          <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>
            📚 Voir les sondages précédents
          </Text>
        </Pressable>

        <View style={{ height: 80 }} />
      </PageContainer>
    </AuthGate>
  );
}
