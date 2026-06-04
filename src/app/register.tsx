import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Camera, useCameraDevice, useCameraPermission, useFrameOutput } from 'react-native-vision-camera';
import { Ionicons } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import { runOnJS } from 'react-native-reanimated';

import TextInput from '@/components/TextInput';
import PrimaryButton from '@/components/PrimaryButton';
import SecondaryButton from '@/components/SecondaryButton';
import ProgressSteps from '@/components/ProgressSteps';
import FaceOvalOverlay from '@/components/FaceOvalOverlay';
import { theme } from '@/constants/theme';
import { storage } from '@/services/storage';
import { mlService } from '@/services/mlService';

export default function RegisterScreen() {
  const [step, setStep] = useState(1);
  const [employeeId, setEmployeeId] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('');
  const [idError, setIdError] = useState<string | null>(null);
  
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const cameraRef = useRef<any>(null);
  
  const [embedding, setEmbedding] = useState<number[] | null>(null);
  const [processing, setProcessing] = useState(false);

  const checkScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    mlService.initialize();
  }, []);

  const frameOutput = useFrameOutput({
    onFrame(frame: any) {
      'worklet';
      if (mlService.isSimulated || step !== 2) {
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
              
              runOnJS(setEmbedding)(embArray);
              runOnJS(setStep)(3);
            }
          }
        }
      } catch (err) {
        console.warn('Register frame processor error:', err);
      } finally {
        frame.dispose();
      }
    }
  });

  const handleNextStep1 = async () => {
    if (!employeeId.trim() || !fullName.trim()) return;
    
    const existing = await storage.getUserByEmployeeId(employeeId.trim());
    if (existing) {
      setIdError('This Employee ID already exists in the system.');
      return;
    }
    
    setIdError(null);
    setStep(2);
  };

  const handleCapture = async () => {
    setProcessing(true);
    try {
      // In a real frame processor, the embedding would be generated continuously
      // Here we simulate triggering a frame capture and ML extraction
      const faceEmbedding = mlService.generateEmbedding(null); // passing null as dummy frame
      setEmbedding(faceEmbedding);
      setStep(3);
    } catch (e) {
      Alert.alert('Capture Failed', 'Could not extract face embedding.');
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmPhoto = async () => {
    if (!embedding) return;
    setProcessing(true);
    
    try {
      const newUser = {
        userId: Crypto.randomUUID(),
        employeeId: employeeId.trim(),
        fullName: fullName.trim(),
        department: department.trim() || undefined,
        enrolledAt: Date.now(),
        embedding,
        embeddingVersion: 1,
        isActive: true,
      };

      await storage.saveUser(newUser);
      
      setStep(4);
      Animated.spring(checkScale, {
        toValue: 1,
        tension: 40,
        friction: 5,
        useNativeDriver: true,
      }).start();
      
    } catch (e) {
      Alert.alert('Error', 'Failed to register user.');
    } finally {
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setEmployeeId('');
    setFullName('');
    setDepartment('');
    setEmbedding(null);
    checkScale.setValue(0);
  };

  if (step === 2 && !hasPermission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>We need your permission to show the camera for face registration.</Text>
          <PrimaryButton title="Grant Permission" onPress={requestPermission} />
          <SecondaryButton title="Cancel" onPress={() => router.back()} style={{ marginTop: 16 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        {step < 4 && (
          <Ionicons 
            name="close" 
            size={28} 
            color={theme.colors.textPrimary} 
            onPress={() => router.back()}
            style={styles.closeIcon}
          />
        )}
        <Text style={styles.headerTitle}>Register Face</Text>
      </View>

      <ProgressSteps total={4} current={step} completed={Array.from({ length: step - 1 }, (_, i) => i + 1)} />

      <View style={styles.content}>
        {step === 1 && (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <Text style={styles.stepTitle}>Employee Details</Text>
            <Text style={styles.stepSubtitle}>Enter information for the new user.</Text>

            <TextInput
              label="Employee ID *"
              placeholder="e.g. 10042"
              value={employeeId}
              onChangeText={(t) => { setEmployeeId(t); setIdError(null); }}
              error={idError || undefined}
            />
            <TextInput
              label="Full Name *"
              placeholder="e.g. Jane Doe"
              value={fullName}
              onChangeText={setFullName}
            />
            <TextInput
              label="Department (Optional)"
              placeholder="e.g. Engineering"
              value={department}
              onChangeText={setDepartment}
            />

            <View style={styles.spacer} />
            <PrimaryButton
              title="Next"
              onPress={handleNextStep1}
              disabled={!employeeId.trim() || !fullName.trim()}
            />
          </KeyboardAvoidingView>
        )}

        {step === 2 && (
          <View style={styles.cameraContainer}>
            <Text style={styles.instructionText}>Position your face in the oval</Text>
            <View style={styles.cameraFrame}>
              {device ? (
                <Camera 
                  style={StyleSheet.absoluteFill} 
                  device={device}
                  isActive={true}
                  ref={cameraRef}
                  outputs={[frameOutput]}
                />
              ) : (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{color: '#fff'}}>Camera not available</Text>
                </View>
              )}
              <FaceOvalOverlay state="idle" />
              {processing && (
                <View style={styles.processingOverlay}>
                  <Text style={styles.processingText}>Processing...</Text>
                </View>
              )}
            </View>
            <PrimaryButton title="Extract Features" onPress={handleCapture} loading={processing} style={styles.captureBtn} />
          </View>
        )}

        {step === 3 && (
          <View style={styles.cameraContainer}>
            <Text style={styles.instructionText}>Features Extracted</Text>
            <View style={styles.cameraFrame}>
              <View style={[StyleSheet.absoluteFill, { backgroundColor: '#222', justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
                 <Text style={{ color: theme.colors.success, fontSize: 18, textAlign: 'center' }}>
                   Mathematical face embedding generated successfully ({embedding?.length} dimensions).
                 </Text>
              </View>
              <FaceOvalOverlay state="success" />
              {processing && (
                <View style={styles.processingOverlay}>
                  <Text style={styles.processingText}>Saving...</Text>
                </View>
              )}
            </View>
            <View style={styles.actionRow}>
              <SecondaryButton title="Retake" onPress={() => setStep(2)} disabled={processing} style={styles.flexBtn} />
              <PrimaryButton title="Confirm & Save" onPress={handleConfirmPhoto} loading={processing} style={styles.flexBtn} />
            </View>
          </View>
        )}

        {step === 4 && (
          <View style={styles.successContainer}>
            <Animated.View style={{ transform: [{ scale: checkScale }] }}>
              <Ionicons name="checkmark-circle" size={100} color={theme.colors.success} />
            </Animated.View>
            <Text style={styles.successTitle}>Registered Successfully</Text>
            
            <View style={styles.successDetails}>
              <Text style={styles.successName}>{fullName}</Text>
              <Text style={styles.successId}>{employeeId}</Text>
            </View>

            <View style={styles.spacer} />
            <PrimaryButton title="Go to Dashboard" onPress={() => router.replace('/(tabs)/home')} style={{ width: '100%', marginBottom: 16 }} />
            <SecondaryButton title="Register Another" onPress={resetForm} style={{ width: '100%' }} />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    position: 'relative',
  },
  closeIcon: {
    position: 'absolute',
    left: theme.spacing.md,
  },
  headerTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.h2.fontSize,
    fontWeight: theme.typography.h2.fontWeight,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  spacer: {
    flex: 1,
  },
  stepTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.h1.fontSize,
    fontWeight: theme.typography.h1.fontWeight,
    marginBottom: theme.spacing.xs,
  },
  stepSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body.fontSize,
    marginBottom: theme.spacing.xl,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  permissionTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.h1.fontSize,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  permissionText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body.fontSize,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  cameraContainer: {
    flex: 1,
    alignItems: 'center',
  },
  instructionText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.h2.fontSize,
    marginBottom: theme.spacing.lg,
  },
  cameraFrame: {
    width: '100%',
    flex: 1,
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
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  processingText: {
    color: '#FFF',
    fontSize: theme.typography.h2.fontSize,
    fontWeight: '600',
  },
  captureBtn: {
    width: '100%',
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    width: '100%',
  },
  flexBtn: {
    flex: 1,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: theme.spacing.xxxl,
  },
  successTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.h1.fontSize,
    fontWeight: '700',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  successDetails: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    width: '100%',
  },
  successName: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.h2.fontSize,
    fontWeight: '600',
    marginBottom: 4,
  },
  successId: {
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.mono.fontFamily,
    fontSize: theme.typography.mono.fontSize,
  },
});
