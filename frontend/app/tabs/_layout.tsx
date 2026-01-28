import { Tabs } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import { IconSymbol } from '../components/ui/icon-symbol';
import { useAlert } from '../context/AlertContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';

export default function TabLayout() {
  const { alert } = useAlert();

  const [hasSurveyNotification, setHasSurveyNotification] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const loadRole = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      if (!userId) return;

      const { data: profile, error } = await supabase
        .from('agents')
        .select('role')
        .eq('id', userId)
        .single();

      if (!error && profile) {
        setRole(profile.role);
      }
    };

    loadRole();
  }, []);

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

  const IconWrapper = ({
    name,
    focused,
    isMobilisation,
    hasNotification,
  }: {
    name: string;
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
              useNativeDriver: true,
            }),
            Animated.timing(flashAnim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
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
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
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
          shadowColor: focused ? '#F8FF00' : 'transparent',
          shadowOpacity: focused ? 0.8 : 0,
          shadowRadius: focused ? 12 : 0,
          shadowOffset: { width: 0, height: 0 },
          elevation: focused ? 10 : 0,
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
      {/* … reste du code identique … */}
    </Tabs>
  );
}
