import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';

// Real Webcam Stream Component for Web testing
export const Camera = React.forwardRef(({ style, ...props }, ref) => {
  const videoRef = useRef(null);

  useEffect(() => {
    let stream = null;
    
    async function enableWebcam() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 640, height: 480 },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn("Could not access webcam for live preview:", err);
      }
    }

    enableWebcam();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <View style={[style, styles.cameraContainer]}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: 'scaleX(-1)', // Mirror for selfie/front camera feel
          backgroundColor: '#000',
        }}
      />
    </View>
  );
});

// Mock hook returning a simulated front camera device
export function useCameraDevice(position) {
  return {
    id: 'mock-front-camera',
    position: position,
    name: 'Simulated Web Camera',
  };
}

// Mock hook returning immediate camera permissions
export function useCameraPermission() {
  return {
    hasPermission: true,
    requestPermission: async () => true,
  };
}

// Mock useFrameOutput hook for web support
export function useFrameOutput(options) {
  return {};
}

const styles = StyleSheet.create({
  cameraContainer: {
    backgroundColor: '#000',
    overflow: 'hidden',
  },
});
