import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { theme } from '@/constants/theme';

type OvalState = 'idle' | 'detecting' | 'success' | 'failure';

interface FaceOvalOverlayProps {
  state: OvalState;
}

export default function FaceOvalOverlay({ state }: FaceOvalOverlayProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (state === 'detecting') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.4,
            duration: 750,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 750,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
      pulseAnim.stopAnimation();
    }
  }, [state, pulseAnim]);

  const getBorderColor = () => {
    switch (state) {
      case 'detecting':
        return theme.colors.primary;
      case 'success':
        return theme.colors.success;
      case 'failure':
        return theme.colors.error;
      case 'idle':
      default:
        return '#FFFFFF';
    }
  };

  const { width } = Dimensions.get('window');
  const ovalWidth = width * 0.7;
  const ovalHeight = ovalWidth * 1.3; // 90% of parent width, tweaked for face ratio

  return (
    <View style={styles.overlay} pointerEvents="none">
      <Animated.View
        style={[
          styles.oval,
          {
            width: ovalWidth,
            height: ovalHeight,
            borderColor: getBorderColor(),
            opacity: state === 'detecting' ? pulseAnim : 1,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  oval: {
    borderWidth: 2,
    borderRadius: 9999,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
});
