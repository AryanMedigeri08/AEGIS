import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import GlassCard from './GlassCard';
import { theme } from '@/constants/theme';
import { LivenessChallenge } from '@/types';

interface ChallengeCardProps {
  challenge: LivenessChallenge;
  timeRemaining: number; // 0-8
  state: 'active' | 'passed' | 'failed';
  stepIndex: number;
}

const CHALLENGE_INFO = {
  BLINK: { emoji: '👁️', instruction: 'Blink your eyes' },
  SMILE: { emoji: '😊', instruction: 'Smile at the camera' },
  HEAD_LEFT: { emoji: '⬅️', instruction: 'Turn your head left' },
  HEAD_RIGHT: { emoji: '➡️', instruction: 'Turn your head right' },
};

export default function ChallengeCard({
  challenge,
  timeRemaining,
  state,
  stepIndex,
}: ChallengeCardProps) {
  const slideAnim = useRef(new Animated.Value(100)).current;
  const progressAnim = useRef(new Animated.Value(timeRemaining)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  }, [slideAnim]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: timeRemaining,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [timeRemaining, progressAnim]);

  const { emoji, instruction } = CHALLENGE_INFO[challenge];

  const getBackgroundColor = () => {
    if (state === 'passed') return 'rgba(34,197,94,0.15)'; // success tint
    if (state === 'failed') return 'rgba(239,68,68,0.15)'; // error tint
    return theme.colors.surfaceGlass;
  };

  const getProgressColor = () => {
    if (timeRemaining > 5) return theme.colors.success;
    if (timeRemaining > 2) return theme.colors.warning;
    return theme.colors.error;
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 8],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      <GlassCard style={[styles.card, { backgroundColor: getBackgroundColor() }]}>
        <View style={styles.header}>
          <Text style={styles.stepText}>Step {stepIndex}/4</Text>
        </View>
        
        <View style={styles.content}>
          <Text style={styles.emoji}>{emoji}</Text>
          <Text style={styles.instruction}>
            {state === 'passed' && '✓ '}
            {state === 'failed' && '⚠️ '}
            {instruction}
          </Text>
        </View>

        {state === 'active' && (
          <View style={styles.progressContainer}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressWidth,
                  backgroundColor: getProgressColor(),
                },
              ]}
            />
          </View>
        )}
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 32,
    left: 16,
    right: 16,
    zIndex: 20,
  },
  card: {
    paddingTop: theme.spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  stepText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: theme.typography.caption.fontWeight,
    letterSpacing: theme.typography.caption.letterSpacing,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  emoji: {
    fontSize: 48,
    marginRight: theme.spacing.md,
  },
  instruction: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: theme.typography.h2.fontSize,
    fontWeight: theme.typography.h2.fontWeight,
    letterSpacing: theme.typography.h2.letterSpacing,
  },
  progressContainer: {
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
    width: '100%',
  },
  progressBar: {
    height: '100%',
    borderRadius: theme.borderRadius.full,
  },
});
