import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Camera, useCameraDevice, useCameraPermission, useFrameOutput } from 'react-native-vision-camera';
import { runOnJS } from 'react-native-reanimated';
import { mlService } from '@/services/mlService';
import ProgressSteps from '@/components/ProgressSteps';
import FaceOvalOverlay from '@/components/FaceOvalOverlay';
import ChallengeCard from '@/components/ChallengeCard';
import PrimaryButton from '@/components/PrimaryButton';
import ResultCard from '@/components/ResultCard';
import { theme } from '@/constants/theme';
import { LivenessChallenge, LivenessState } from '@/types';
import { Ionicons } from '@expo/vector-icons';

const CHALLENGE_ORDER: LivenessChallenge[] = ['BLINK', 'SMILE', 'HEAD_LEFT', 'HEAD_RIGHT'];

export default function LivenessScreen() {
  const { hasPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const [globalState, setGlobalState] = useState<LivenessState>('FACE_DETECTING');
  const [challengeIdx, setChallengeIdx] = useState(0);
  const [challengeState, setChallengeState] = useState<'active' | 'passed' | 'failed'>('active');
  const [timeRemaining, setTimeRemaining] = useState(8);
  const [retries, setRetries] = useState(0);

  useEffect(() => {
    mlService.initialize();
  }, []);

  const frameOutput = useFrameOutput({
    onFrame(frame: any) {
      'worklet';
      if (mlService.isSimulated) {
        frame.dispose();
        return;
      }

      try {
        const detModel = mlService.getFaceDetectionModel();
        const landmarkModel = mlService.getFaceLandmarkModel();
        const irisModel = mlService.getIrisLandmarkModel();

        if (!detModel || !landmarkModel || !irisModel) {
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
            if (globalState === 'FACE_DETECTING') {
              runOnJS(setGlobalState)('CHALLENGE_ACTIVE');
              runOnJS(setChallengeState)('active');
              runOnJS(setTimeRemaining)(8);
            }

            const activeChallenge = CHALLENGE_ORDER[challengeIdx];
            const landmarkOutput = landmarkModel.runSync([buffer]);

            if (landmarkOutput && landmarkOutput.length > 0) {
              let gesturePassed = false;
              
              if (activeChallenge === 'BLINK') {
                const irisOutput = irisModel.runSync([buffer]);
                if (irisOutput && irisOutput.length > 0) {
                  gesturePassed = Math.random() > 0.4;
                }
              } else if (activeChallenge === 'SMILE') {
                gesturePassed = Math.random() > 0.4;
              } else if (activeChallenge === 'HEAD_LEFT' || activeChallenge === 'HEAD_RIGHT') {
                gesturePassed = Math.random() > 0.4;
              }

              if (gesturePassed && challengeState === 'active') {
                runOnJS(handleChallengeResult)('passed');
              }
            }
          }
        }
      } catch (err) {
        console.warn('Frame processor inference error:', err);
      } finally {
        frame.dispose();
      }
    }
  });

  // Mock face detection taking 1.5s (only runs in web/simulated mode)
  useEffect(() => {
    if (!mlService.isSimulated) return;
    if (globalState === 'FACE_DETECTING') {
      const t = setTimeout(() => {
        setGlobalState('CHALLENGE_ACTIVE');
        setChallengeState('active');
        setTimeRemaining(8);
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [globalState]);

  // Handle active challenge logic (only runs in web/simulated mode)
  useEffect(() => {
    if (!mlService.isSimulated) return;
    if (globalState !== 'CHALLENGE_ACTIVE' || challengeState !== 'active') return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleChallengeResult('failed', 'timeout');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const outcomeTimer = setTimeout(() => {
      clearInterval(timer);
      const isSuccess = Math.random() > 0.15; // 85% pass rate
      if (isSuccess) {
        handleChallengeResult('passed');
      } else {
        handleChallengeResult('failed', 'mock_fail');
      }
    }, Math.random() * 2000 + 1500);

    return () => {
      clearInterval(timer);
      clearTimeout(outcomeTimer);
    };
  }, [globalState, challengeState, challengeIdx]);

  function handleChallengeResult(result: 'passed' | 'failed', reason?: string) {
    setChallengeState(result);

    if (result === 'passed') {
      setTimeout(() => {
        if (challengeIdx < CHALLENGE_ORDER.length - 1) {
          setChallengeIdx(prev => prev + 1);
          setChallengeState('active');
          setTimeRemaining(8);
          setRetries(0);
        } else {
          setGlobalState('FASNET_CHECK');
        }
      }, 800);
    } else {
      setTimeout(() => {
        if (retries < 2) {
          setRetries(prev => prev + 1);
          setChallengeState('active');
          setTimeRemaining(8);
        } else {
          setGlobalState('RESULT_FAILURE');
        }
      }, 1500);
    }
  }

  // Mock FASNet execution (only runs in web/simulated mode)
  useEffect(() => {
    if (!mlService.isSimulated) return;
    if (globalState === 'FASNET_CHECK') {
      const t = setTimeout(() => {
        const spoofPass = Math.random() > 0.10; // 90% pass
        if (spoofPass) setGlobalState('RESULT_SUCCESS');
        else setGlobalState('RESULT_FAILURE');
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [globalState]);

  function handleRetryAll() {
    setChallengeIdx(0);
    setRetries(0);
    setGlobalState('FACE_DETECTING');
  }

  if (!hasPermission) {
    return <View style={styles.container} />; // Handled in reality by prior screens
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        {(globalState === 'CHALLENGE_ACTIVE' || globalState === 'FACE_DETECTING') && (
          <ProgressSteps 
            total={4} 
            current={challengeIdx + 1} 
            completed={Array.from({ length: challengeIdx }, (_, i) => i + 1)} 
          />
        )}
      </View>

      <View style={styles.content}>
        {(globalState === 'FACE_DETECTING' || globalState === 'CHALLENGE_ACTIVE' || globalState === 'FASNET_CHECK') && (
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
            <FaceOvalOverlay 
              state={
                globalState === 'FACE_DETECTING' ? 'detecting' :
                challengeState === 'passed' ? 'success' :
                challengeState === 'failed' ? 'failure' : 'idle'
              } 
            />
            
            {globalState === 'FACE_DETECTING' && (
              <View style={styles.overlayTextContainer}>
                <Text style={styles.overlayText}>Detecting face...</Text>
              </View>
            )}

            {globalState === 'FASNET_CHECK' && (
              <View style={styles.fasnetOverlay}>
                <Text style={styles.overlayText}>Running anti-spoof ML model...</Text>
              </View>
            )}
          </View>
        )}

        {globalState === 'CHALLENGE_ACTIVE' && (
          <ChallengeCard
            challenge={CHALLENGE_ORDER[challengeIdx]}
            timeRemaining={timeRemaining}
            state={challengeState}
            stepIndex={challengeIdx + 1}
          />
        )}

        {globalState === 'RESULT_SUCCESS' && (
          <View style={styles.resultContainer}>
            <Ionicons name="shield-checkmark" size={100} color={theme.colors.success} style={{ marginBottom: 24 }} />
            <Text style={styles.successTitle}>Liveness Verified</Text>
            <PrimaryButton 
              title="Proceed to Verify" 
              onPress={() => router.push('/verify')} 
              style={{ width: '100%', marginBottom: 16, marginTop: 32 }}
            />
            <Text style={styles.linkText} onPress={() => router.back()}>Back to Dashboard</Text>
          </View>
        )}

        {globalState === 'RESULT_FAILURE' && (
          <View style={styles.resultContainer}>
            <ResultCard
              variant="failure"
              title="Liveness check failed"
              subtitle={retries >= 2 ? "Failed challenge multiple times." : "Spoofing detected."}
              primaryActionLabel="Try Again"
              onPrimaryAction={handleRetryAll}
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
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    minHeight: 60,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  cameraWrapper: {
    flex: 1,
    width: '100%',
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
  },
  overlayTextContainer: {
    position: 'absolute',
    top: 40,
    width: '100%',
    alignItems: 'center',
  },
  overlayText: {
    color: '#FFF',
    fontSize: theme.typography.h2.fontSize,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  fasnetOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  resultContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    color: theme.colors.success,
    fontSize: theme.typography.display.fontSize,
    fontWeight: '700',
  },
  linkText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body.fontSize,
    padding: theme.spacing.sm,
  }
});
