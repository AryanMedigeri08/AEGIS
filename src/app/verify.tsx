import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Camera, useCameraDevice, useCameraPermission, useFrameOutput } from 'react-native-vision-camera';
import PrimaryButton from '@/components/PrimaryButton';
import ResultCard from '@/components/ResultCard';
import { runOnJS } from 'react-native-reanimated';
import FaceOvalOverlay from '@/components/FaceOvalOverlay';
import ConnectivityBadge from '@/components/ConnectivityBadge';
import { theme } from '@/constants/theme';
import { storage } from '@/services/storage';
import { mlService } from '@/services/mlService';
import { AuthResult } from '@/types';

type VerifyState = 'CAPTURING' | 'PROCESSING' | 'SUCCESS' | 'FAILURE';

export default function VerifyScreen() {
  const [state, setState] = useState<VerifyState>('CAPTURING');
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const [result, setResult] = useState<AuthResult | null>(null);

  useEffect(() => {
    mlService.initialize();
  }, []);

  const frameOutput = useFrameOutput({
    onFrame(frame: any) {
      'worklet';
      if (mlService.isSimulated || state !== 'CAPTURING') {
        frame.dispose();
        return;
      }

      try {
        const detModel = mlService.getFaceDetectionModel();
        const recModel = mlService.getRecognitionModel();
        if (!detModel || !recModel) {
          frame.dispose();
          return;
        }

        let buffer;
        try {
          buffer = typeof frame.toArrayBuffer === 'function' ? frame.toArrayBuffer() : null;
        } catch (e) {
          // fallback
        }

        if (!buffer) {
          frame.dispose();
          return;
        }

        const detOutput = detModel.runSync([buffer]);
        if (detOutput && detOutput.length > 0) {
          const scores = new Float32Array(detOutput[1]);
          const hasFace = scores.some(score => score > 0.7);

          if (hasFace) {
            const recOutput = recModel.runSync([buffer]);
            if (recOutput && recOutput.length > 0) {
              const rawEmbedding = new Float32Array(recOutput[0]);
              const embArray = Array.from(rawEmbedding);
              
              runOnJS(runMatchingOnJS)(embArray);
            }
          }
        }
      } catch (err) {
        console.warn('Verify frame processor error:', err);
      } finally {
        frame.dispose();
      }
    }
  });

  async function runMatchingOnJS(liveEmbedding: number[]) {
    setState('PROCESSING');
    try {
      const users = await storage.getUsers();
      const res = await mlService.verifyIdentity(liveEmbedding, users);
      setResult(res);
      if (res.matched) {
        setState('SUCCESS');
      } else {
        setState('FAILURE');
      }
    } catch (e) {
      console.error(e);
      setState('FAILURE');
    }
  }

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerMsg}>
          <Text style={styles.msgText}>Camera access is required for verification.</Text>
          <PrimaryButton title="Grant Permission" onPress={requestPermission} />
        </View>
      </SafeAreaView>
    );
  }

  const handleCapture = async () => {
    setState('PROCESSING');
    
    try {
      // Generate embedding using ML service (simulating real-time extraction)
      const liveEmbedding = mlService.generateEmbedding(null);
      
      const users = await storage.getUsers();
      const res = await mlService.verifyIdentity(liveEmbedding, users);
      
      setResult(res);
      
      if (res.matched) {
        setState('SUCCESS');
      } else {
        setState('FAILURE');
      }
    } catch (e) {
      console.error(e);
      setState('FAILURE');
    }
  };

  const handleMarkAttendance = async () => {
    if (!result || !result.userId) return;

    try {
      const deviceId = await storage.getDeviceId();
      await storage.saveAttendanceLog({
        logId: result.logId,
        userId: result.userId,
        employeeId: result.employeeId!,
        fullName: result.fullName!,
        timestamp: result.timestamp,
        confidence: result.confidence,
        livenessScore: result.livenessScore,
        latitude: null, // mock GPS
        longitude: null,
        deviceId,
        syncStatus: 'pending',
        syncedAt: null,
        receiptId: null,
      });

      router.replace({
        pathname: '/attendance-success',
        params: {
          name: result.fullName,
          id: result.employeeId,
          timestamp: result.timestamp.toString(),
        }
      });
    } catch (e) {
      console.error('Failed to log attendance', e);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle} onPress={() => router.back()}>Cancel</Text>
        <ConnectivityBadge status="offline" />
      </View>

      <View style={styles.content}>
        {(state === 'CAPTURING' || state === 'PROCESSING') && (
          <>
            <Text style={styles.instruction}>Position your face and tap Verify</Text>
            
            <View style={styles.cameraWrapper}>
              {device ? (
                <Camera 
                  style={StyleSheet.absoluteFill} 
                  device={device}
                  isActive={true}
                  outputs={[frameOutput]}
                />
              ) : (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: '#333' }]} />
              )}
              
              <FaceOvalOverlay state={state === 'PROCESSING' ? 'detecting' : 'idle'} />
              
              {state === 'PROCESSING' && (
                <View style={styles.processingOverlay}>
                  <Text style={styles.processingText}>Running ML Model...</Text>
                </View>
              )}
            </View>

            <PrimaryButton 
              title="Verify Identity" 
              onPress={handleCapture}
              disabled={state === 'PROCESSING'}
              loading={state === 'PROCESSING'}
              style={styles.fullWidthBtn}
            />
          </>
        )}

        {state === 'SUCCESS' && result && (
          <View style={styles.resultContainer}>
            <ResultCard
              variant="success"
              employeeName={result.fullName || undefined}
              employeeId={result.employeeId || undefined}
              confidence={result.confidence}
              timestamp={result.timestamp}
              primaryActionLabel="Mark Attendance"
              onPrimaryAction={handleMarkAttendance}
            />
          </View>
        )}

        {state === 'FAILURE' && (
          <View style={styles.resultContainer}>
            <ResultCard
              variant="failure"
              primaryActionLabel="Try Again"
              onPrimaryAction={() => setState('CAPTURING')}
              secondaryActionLabel="Cancel"
              onSecondaryAction={() => router.back()}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerMsg: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  msgText: {
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
    fontSize: theme.typography.body.fontSize,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
  },
  headerTitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body.fontSize,
    padding: theme.spacing.sm,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  instruction: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.h2.fontSize,
    marginBottom: theme.spacing.lg,
    marginTop: theme.spacing.sm,
  },
  cameraWrapper: {
    flex: 1,
    width: '100%',
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginBottom: theme.spacing.xl,
    position: 'relative',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  processingText: {
    color: '#FFF',
    fontSize: theme.typography.h2.fontSize,
    fontWeight: '600',
  },
  fullWidthBtn: {
    width: '100%',
  },
  resultContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
  },
});
