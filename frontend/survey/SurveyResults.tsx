import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import AuthGate from '@/app/auth-gate';

export default function SurveyResults() {
  return (
    <AuthGate>
      {/* contenu existant */}
    </AuthGate>
  );
}

interface SurveyOption {
  id: string;
  label: string;
}

interface Survey {
  id: string;
  question: string;
  description: string;
  options: SurveyOption[];
  anonymous: boolean;
}

export default function SurveyResults({ survey, user }: { survey: Survey; user: AuthenticatedUser }) {
  const [votes, setVotes] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const animatedWidths = survey.options.map(() => new Animated.Value(0));

  useEffect(() => {
    const loadVotes = async () => {
      const raw = await AsyncStorage.getItem('surveyVotes');
      const parsed = raw ? JSON.parse(raw) : {};
      setVotes(parsed[survey.id] || null);
      setLoading(false);
    };

    loadVotes();
  }, []);

  const totalVotes = 42;
  const results = survey.options.map((opt) => ({
    ...opt,
    votes: Math.floor(Math.random() * 20) + 1,
  }));

  useEffect(() => {
    if (!loading) {
      results.forEach((opt, index) => {
        const percent = Math.round((opt.votes / totalVotes) * 100);
        Animated.timing(animatedWidths[index], {
          toValue: percent,
          duration: 600,
          useNativeDriver: false,
        }).start();
      });
    }
  }, [loading]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Chargement des résultats…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Résultats du sondage</Text>
      <Text style={styles.question}>{survey.question}</Text>

      <View style={styles.resultsBlock}>
        {results.map((opt, index) => {
          const percent = Math.round((opt.votes / totalVotes) * 100);

          return (
            <View key={opt.id} style={styles.resultRow}>
              <Text style={styles.optionLabel}>{opt.label}</Text>

              <View style={styles.barContainer}>
                <Animated.View
                  style={[
                    styles.barFill,
                    {
                      width: animatedWidths[index].interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>

              <Text style={styles.percent}>{percent}%</Text>
            </View>
          );
        })}
      </View>

      {user.role !== 'agent' && !survey.anonymous && votes && typeof votes === 'object' && (
        <View style={styles.votersBlock}>
          <Text style={styles.votersTitle}>Votant</Text>

          <View style={styles.voterCard}>
            <Text style={styles.voterLine}>Email : {votes.email}</Text>
            <Text style={styles.voterLine}>Rôle : {votes.role}</Text>
            <Text style={styles.voterLine}>
              Date : {new Date(votes.votedAt).toLocaleString()}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#000', padding: 20 },
  loading: { color: '#fff', fontSize: 16 },
  title: { color: '#F8FF00', fontSize: 22, fontWeight: '700', marginBottom: 10 },
  question: { color: '#fff', marginBottom: 20 },
  resultsBlock: { marginBottom: 30 },
  resultRow: { marginBottom: 16 },
  optionLabel: { color: '#fff', marginBottom: 4 },
  barContainer: {
    height: 12,
    backgroundColor: '#222',
    borderRadius: 6,
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: '#F8FF00' },
  percent: { color: '#fff', marginTop: 4 },
  votersBlock: { marginTop: 20 },
  votersTitle: { color: '#F8FF00', fontSize: 18, fontWeight: '700', marginBottom: 10 },
  voterCard: {
    backgroundColor: '#111',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  voterLine: { color: '#fff', marginBottom: 4 },
});
