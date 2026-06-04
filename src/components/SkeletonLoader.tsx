import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, ViewStyle, DimensionValue } from 'react-native';
import { theme } from '@/constants/theme';

interface SkeletonLoaderProps {
  width: DimensionValue;
  height: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
}

export default function SkeletonLoader({
  width,
  height,
  borderRadius = theme.borderRadius.md,
  style,
}: SkeletonLoaderProps) {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity: pulseAnim,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: theme.colors.border, // Represents the #3C4043 base color for shimmer
  },
});
