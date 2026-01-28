import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

import AuthGate from '@/app/auth-gate';
import PageContainer from '../../components/PageContainer';
import { supabase } from '@/lib/supabase';

type AlerteRow = {
  id: string;
  type: string | null;
  lieu: string | null;
  description: string | null;
  gravite: string | null;
  statut: string | null;
  attachments: any | null;
  events: any | null;
  comment_inte: string | null;
  inserted_at: string | null;
  anonyme: boolean | null;
  created_by: string | null;
};

export default function DelegueScreen() {
  const [alertes, setAlertes] = useState<AlerteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAlertes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('alerte')
      .select('*')
      .order('inserted_at', { ascending: false });

    if (error) {
      console.log('Erreur chargement alertes :', error);
      setAlertes([]);
    } else {
      setAlertes(data as AlerteRow[]);
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAlertes();
    setRefreshing(false);
  };

  useEffect(() => {
    loadAlertes();
  }, []);

  const labelStatut = (statut: string | null) => {
    if (!statut) return 'Non défini';
    if (statut === 'en_cours') return 'En cours';
    if (statut === 'analyse') return 'En analyse';
    if (statut === 'cloturee') return 'Clôturée';
    return statut;
  };

  const colorStatut = (statut: string | null) => {
    if (statut === 'en_cours') return '#FFB300';
    if (statut === 'analyse') return '#007AFF';
    if (statut === 'cloturee') return '#2E7D32';
    return '#999';
  };

  return (
    <AuthGate>
      <PageContainer>
        <ScrollView
          contentContainerStyle={{ padding: 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <Text style={{ fontSize: 26, fontWeight: 'bold', marginBottom: 20 }}>
            🛡️ Alertes des agents
          </Text>

          {loading && (
            <View style={{ marginTop: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#FFD500" />
              <Text style={{ marginTop: 10 }}>Chargement des alertes…</Text>
            </View>
          )}

          {!loading && alertes.length === 0 && (
            <View
              style={{
                marginTop: 40,
                padding: 20,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: '#eee',
                backgroundColor: '#FFFBE6',
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 6 }}>
                Aucune alerte pour le moment
              </Text>
              <Text style={{ color: '#555' }}>
                Les alertes apparaîtront ici dès qu’un agent en déclarera une via le Bloc A.
              </Text>
            </View>
          )}

          {!loading &&
            alertes.map((a) => (
              <Pressable
                key={a.id}
                style={{
                  marginBottom: 15,
                  padding: 15,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: '#eee',
                  backgroundColor: '#FFFFFF',
                  shadowColor: '#000',
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  shadowOffset: { width: 0, height: 2 },
                }}
                onPress={() => router.push(`/delegue-detail?id=${a.id}`)}
                
                // plus tard : onPress={() => navigation vers détail}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ fontWeight: '700', fontSize: 16 }}>
                    {a.type || 'Type non renseigné'}
                  </Text>
                  <View
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 999,
                      backgroundColor: colorStatut(a.statut),
                    }}
                  >
                    <Text style={{ color: 'white', fontWeight: '600', fontSize: 12 }}>
                      {labelStatut(a.statut)}
                    </Text>
                  </View>
                </View>

                <Text style={{ color: '#555', marginBottom: 4 }}>
                  📍 {a.lieu || 'Lieu non renseigné'}
                </Text>

                <Text
                  style={{ color: '#777', marginBottom: 8 }}
                  numberOfLines={2}
                >
                  {a.description || 'Aucune description fournie.'}
                </Text>

                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 4,
                  }}
                >
                  <Text style={{ fontSize: 13, color: '#444' }}>
                    Gravité :{' '}
                    <Text style={{ fontWeight: '600' }}>
                      {a.gravite || 'Non précisée'}
                    </Text>
                  </Text>

                  {a.inserted_at && (
                    <Text style={{ fontSize: 12, color: '#888' }}>
                      {new Date(a.inserted_at).toLocaleString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  )}
                </View>
              </Pressable>
            ))}
        </ScrollView>
      </PageContainer>
    </AuthGate>
  );
}
