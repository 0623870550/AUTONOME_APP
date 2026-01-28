import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AuthGate from '@/app/auth-gate';

export default function SurveyVote() {
  return (
    <AuthGate>
      {/* Ton contenu existant */}
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

interface SurveyVoteProps {
  survey: Survey;
  user: AuthenticatedUser;
  onVoted?: () => void;
}

export default function SurveyVote({ survey, user, onVoted }: SurveyVoteProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVote = async () => {
    if (!selected) {
      setError('Veuillez sélectionner une option.');
      return;
    }

    const votesRaw = await AsyncStorage.getItem('surveyVotes');
    const votes = votesRaw ? JSON.parse(votesRaw) : {};

    const isDelegateOrAdmin = user.role === 'delegue' || user.role === 'admin';

    if (survey.anonymous || !isDelegateOrAdmin) {
      votes[survey.id] = true;
    } else {
      votes[survey.id] = {
        userId: user.id,
        email: user.email,
        role: user.role,
        votedAt: new Date().toISOString(),
        choice: selected,
      };
    }

    await AsyncStorage.setItem('surveyVotes', JSON.stringify(votes));

    Alert.alert(
      'Merci pour votre participation',
      'Votre vote a bien été enregistré.',
      [
        {
          text: 'Voir les résultats',
          onPress: () => onVoted && onVoted(),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{survey.question}</Text>
      <Text style={styles.description}>{survey.description}</Text>

      <View style={styles.options}>
        {survey.options.map((opt) => (
          <TouchableOpacity
            key={opt.id}
            style={[styles.option, selected === opt.id && styles.optionSelected]}
            onPress={() => setSelected(opt.id)}
          >
            <Text
              style={[
                styles.optionText,
                selected === opt.id && styles.optionTextSelected,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity style={styles.cta} onPress={handleVote}>
        <Text style={styles.ctaText}>Valider mon vote</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#000', padding: 20 },
  title: { color: '#F8FF00', fontSize: 22, fontWeight: '700', marginBottom: 10 },
  description: { color: '#fff', marginBottom: 20 },
  options: { gap: 12, marginBottom: 20 },
  option: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#111',
  },
  optionSelected: { backgroundColor: '#F8FF00', borderColor: '#F8FF00' },
  optionText: { color: '#fff' },
  optionTextSelected: { color: '#000', fontWeight: '700' },
  error: { color: '#ff5c5c', marginBottom: 10 },
  cta: {
    backgroundColor: '#F8FF00',
    padding: 14,
    borderRadius: 10,
  },
  ctaText: { color: '#000', fontWeight: '700', textAlign: 'center' },
});
