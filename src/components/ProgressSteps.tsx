import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';

interface ProgressStepsProps {
  total: number;
  current: number; // 1-indexed
  completed: number[]; // Array of 1-indexed completed steps
}

export default function ProgressSteps({ total, current, completed }: ProgressStepsProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.6,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const steps = Array.from({ length: total }, (_, i) => i + 1);

  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const isCompleted = completed.includes(step);
        const isCurrent = current === step;
        const isLast = index === total - 1;

        // Determine line color to the right of this node
        let lineColor = theme.colors.border;
        if (!isLast) {
           // If this step is completed AND the next step is completed OR current, make the line green
           // Based on PRD: "connecting lines: green if between two completed..."
           // We'll also make it green if it leads to the current active step to show progress flowing
           if (isCompleted && (completed.includes(step + 1) || current === step + 1)) {
              lineColor = theme.colors.success;
           }
        }

        return (
          <React.Fragment key={`step-${step}`}>
            <View style={styles.stepContainer}>
              {isCompleted ? (
                <View style={[styles.circle, styles.circleCompleted]}>
                  <Ionicons name="checkmark" size={14} color="#FFF" />
                </View>
              ) : isCurrent ? (
                <Animated.View
                  style={[
                    styles.circle,
                    styles.circleCurrent,
                    { transform: [{ scale: pulseAnim }] },
                  ]}
                />
              ) : (
                <View style={[styles.circle, styles.circleUpcoming]} />
              )}
            </View>
            
            {!isLast && (
              <View style={[styles.line, { backgroundColor: lineColor }]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: theme.spacing.md,
  },
  stepContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
  },
  circle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleCompleted: {
    backgroundColor: theme.colors.success,
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  circleCurrent: {
    backgroundColor: theme.colors.primary,
  },
  circleUpcoming: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  line: {
    flex: 1,
    height: 2,
    marginHorizontal: 4,
    maxWidth: 40,
  },
});
