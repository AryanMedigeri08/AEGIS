import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient'; // Expo Router apps usually have expo-linear-gradient, fallback to View if missing, but we'll use a styled View to be safe
import PrimaryButton from '@/components/PrimaryButton';
import { theme } from '@/constants/theme';

export default function AttendanceSuccessScreen() {
  const { name, id, timestamp } = useLocalSearchParams();
  const [countdown, setCountdown] = useState(8);
  
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Spring animation for checkmark
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1.2,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1.0,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.replace('/(tabs)/home');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (ts: string) => {
    try {
      const date = new Date(parseInt(ts));
      return `${date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} · ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return 'Just now';
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient Effect */}
      <View style={styles.gradientBg} />

      <View style={styles.content}>
        <Animated.View style={[styles.iconContainer, { transform: [{ scale: scaleAnim }] }]}>
          <Ionicons name="checkmark-circle" size={120} color={theme.colors.success} />
        </Animated.View>

        <Text style={styles.title}>Attendance Marked</Text>

        <View style={styles.detailsBox}>
          <Text style={styles.name}>{name || 'Unknown User'}</Text>
          {id && <Text style={styles.idText}>ID: {id}</Text>}
          
          <View style={styles.divider} />
          
          <Text style={styles.timeText}>{timestamp ? formatTime(timestamp as string) : 'Just now'}</Text>
          
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: theme.colors.warning }]}>
              <Text style={styles.badgeText}>Offline</Text>
            </View>
          </View>

          <View style={styles.gpsRow}>
            <Ionicons name="location-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.gpsText}>Location unavailable</Text>
          </View>
        </View>

        <View style={styles.actionContainer}>
          <PrimaryButton 
            title="Back to Dashboard" 
            onPress={() => router.replace('/(tabs)/home')}
            style={styles.btn}
          />
          <Text style={styles.countdownText}>Auto-redirecting in {countdown}s</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  gradientBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(34,197,94,0.08)',
    // Poor man's radial gradient from top
    borderTopLeftRadius: 500,
    borderTopRightRadius: 500,
    transform: [{ scaleX: 2 }, { translateY: -200 }],
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    zIndex: 1,
  },
  iconContainer: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.display.fontSize,
    fontWeight: '700',
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  detailsBox: {
    width: '100%',
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderGlass,
  },
  name: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.h1.fontSize,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  idText: {
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.mono.fontFamily,
    fontSize: theme.typography.mono.fontSize,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: theme.colors.borderGlass,
    marginVertical: theme.spacing.lg,
  },
  timeText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body.fontSize,
    marginBottom: theme.spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  badgeText: {
    color: '#121212',
    fontSize: 12,
    fontWeight: '700',
  },
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gpsText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption.fontSize,
  },
  actionContainer: {
    width: '100%',
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  btn: {
    width: '100%',
    marginBottom: theme.spacing.md,
  },
  countdownText: {
    color: theme.colors.textDisabled,
    fontSize: theme.typography.caption.fontSize,
  },
});
