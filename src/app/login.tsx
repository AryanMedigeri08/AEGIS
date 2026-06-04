import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import TextInput from '@/components/TextInput';
import PrimaryButton from '@/components/PrimaryButton';
import ConnectivityBadge from '@/components/ConnectivityBadge';
import { theme } from '@/constants/theme';
import { storage } from '@/services/storage';
import { config } from '@/constants/config';
import { connectivity } from '@/services/connectivity';
import { ConnectivityStatus } from '@/types';

export default function LoginScreen() {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connStatus, setConnStatus] = useState<ConnectivityStatus>('offline');

  useEffect(() => {
    const checkConn = async () => {
      const logs = await storage.getAttendanceLogs();
      const pendingCount = logs.filter(l => l.syncStatus !== 'synced').length;
      const status = await connectivity.getConnectivityStatus(pendingCount);
      setConnStatus(status);
    };
    checkConn();
  }, []);

  const isFormValid = employeeId.trim().length >= 4 && password.trim().length >= 6;

  const handleLogin = async () => {
    if (!isFormValid) return;
    
    setLoading(true);
    setError(null);
    
    // Mock authentication
    setTimeout(async () => {
      try {
        // Find user if exists
        const user = await storage.getUserByEmployeeId(employeeId.trim());
        
        const session = {
          employeeId: employeeId.trim(),
          fullName: user ? user.fullName : `User ${employeeId}`,
          department: user?.department,
          loggedInAt: Date.now(),
        };

        await storage.saveSession(session);
        router.replace('/(tabs)/home');
      } catch (err) {
        setError('Invalid credentials. Please try again.');
        setLoading(false);
      }
    }, config.TIMING.MOCK_AUTH_DELAY);
  };

  const handleBiometric = () => {
    Alert.alert('Biometric Login', 'Biometric authentication coming soon.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <Text style={styles.logoMark}>AEGIS</Text>
        <ConnectivityBadge status={connStatus} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Sign In</Text>
          <Text style={styles.subtitle}>Enter your credentials to continue</Text>

          <TextInput
            label="Employee ID"
            placeholder="e.g. 10042"
            value={employeeId}
            onChangeText={(text) => {
              setEmployeeId(text);
              setError(null);
            }}
            keyboardType="numeric"
            autoCapitalize="none"
          />

          <TextInput
            label="Password"
            placeholder="Enter password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setError(null);
            }}
            isPassword
          />

          <View style={styles.rememberRow}>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setRememberMe(!rememberMe)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <Ionicons name="checkmark" size={16} color="#FFF" />}
              </View>
              <Text style={styles.rememberText}>Remember Me</Text>
            </TouchableOpacity>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <PrimaryButton
            title="Sign In"
            onPress={handleLogin}
            disabled={!isFormValid}
            loading={loading}
            style={styles.submitButton}
          />

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or use biometric</Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity style={styles.biometricButton} onPress={handleBiometric}>
            <Ionicons name="finger-print-outline" size={48} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  logoMark: {
    color: theme.colors.primary,
    fontSize: theme.typography.h2.fontSize,
    fontWeight: theme.typography.h2.fontWeight,
    letterSpacing: 2,
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    justifyContent: 'center',
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.display.fontSize,
    fontWeight: theme.typography.display.fontWeight,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body.fontSize,
    marginBottom: theme.spacing.xl,
  },
  rememberRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.xl,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  rememberText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body.fontSize,
  },
  submitButton: {
    marginBottom: theme.spacing.xl,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.body.fontSize,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.divider,
  },
  dividerText: {
    color: theme.colors.textDisabled,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.typography.caption.fontSize,
  },
  biometricButton: {
    alignSelf: 'center',
    padding: theme.spacing.md,
  },
});
