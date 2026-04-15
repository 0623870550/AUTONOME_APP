import { Tabs, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Platform, Pressable, StyleSheet, Text, View, ScrollView } from 'react-native';

import { useSession } from '../../context/SupabaseSessionProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { useAgentRole } from '../../context/AgentRoleContext';
import { useAlert } from '../../context/AlertContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AppLayout() {
  const { session } = useSession();
  const { alert } = useAlert();
  const { roleAgent } = useAgentRole();
  const router = useRouter();

  const [hasSurveyNotification, setHasSurveyNotification] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-300)).current;

  useEffect(() => {
    checkSurveyStatus();
  }, []);

  const checkSurveyStatus = async () => {
    try {
      const lastVote = await AsyncStorage.getItem('last_vote_timestamp');
      if (!lastVote) setHasSurveyNotification(true);
    } catch (e) {
      console.log("Erreur AsyncStorage", e);
    }
  };

  const toggleMenu = (show: boolean) => {
    if (show) {
      setMenuVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -300,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setMenuVisible(false));
    }
  };

  const navigateTo = (path: string) => {
    toggleMenu(false);
    // On utilise replace au lieu de push pour éviter l'accumulation de l'historique dans les onglets
    router.replace(path as any);
  };

  if (session === undefined || roleAgent === undefined) return null;

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      
      {/* HEADER AVEC HAMBURGER */}
      <SafeAreaView edges={['top']} style={styles.header}>
        <Pressable onPress={() => toggleMenu(true)} style={styles.hamburgerBtn}>
          <View style={styles.hamburgerLine} />
          <View style={[styles.hamburgerLine, { width: 14, marginVertical: 4 }]} />
          <View style={styles.hamburgerLine} />
        </Pressable>

        <Text style={styles.headerTitle}>AUTONOME</Text>

        <Pressable onPress={() => router.push('/alerte')} style={styles.headerAction}>
          <IconSymbol name="bell.fill" size={20} color="#F8FF00" />
          {alert && <View style={styles.badge} />}
        </Pressable>
      </SafeAreaView>

      {/* SYSTÈME DE ROUTES (CONTENEUR) */}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' }, // Barre de navigation classique masquée
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Accueil' }} />
        <Tabs.Screen name="alerte" options={{ title: 'Alertes' }} />
        <Tabs.Screen name="contribuer" options={{ title: 'Proposer' }} />
        <Tabs.Screen name="explorer" options={{ title: 'Explorer' }} />
        <Tabs.Screen name="sondages" options={{ title: 'Sondages' }} />
        <Tabs.Screen name="delegue" options={{ title: 'Délégués' }} />
        <Tabs.Screen name="compte" options={{ title: 'Compte' }} />
        <Tabs.Screen name="contact" options={{ title: 'Contact' }} />
        <Tabs.Screen name="mes-alertes" options={{ title: 'Mes Alertes' }} />
        <Tabs.Screen name="admin" options={{ title: 'Admin' }} />
      </Tabs>

      {/* MENU LATÉRAL (MODAL) */}
      <Modal visible={menuVisible} transparent animationType="none">
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => toggleMenu(false)} />
          
          <Animated.View style={[styles.sideMenu, { transform: [{ translateX: slideAnim }] }]}>
            <SafeAreaView style={{ flex: 1 }}>
              <View style={styles.menuHeader}>
                <Text style={styles.menuTitle}>Menu</Text>
                <Pressable onPress={() => toggleMenu(false)}>
                   <Text style={{ color: '#F8FF00', fontSize: 24, fontWeight: 'bold' }}>✕</Text>
                </Pressable>
              </View>

              <ScrollView style={styles.menuItems} showsVerticalScrollIndicator={false}>
                {[
                  { name: '🏠 Accueil', path: '/', icon: 'house.fill' },
                  { name: '🛡️ Administration', path: '/admin', icon: 'shield.fill' },
                  { name: '📝 Mes Alertes', path: '/mes-alertes', icon: 'list.bullet' },
                  { name: '📊 Sondages', path: '/sondages', icon: 'chart.pie.fill' },
                  { name: '🎖️ Vos Délégués', path: '/delegue', icon: 'person.2.fill' },
                  { name: '💡 Proposer', path: '/contribuer', icon: 'lightbulb.fill' },
                  { name: '🔍 Explorer', path: '/explorer', icon: 'magnifyingglass' },
                  { name: '✉️ Contact', path: '/contact', icon: 'paperplane.fill' },
                  { name: '⚙️ Mon Compte', path: '/compte', icon: 'gearshape.fill' },
                ].map((item) => (
                  <Pressable
                    key={item.path}
                    onPress={() => navigateTo(item.path)}
                    style={({ pressed }) => [
                      styles.menuItem,
                      pressed && { backgroundColor: 'rgba(255, 255, 255, 0.05)' }
                    ]}
                  >
                    <Text style={styles.menuItemText}>{item.name}</Text>
                    {item.name.includes('Sondages') && hasSurveyNotification && <View style={styles.dot} />}
                  </Pressable>
                ))}
              </ScrollView>

              <View style={styles.menuFooter}>
                <Text style={styles.footerText}>SDMIS AUTONOME • v2.1</Text>
              </View>
            </SafeAreaView>
          </Animated.View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    paddingBottom: 10,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
  },
  hamburgerBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  hamburgerLine: {
    height: 2,
    width: 20,
    backgroundColor: '#F8FF00',
    borderRadius: 1,
  },
  headerAction: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4444',
    borderWidth: 1,
    borderColor: '#000',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  sideMenu: {
    width: 260,
    height: '100%',
    backgroundColor: '#111',
    borderRightWidth: 1,
    borderRightColor: '#F8FF0033',
    paddingHorizontal: 20,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  menuTitle: {
    color: '#F8FF00',
    fontSize: 24,
    fontWeight: 'bold',
  },
  menuItems: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  menuItemText: {
    color: '#eee',
    fontSize: 16,
    fontWeight: '500',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F8FF00',
    marginLeft: 10,
  },
  menuFooter: {
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  footerText: {
    color: '#555',
    fontSize: 11,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
