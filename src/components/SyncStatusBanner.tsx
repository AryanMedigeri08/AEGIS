import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';

interface SyncStatusBannerProps {
  status: 'success' | 'error' | 'warning';
  message: string;
  visible: boolean;
  onDismiss?: () => void;
}

export default function SyncStatusBanner({
  status,
  message,
  visible,
  onDismiss,
}: SyncStatusBannerProps) {
  const [shouldRender, setShouldRender] = useState(visible);
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
      }).start();

      const timer = setTimeout(() => {
        hideBanner();
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      hideBanner();
    }
  }, [visible]);

  const hideBanner = () => {
    Animated.timing(slideAnim, {
      toValue: -100, // Slide further up to fully hide
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShouldRender(false);
      if (onDismiss) onDismiss();
    });
  };

  const getBackgroundColor = () => {
    switch (status) {
      case 'success': return theme.colors.success;
      case 'error': return theme.colors.error;
      case 'warning': return theme.colors.warning;
      default: return theme.colors.primary;
    }
  };

  const getIconName = () => {
    switch (status) {
      case 'success': return 'checkmark-circle';
      case 'error': return 'alert-circle';
      case 'warning': return 'warning';
      default: return 'information-circle';
    }
  };

  if (!shouldRender) return null; // Avoid rendering if strictly not visible and animation done

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Ionicons name={getIconName()} size={24} color="#FFF" style={styles.icon} />
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50, // Below status bar
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    zIndex: 100,
  },
  icon: {
    marginRight: theme.spacing.sm,
  },
  message: {
    color: '#FFFFFF',
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    flex: 1,
  },
});
