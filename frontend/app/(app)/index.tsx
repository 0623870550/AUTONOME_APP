import { useRouter } from 'expo-router';
import { supabase } from 'lib/supabase';
import { useEffect, useState, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';

import {
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Linking,
  Modal,
  ActivityIndicator,
  Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '../../context/SupabaseSessionProvider';
import { useAgentRole } from '../../context/AgentRoleContext';


export default function Page() {
  const { session } = useSession();
  const { roleAgent } = useAgentRole();
  const router = useRouter();

  const [agent, setAgent] = useState<any>(null);
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState<any>(null);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const shimmerAnim = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    const startShimmer = () => {
      shimmerAnim.setValue(-1);
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.delay(3000),
      ]).start(() => startShimmer());
    };
    startShimmer();
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-80, 80],
  });


  useEffect(() => {
    console.log("Session actuelle:", session);
    if (session === undefined || session === null) return;


    const fetchData = async () => {
      try {
        const { data: agentData } = await supabase.from('agents').select('*').eq('id', session.user.id).single();
        if (agentData) setAgent(agentData);

        const { data, error } = await supabase
          .from('actualites')
          .select('*')
          .eq('is_published', true)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const filteredData = (data || []).filter(item => {
          const itemCat = String(item.category || '').toUpperCase();
          const userRole = String(roleAgent || '').toUpperCase();
          return itemCat === userRole || itemCat === 'ALL';
        }).slice(0, 3);

        console.log("ACTUS FILTRÉES:", filteredData);

        setNews(filteredData);

      } catch (e: any) {
        console.error("Erreur fetchData:", e);
        if (e?.message?.includes('lock') || e?.message?.includes('navigator.locks')) {
          console.warn("DÉTECTION D'UN CONFLIT DE LOCK AUTH.");
        }
      } finally { setLoading(false); }
    };
    fetchData();
  }, [session, roleAgent]);


  const openLink = (url: string) => {
    if (!url) return;
    const finalUrl = url.startsWith('http') ? url : `https://${url}`;
    Linking.openURL(finalUrl);
  };


  if (!agent || loading) {

    return (<View style={styles.centered}><ActivityIndicator size="large" color="#F8FF00" /></View>);
  }


  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* EN-TÊTE */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image source={require('../assets/logo_autonome_sdmis.png')} style={styles.logoImage} resizeMode="contain" />
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                {
                  transform: [{ translateX }, { rotate: '45deg' }],
                  width: '200%',
                  height: '200%',
                  top: '-50%',
                  left: '-50%',
                }
              ]}
            >
              <LinearGradient
                colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ flex: 1 }}
              />
            </Animated.View>
          </View>

          <View style={styles.headerTextContainer}>
            <Text style={styles.welcomeText}>Bonjour,</Text>
            <Text style={styles.nameText}>{agent.prenom} {agent.nom} 👋</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <Text style={styles.roleText}>{agent.role === 'admin' ? '🛡️ Administrateur' : '👤 Agent'}</Text>
              <TouchableOpacity
                onPress={() => supabase.auth.signOut()}
                style={{ backgroundColor: '#222', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#333' }}
              >
                <Text style={{ color: '#FF4444', fontSize: 10, fontWeight: 'bold' }}>🚪 Reset Session</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ACTIONS RAPIDES */}
        <Text style={styles.sectionTitle}>Accès rapide</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/alerte')}>
            <Text style={styles.actionIcon}>🚨</Text>
            <Text style={styles.actionText}>Alerte</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/contribuer')}>
            <Text style={styles.actionIcon}>💡</Text>
            <Text style={styles.actionText}>Idées</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/sondages')}>
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionText}>Vote</Text>
          </TouchableOpacity>
        </View>

        {/* ACTUALITÉS */}
        <Text style={styles.sectionTitle}>Actualités</Text>
        {news.map((item) => (
          <TouchableOpacity key={item.id} style={styles.newsCard} onPress={() => setSelectedNews(item)}>
            {item.image_url && <Image source={{ uri: item.image_url }} style={styles.newsImage} resizeMode="cover" />}
            <View style={styles.newsContent}>
              <Text style={styles.newsTitle}>{item.title}</Text>
              <Text style={styles.newsDate}>{new Date(item.created_at).toLocaleDateString('fr-FR')}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* RÉSEAUX SOCIAUX (LE MODULE QUI MANQUAIT) */}
        <Text style={styles.sectionTitle}>Rejoignez-nous</Text>
        <Text style={styles.socialSub}>Continuez de nous suivre sur nos réseaux officiels</Text>

        <View style={styles.socialGrid}>
          <TouchableOpacity style={[styles.socialBtn, { backgroundColor: '#1877F2' }]} onPress={() => openLink('https://www.facebook.com/share/18jbXVHi1K/')}>
            <Text style={styles.socialBtnText}>Facebook</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.socialBtn, { backgroundColor: '#E1306C' }]} onPress={() => openLink('https://www.instagram.com/syndicatautonomesdmis')}>
            <Text style={styles.socialBtnText}>Instagram</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.socialGrid}>
          <TouchableOpacity style={[styles.socialBtn, { backgroundColor: '#25D366' }]} onPress={() => openLink(agent?.role_agent === 'PATS' ? 'https://chat.whatsapp.com/LklOMnRIMEgBjSLynTKTuL' : 'https://chat.whatsapp.com/CSvVl6wtEgdIJLO8akn5yF')}>
            <Text style={styles.socialBtnText}>WhatsApp {agent?.role_agent === 'PATS' ? 'PATS' : 'SPP'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.socialBtn, { backgroundColor: '#FF0000' }]} onPress={() => openLink('https://youtube.com/@syndicatautonomespp-patssd5482')}>
            <Text style={styles.socialBtnText}>YouTube</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MODALE D'ARTICLE */}
      <Modal visible={!!selectedNews} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              {selectedNews?.image_url && (
                <Pressable onPress={() => setIsImageZoomed(true)}>
                  <Image source={{ uri: selectedNews.image_url }} style={styles.modalImage} resizeMode="contain" />
                </Pressable>
              )}
              <View style={{ padding: 20 }}>
                <Text style={styles.modalTitleText}>{selectedNews?.title}</Text>
                <Text style={styles.modalBodyText}>{selectedNews?.content}</Text>
              </View>
            </ScrollView>
            <View style={styles.modalFooter}>
              {selectedNews?.link_url && (
                <TouchableOpacity style={styles.linkBtn} onPress={() => openLink(selectedNews.link_url)}>
                  <Text style={styles.linkBtnText}>Suivre le lien 🔗</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedNews(null)}>
                <Text style={styles.closeBtnText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ZOOM IMAGE */}
      <Modal visible={isImageZoomed} transparent={false}>
        <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center' }}>
          <Image source={{ uri: selectedNews?.image_url }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
          <TouchableOpacity style={styles.zoomClose} onPress={() => setIsImageZoomed(false)}><Text style={{ color: '#fff', fontSize: 30 }}>✕</Text></TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20 },
  header: { flexDirection: 'row', backgroundColor: '#111', padding: 15, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#333', alignItems: 'center' },
  logoContainer: { width: 50, height: 50, marginRight: 15, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  logoImage: { width: 50, height: 50 },
  headerTextContainer: { flex: 1 },
  welcomeText: { color: '#aaa', fontSize: 13 },
  nameText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  roleText: { color: '#F8FF00', fontSize: 12 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  socialSub: { color: '#666', fontSize: 13, marginBottom: 15 },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between' },
  actionCard: { backgroundColor: '#111', padding: 15, borderRadius: 16, flex: 1, marginHorizontal: 5, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  actionIcon: { fontSize: 24, marginBottom: 5 },
  actionText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  newsCard: { backgroundColor: '#111', borderRadius: 16, overflow: 'hidden', marginBottom: 15, borderWidth: 1, borderColor: '#333' },
  newsImage: { width: '100%', height: 180 },
  newsContent: { padding: 15 },
  newsTitle: { color: '#F8FF00', fontSize: 16, fontWeight: 'bold' },
  newsDate: { color: '#666', fontSize: 11, marginTop: 5 },
  socialGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  socialBtn: { flex: 1, marginHorizontal: 5, padding: 12, borderRadius: 12, alignItems: 'center' },
  socialBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1A1A1A', borderRadius: 20, overflow: 'hidden', maxHeight: '85%' },
  modalImage: { width: '100%', height: 250, backgroundColor: '#000' },
  modalTitleText: { color: '#F8FF00', fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
  modalBodyText: { color: '#eee', fontSize: 16, lineHeight: 24 },
  modalFooter: { padding: 20, gap: 10, borderTopWidth: 1, borderTopColor: '#333' },
  linkBtn: { backgroundColor: '#007AFF', padding: 15, borderRadius: 12, alignItems: 'center' },
  linkBtnText: { color: '#fff', fontWeight: 'bold' },
  closeBtn: { backgroundColor: '#333', padding: 15, borderRadius: 12, alignItems: 'center' },
  closeBtnText: { color: '#fff' },
  zoomClose: { position: 'absolute', top: 50, right: 25, backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 25 }
});