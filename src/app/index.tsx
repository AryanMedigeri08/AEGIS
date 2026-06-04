import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { theme } from '@/constants/theme';
import { storage } from '@/services/storage';

const STATUS_MESSAGES = [
  'Loading offline modules...',
  'Initialising face detection...',
  'Ready',
];

export default function SplashScreen() {
  const [statusIndex, setStatusIndex] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const iconScaleAnim = useRef(new Animated.Value(0)).current;
  const iconOpacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate Shield Icon
    Animated.parallel([
      Animated.spring(iconScaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(iconOpacityAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate Progress Bar
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false,
    }).start();

    // Cycle Status Messages
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev < STATUS_MESSAGES.length - 1 ? prev + 1 : prev));
    }, 700);

    // Initialisation Check
    const checkInit = async () => {
      // Minimum display time for effect
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      try {
        const session = await storage.getSession();
        if (session) {
          router.replace('/(tabs)/home');
        } else {
          router.replace('/login');
        }
      } catch (e) {
        console.error('Failed to read session during startup', e);
        router.replace('/login');
      }
    };

    checkInit();

    return () => clearInterval(interval);
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.centerContent}>
        <Animated.Text 
          style={[
            styles.icon,
            { 
              transform: [{ scale: iconScaleAnim }],
              opacity: iconOpacityAnim 
            }
          ]}
        >
          🛡️
        </Animated.Text>
        <Text style={styles.title}>AEGIS</Text>
        <Text style={styles.subtitle}>Secure Offline Authentication</Text>

        <View style={styles.progressContainer}>
          <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
        </View>
        <Text style={styles.statusText}>{STATUS_MESSAGES[statusIndex]}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    alignItems: 'center',
    width: '80%',
  },
  icon: {
    fontSize: 72,
    marginBottom: theme.spacing.lg,
  },
  title: {
    color: theme.colors.primary,
    fontSize: theme.typography.display.fontSize,
    fontWeight: theme.typography.display.fontWeight,
    letterSpacing: theme.typography.display.letterSpacing,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body.fontSize,
    letterSpacing: theme.typography.body.letterSpacing,
    marginBottom: theme.spacing.xxxl,
  },
  progressContainer: {
    width: '100%',
    height: 4,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
  },
  statusText: {
    color: theme.colors.textDisabled,
    fontSize: theme.typography.caption.fontSize,
    fontFamily: theme.typography.mono.fontFamily,
  },
});