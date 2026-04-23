import { StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import AuthGate from "../../_auth-gate";
import PageContainer from '../../../components/PageContainer';

export default function AdminPage() {
  const router = useRouter();

  return (
    <AuthGate>
      <PageContainer>
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <Text style={styles.title}>🛡️ Espace Admin</Text>
            <Pressable 
              onPress={() => router.push('/')}
              style={styles.exitBtn}
            >
              <Text style={styles.exitBtnText}>✕ Quitter</Text>
            </Pressable>
          </View>

          <Text style={styles.subtitle}>
            Gestion complète de l’application syndicale.
          </Text>

          {/* SECTION GESTION */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gérer le contenu</Text>
            
            <Pressable style={styles.card} onPress={() => router.push('/admin/sondages')}>
              <View style={styles.cardContent}>
                <Text style={styles.cardEmoji}>🗳️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Sondages</Text>
                  <Text style={styles.cardText}>Créez, activez et analysez les sondages.</Text>
                </View>
              </View>
            </Pressable>

            <Pressable style={styles.card} onPress={() => router.push('/admin/actualites')}>
              <View style={styles.cardContent}>
                <Text style={styles.cardEmoji}>📢</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Actualités</Text>
                  <Text style={styles.cardText}>Publiez et gérez les actualités syndicales.</Text>
                </View>
              </View>
            </Pressable>

            <Pressable style={styles.card} onPress={() => router.push('/toutes-alertes')}>
              <View style={styles.cardContent}>
                <Text style={styles.cardEmoji}>🚨</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Toutes les alertes</Text>
                  <Text style={styles.cardText}>Consultez et traitez les alertes reçues.</Text>
                </View>
              </View>
            </Pressable>

            <Pressable style={styles.card} onPress={() => router.push('/admin/moderation')}>
              <View style={styles.cardContent}>
                <Text style={styles.cardEmoji}>⚖️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Modérer les propositions</Text>
                  <Text style={styles.cardText}>Validez ou rejetez les idées des agents.</Text>
                </View>
              </View>
            </Pressable>
          </View>

          {/* SECTION ORGANISATION */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Organisation</Text>

            <Pressable style={styles.card} onPress={() => router.push('/admin/utilisateurs')}>
              <View style={styles.cardContent}>
                <Text style={styles.cardEmoji}>👥</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Utilisateurs & Délégués</Text>
                  <Text style={styles.cardText}>Gérez les membres et les droits d'accès.</Text>
                </View>
              </View>
            </Pressable>

            <Pressable style={styles.card} onPress={() => router.push('/admin/statistiques')}>
              <View style={styles.cardContent}>
                <Text style={styles.cardEmoji}>📊</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Statistiques</Text>
                  <Text style={styles.cardText}>Suivez l’activité et les indicateurs clés.</Text>
                </View>
              </View>
            </Pressable>
          </View>

        </ScrollView>
      </PageContainer>
    </AuthGate>
  );
}

const styles = StyleSheet.create({
  title: {
    color: '#F8FF00',
    fontSize: 26,
    fontWeight: '700',
  },
  subtitle: {
    color: '#ccc',
    fontSize: 15,
    marginBottom: 25,
  },
  exitBtn: {
    backgroundColor: '#222',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333'
  },
  exitBtnText: {
    color: '#aaa',
    fontSize: 12,
    fontWeight: 'bold'
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 15,
    opacity: 0.6
  },
  card: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 12,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardEmoji: {
    fontSize: 24,
    marginRight: 15,
  },
  cardTitle: {
    color: '#F8FF00',
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardText: {
    color: '#aaa',
    fontSize: 13,
    lineHeight: 18,
  },
});
