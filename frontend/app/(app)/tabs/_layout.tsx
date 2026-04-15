import { Tabs } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, View } from 'react-native';

import { USE_NATIVE_DRIVER } from '../../../lib/platform';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { IconSymbol } from 'components/ui/icon-symbol';
import { useAgentRole } from '../../../context/AgentRoleContext';
import { useAlert } from '../../../context/AlertContext';

export default function TabLayout() {
  const { alert } = useAlert();
  const { roleAgent } = useAgentRole(); // 🔥 rôle déjà chargé par AuthGate

  const [hasSurveyNotification, setHasSurveyNotification] = useState(false);

  // ✅ Hooks TOUJOURS appelés avant tout return conditionnel
  useEffect(() => {
    const checkSurveyStatus = async () => {
      const activeSurveyId = '2025-conditions-travail';

      const votes = await AsyncStorage.getItem('surveyVotes');
      if (!votes) {
        setHasSurveyNotification(true);
        return;
      }

      const parsed = JSON.parse(votes);
      const hasVoted = parsed[activeSurveyId];

      setHasSurveyNotification(!hasVoted);
    };

    checkSurveyStatus();
  }, []);

  // 🔥 Guard APRÈS tous les hooks
  if (roleAgent === undefined) {
    return null; // on attend que AuthGate ait fini de charger le rôle
  }

  const IconWrapper = ({
    name,
    focused,
    isMobilisation,
    hasNotification,
  }: {
    name: any;
    focused: boolean;
    isMobilisation?: boolean;
    hasNotification?: boolean;
  }) => {
    const flashAnim = useRef(new Animated.Value(1)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      if (isMobilisation && alert) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(flashAnim, {
              toValue: 0.3,
              duration: 200,
              useNativeDriver: USE_NATIVE_DRIVER,
            }),
            Animated.timing(flashAnim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: USE_NATIVE_DRIVER,
            }),
          ])
        ).start();

        setTimeout(() => {
          flashAnim.stopAnimation();
          flashAnim.setValue(1);
        }, 3000);
      }
    }, [alert]);

    useEffect(() => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 150,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]).start();
    }, [focused]);

    return (
      <Animated.View
        style={{
          transform: [{ scale: pulseAnim }],
          opacity: isMobilisation && alert ? flashAnim : 1,
          backgroundColor: '#F8FF00',
          width: focused ? 38 : 32,
          height: focused ? 38 : 32,
          borderRadius: 19,
          alignItems: 'center',
          justifyContent: 'center',
          ...(Platform.OS === 'web'
            ? { boxShadow: focused ? '0px 0px 12px rgba(0, 122, 255, 0.8)' : 'none' }
            : {
              shadowColor: focused ? '#007AFF' : 'transparent',
              shadowOpacity: focused ? 0.8 : 0,
              shadowRadius: focused ? 12 : 0,
              shadowOffset: { width: 0, height: 0 },
              elevation: focused ? 10 : 0,
            }),
        }}
      >
        <IconSymbol size={18} name={name} color="#000" />
        {hasNotification && (
          <View
            style={{
              position: 'absolute',
              top: -2,
              right: -2,
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: '#F8FF00',
              borderWidth: 1,
              borderColor: '#000',
            }}
          />
        )}
      </Animated.View>
    );
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#000',
          borderTopColor: '#222',
          height: 70,
        },
        tabBarLabelStyle: {
          fontFamily: 'Montserrat_400Regular',
          fontSize: 12,
          textTransform: 'none',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ focused }) => <IconWrapper name="house.fill" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="explorer"
        options={{
          title: 'Explorer',
          tabBarIcon: ({ focused }) => <IconWrapper name="magnifyingglass" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="alerte"
        options={{
          title: 'Alerte',
          tabBarIcon: ({ focused }) => <IconWrapper name="warning" focused={focused} isMobilisation />,
        }}
      />
      <Tabs.Screen
        name="mes-alertes"
        options={{
          title: 'Les Alertes',
          tabBarIcon: ({ focused }) => <IconWrapper name="list.bullet" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="sondages"
        options={{
          title: 'Sondages',
          tabBarIcon: ({ focused }) => <IconWrapper name="chart.pie.fill" focused={focused} hasNotification={hasSurveyNotification} />,
        }}
      />
      <Tabs.Screen
        name="delegue"
        options={{
          title: 'Délégués',
          tabBarIcon: ({ focused }) => <IconWrapper name="person.2.fill" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="contribuer"
        options={{
          title: 'Contribuer',
          tabBarIcon: ({ focused }) => <IconWrapper name="lightbulb.fill" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="contact"
        options={{
          title: 'Contact',
          tabBarIcon: ({ focused }) => <IconWrapper name="paperplane.fill" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="compte"
        options={{
          title: 'Compte',
          tabBarIcon: ({ focused }) => <IconWrapper name="gearshape.fill" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
