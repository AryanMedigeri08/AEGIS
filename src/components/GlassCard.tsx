import React, { useRef } from 'react';
import {
  StyleSheet,
  Animated,
  ViewStyle,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { theme } from '@/constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  onPress?: () => void;
  disabled?: boolean;
}

export default function GlassCard({
  children,
  style,
  onPress,
  disabled = false,
}: GlassCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (onPress && !disabled) {
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (onPress && !disabled) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
  };

  const cardContent = (
    <Animated.View
      style={[
        styles.card,
        style,
        onPress && !disabled ? { transform: [{ scale: scaleAnim }] } : {},
      ]}
    >
      {children}
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableWithoutFeedback
        onPress={disabled ? undefined : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View>{cardContent}</View>
      </TouchableWithoutFeedback>
    );
  }

  return cardContent;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surfaceGlass,
    borderWidth: 1,
    borderColor: theme.colors.borderGlass,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});
