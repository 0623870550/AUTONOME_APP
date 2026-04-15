import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { supabase } from '../../../lib/supabase';
import PageContainer from '../../../components/PageContainer';
import AuthGate from '../../_auth-gate';
import { useRouter } from 'expo-router';

export default function AdminStatistiques() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    totalAgents: 0,
    sppCount: 0,
    patsCount: 0,
    activePolls: 0,
    totalVotes: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);

    // 1. Total Agents & Categories
    const { data: agents, error: e1 } = await supabase.from('agents').select('role_agent');
    
    // 2. Active Polls
    const { count: activePolls, error: e2 } = await supabase
      .from('sondages')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('is_archived', false);

    // 3. Total Votes
    const { count: totalVotes, error: e3 } = await supabase
      .from('sondage_votes')
      .select('*', { count: 'exact', head: true });

    if (!e1 && agents) {
      const spp = agents.filter(a => a.role_agent === 'SPP').length;
      const pats = agents.filter(a => a.role_agent === 'PATS').length;
      setStats({
        totalAgents: agents.length,
        sppCount: spp,
        patsCount: pats,
        activePolls: activePolls || 0,
        totalVotes: totalVotes || 0,
      });
    }

    setLoading(false);
  };

  const StatCard = ({ title, value, color }: { title: string, value: string | number, color: string }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );

  return (
    <AuthGate>
      <PageContainer>
        <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Text style={{ color: '#F8FF00' }}>← Retour</Text>
            </Pressable>
            <Text style={styles.title}>Statistiques Globales</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#F8FF00" style={{ marginTop: 50 }} />
          ) : (
            <View style={styles.grid}>
              <StatCard title="Agents Inscrits" value={stats.totalAgents} color="#F8FF00" />
              <StatCard title="Participation (Votes)" value={stats.totalVotes} color="#34C759" />
              <StatCard title="Sondages en cours" value={stats.activePolls} color="#007AFF" />
              
              <View style={styles.row}>
                <View style={[styles.miniCard, { flex: 1 }]}>
                  <Text style={styles.miniLabel}>🚒 SPP</Text>
                  <Text style={styles.miniValue}>{stats.sppCount}</Text>
                </View>
                <View style={[styles.miniCard, { flex: 1 }]}>
                  <Text style={styles.miniLabel}>🏢 PATS</Text>
                  <Text style={styles.miniValue}>{stats.patsCount}</Text>
                </View>
              </View>

              <View style={styles.chartMockup}>
                 <Text style={styles.chartTitle}>Répartition des effectifs</Text>
                 <View style={styles.barContainer}>
                    <View style={[styles.barSpp, { flex: stats.sppCount || 1 }]} />
                    <View style={[styles.barPats, { flex: stats.patsCount || 1 }]} />
                 </View>
                 <View style={styles.legend}>
                    <Text style={{ color: '#F8FF00', fontSize: 12 }}>● SPP</Text>
                    <Text style={{ color: '#8E8E93', fontSize: 12 }}>● PATS</Text>
                 </View>
              </View>
            </View>
          )}

          <Pressable style={styles.refreshBtn} onPress={fetchStats}>
            <Text style={styles.refreshBtnText}>Mettre à jour les données</Text>
          </Pressable>
        </ScrollView>
      </PageContainer>
    </AuthGate>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 25 },
  backButton: { marginBottom: 10 },
  title: { color: '#F8FF00', fontSize: 24, fontWeight: 'bold' },
  grid: { gap: 16 },
  statCard: {
    backgroundColor: '#111',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#333',
  },
  statTitle: { color: '#888', fontSize: 14, fontWeight: 'bold', marginBottom: 5 },
  statValue: { fontSize: 32, fontWeight: '900' },
  row: { flexDirection: 'row', gap: 16 },
  miniCard: {
    backgroundColor: '#111',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  miniLabel: { color: '#aaa', fontSize: 12, marginBottom: 5 },
  miniValue: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  chartMockup: {
    backgroundColor: '#111',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    marginTop: 10,
  },
  chartTitle: { color: '#fff', fontSize: 15, fontWeight: 'bold', marginBottom: 15 },
  barContainer: { height: 12, flexDirection: 'row', borderRadius: 6, overflow: 'hidden' },
  barSpp: { backgroundColor: '#F8FF00' },
  barPats: { backgroundColor: '#333' },
  legend: { flexDirection: 'row', gap: 20, marginTop: 10, justifyContent: 'center' },
  refreshBtn: {
    backgroundColor: '#222',
    padding: 16,
    borderRadius: 12,
    marginTop: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  refreshBtnText: { color: '#F8FF00', fontWeight: 'bold' },
});
