import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from 'lib/supabase';
import { useEffect, useState, useRef } from 'react';
import { Animated, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '../../../context/SupabaseSessionProvider';

export default function Page() {
  const { session } = useSession();
  const router = useRouter();
  const [agent, setAgent] = useState<any>(null);
  const [errorAgent, setErrorAgent] = useState<string | null>(null);
  const shimmerAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 200,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.delay(2500),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (session === undefined) return;
    if (session === null) return;

    const fetchAgent = async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (!error) {
        setAgent(data);
      } else {
        setErrorAgent("Votre profil agent n'a pas été trouvé (Erreur : " + error.code + "). Veuillez contacter l'administrateur.");
      }
    };

    fetchAgent();
  }, [session]);

  const openLink = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch (e) {
      console.log('Erreur ouverture lien', e);
    }
  };

  if (session === undefined) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={{ color: '#fff' }}>Initialisation…</Text>
      </SafeAreaView>
    );
  }

  if (session === null) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={{ color: '#fff' }}>Non connecté…</Text>
      </SafeAreaView>
    );
  }

  if (errorAgent) {
    return (
      <SafeAreaView style={styles.centered}>
        <Image
          source={require('../../assets/logo_autonome_sdmis.png')}
          style={styles.logoCentered}
          resizeMode="contain"
        />
        <Text style={{ color: '#FF4444', marginTop: 20, textAlign: 'center', fontSize: 16 }}>
          {errorAgent}
        </Text>
      </SafeAreaView>
    );
  }

  if (!agent) {
    return (
      <SafeAreaView style={styles.centered}>
        <Image
          source={require('../../assets/logo_autonome_sdmis.png')}
          style={styles.logoCentered}
          resizeMode="contain"
        />
        <Text style={{ color: '#fff', marginTop: 20 }}>Chargement de l'espace...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* EN-TÊTE */}
        <View style={styles.header}>
          <View style={[styles.logo, { overflow: 'hidden', position: 'relative', borderRadius: 10 }]}>
            <Image
              source={require('../../assets/logo_autonome_sdmis.png')}
              style={{ width: '100%', height: '100%' }}
              resizeMode="contain"
            />
            <Animated.View
              style={{
                position: 'absolute',
                top: -30,
                left: -20,
                width: 25,
                height: 120,
                backgroundColor: 'rgba(255, 255, 255, 0.4)',
                transform: [
                  { rotate: '25deg' },
                  { translateX: shimmerAnim }
                ]
              }}
            />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.welcomeText}>Bonjour,</Text>
            <Text style={styles.nameText}>{agent.prenom} {agent.nom} 👋</Text>
            <Text style={styles.roleText}>{agent.role_agent || 'Agent'}</Text>
          </View>
        </View>

        {/* ACTIONS RAPIDES */}
        <Text style={styles.sectionTitle}>Accès rapide</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/alerte')}>
            <View style={styles.actionIconWrapper}>
              <Text style={styles.actionIcon}>🚨</Text>
            </View>
            <Text style={styles.actionText}>Alerte</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/contribuer')}>
            <View style={styles.actionIconWrapper}>
              <Text style={styles.actionIcon}>💡</Text>
            </View>
            <Text style={styles.actionText}>Idées</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/sondages')}>
            <View style={styles.actionIconWrapper}>
              <Text style={styles.actionIcon}>📊</Text>
            </View>
            <Text style={styles.actionText}>Vote</Text>
          </TouchableOpacity>
        </View>

        {/* SECTION ADHÉSION */}
        <TouchableOpacity 
          style={styles.adhesionCard} 
          onPress={() => openLink('https://www.syndicatautonomesdmis.com/adhesion/')}
        >
          <Text style={styles.adhesionIcon}>🤝</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.adhesionTitle}>Devenir Adhérent</Text>
            <Text style={styles.adhesionDesc}>Rejoignez le syndicat pour nous soutenir et être mieux accompagné.</Text>
          </View>
          <Text style={styles.adhesionArrow}>➔</Text>
        </TouchableOpacity>

        {/* ACTUALITÉS / SITE WEB */}
        <Text style={styles.sectionTitle}>Notre actualité</Text>
        <TouchableOpacity style={styles.webCard} onPress={() => openLink('https://www.syndicatautonomesdmis.com/')}>
          <Text style={styles.webIcon}>⛑️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.webTitle}>Site Officiel</Text>
            <Text style={styles.webDesc}>Retrouvez toutes nos actualités et informations directement sur notre site web.</Text>
          </View>
        </TouchableOpacity>

        {/* RÉSEAUX SOCIAUX */}
        <Text style={styles.sectionTitle}>Rejoignez-nous</Text>
        <View style={styles.socialContainer}>
          <TouchableOpacity style={[styles.socialBtn, { backgroundColor: '#1877F2' }]} onPress={() => openLink('https://www.facebook.com/share/18jbXVHi1K/')}>
            <Text style={styles.socialBtnText}>Facebook</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.socialBtn, { backgroundColor: '#E1306C' }]} onPress={() => openLink('https://www.instagram.com/syndicatautonomesdmis?igsh=dGVrbjVoa2JyNjll')}>
            <Text style={styles.socialBtnText}>Instagram</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.socialContainer}>
          <TouchableOpacity 
            style={[styles.socialBtn, { backgroundColor: '#25D366' }]} 
            onPress={() => openLink(agent?.role_agent === 'PATS' ? 'https://chat.whatsapp.com/LklOMnRIMEgBjSLynTKTuL?mode=gi_t' : 'https://chat.whatsapp.com/CSvVl6wtEgdIJLO8akn5yF?mode=gi_t')}
          >
            <Text style={styles.socialBtnText}>
              {agent?.role_agent === 'PATS' ? 'WhatsApp PATS' : 'WhatsApp SPP'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.socialBtn, { backgroundColor: '#FF0000' }]} onPress={() => openLink('https://youtube.com/@syndicatautonomespp-patssd5482?si=FaheiUOUE3qcIbMJ')}>
            <Text style={styles.socialBtnText}>YouTube</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: '#111',
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  logo: {
    width: 65,
    height: 65,
    marginRight: 15,
  },
  logoCentered: {
    width: 140,
    height: 140,
    marginBottom: 20,
  },
  headerTextContainer: {
    flex: 1,
  },
  welcomeText: {
    color: '#aaa',
    fontSize: 14,
  },
  nameText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 2,
  },
  roleText: {
    color: '#FFD500',
    fontSize: 13,
    fontWeight: '600',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    marginTop: 10,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  actionCard: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 15,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#333',
  },
  actionIconWrapper: {
    backgroundColor: 'rgba(255, 213, 0, 0.1)',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionIcon: {
    fontSize: 22,
  },
  actionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  webCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    padding: 15,
    borderRadius: 16,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#333',
  },
  adhesionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 213, 0, 0.15)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#FFD500',
  },
  adhesionIcon: {
    fontSize: 28,
    marginRight: 15,
  },
  adhesionTitle: {
    color: '#FFD500',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  adhesionDesc: {
    color: '#fff',
    fontSize: 13,
    lineHeight: 18,
  },
  adhesionArrow: {
    color: '#FFD500',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  webIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  webTitle: {
    color: '#FFD500',
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  webDesc: {
    color: '#aaa',
    fontSize: 13,
    lineHeight: 18,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  socialBtn: {
    flex: 1,
    marginHorizontal: 5,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  socialBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
