import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import PrimaryButton from '@/components/PrimaryButton';
import SecondaryButton from '@/components/SecondaryButton';
import SyncStatusBanner from '@/components/SyncStatusBanner';
import GlassCard from '@/components/GlassCard';
import { theme } from '@/constants/theme';
import { storage } from '@/services/storage';
import { mockSync } from '@/services/mockSync';
import { AttendanceLog } from '@/types';

export default function SyncScreen() {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [bannerConfig, setBannerConfig] = useState({
    visible: false,
    status: 'success' as 'success' | 'error' | 'warning',
    message: '',
  });

  const rotationAnim = useRef(new Animated.Value(0)).current;

  const loadData = async () => {
    try {
      const allLogs = await storage.getAttendanceLogs();
      setLogs(allLogs);
    } catch (e) {
      console.error('Error loading logs for sync', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const pendingLogs = logs.filter(l => l.syncStatus !== 'synced');
  const syncedLogs = logs.filter(l => l.syncStatus === 'synced');
  
  const startRotation = () => {
    rotationAnim.setValue(0);
    Animated.loop(
      Animated.timing(rotationAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  };

  const stopRotation = () => {
    rotationAnim.stopAnimation();
  };

  const handleSync = async () => {
    if (pendingLogs.length === 0) return;

    setSyncing(true);
    startRotation();
    setBannerConfig({ visible: false, status: 'success', message: '' });

    try {
      // Mock sync call
      const result = await mockSync.syncRecords(pendingLogs);
      
      // Update local storage
      for (const log of pendingLogs) {
        await storage.updateLogSyncStatus(log.logId, 'synced', result.receiptId);
      }
      
      setBannerConfig({
        visible: true,
        status: 'success',
        message: `${result.accepted} records synced successfully`,
      });
      await loadData();
    } catch (error) {
      setBannerConfig({
        visible: true,
        status: 'error',
        message: 'Sync failed. Will retry later.',
      });
    } finally {
      setSyncing(false);
      stopRotation();
    }
  };

  const handlePurge = () => {
    Alert.alert(
      'Purge Synced Records',
      'Are you sure you want to delete all synced records from this device? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Purge', 
          style: 'destructive',
          onPress: async () => {
            try {
              const deleted = await storage.deleteSyncedLogs();
              setBannerConfig({
                visible: true,
                status: 'success',
                message: `${deleted} records purged from device`,
              });
              await loadData();
            } catch (e) {
              setBannerConfig({
                visible: true,
                status: 'error',
                message: 'Failed to purge records',
              });
            }
          }
        }
      ]
    );
  };

  const spin = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <SyncStatusBanner 
        {...bannerConfig} 
        onDismiss={() => setBannerConfig(prev => ({ ...prev, visible: false }))} 
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>Sync Records</Text>

        <View style={styles.progressRingContainer}>
          <View style={styles.ringWrapper}>
            <Animated.View style={[styles.ring, syncing && { transform: [{ rotate: spin }] }]} />
            <View style={styles.ringInner}>
              <Text style={styles.ringText}>{syncedLogs.length} / {logs.length}</Text>
              <Text style={styles.ringSubtext}>Synced</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <GlassCard style={styles.statCard}>
            <Ionicons name="time-outline" size={24} color={theme.colors.warning} />
            <Text style={styles.statValue}>{pendingLogs.length}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Ionicons name="cloud-upload-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.statValue}>{syncing ? '...' : '0'}</Text>
            <Text style={styles.statLabel}>Uploading</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Ionicons name="checkmark-circle-outline" size={24} color={theme.colors.success} />
            <Text style={styles.statValue}>{syncedLogs.length}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </GlassCard>
        </View>

        <PrimaryButton
          title={syncing ? 'Syncing...' : 'Sync Now'}
          onPress={handleSync}
          disabled={pendingLogs.length === 0 || syncing}
          loading={syncing}
          style={styles.syncBtn}
        />

        {syncedLogs.length > 0 && (
          <SecondaryButton
            title="Purge Synced Records"
            onPress={handlePurge}
            disabled={syncing}
            style={styles.purgeBtn}
            textStyle={styles.purgeText}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  header: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.h1.fontSize,
    fontWeight: theme.typography.h1.fontWeight,
    marginBottom: theme.spacing.xl,
  },
  progressRingContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  ringWrapper: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  ring: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 8,
    borderColor: theme.colors.primary,
    borderLeftColor: theme.colors.borderGlass, // Creates a partial ring look when not spinning
    borderBottomColor: theme.colors.borderGlass,
    position: 'absolute',
  },
  ringInner: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.display.fontSize,
    fontWeight: theme.typography.display.fontWeight,
  },
  ringSubtext: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body.fontSize,
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: theme.spacing.sm,
  },
  statValue: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.h2.fontSize,
    fontWeight: '700',
    marginVertical: 4,
  },
  statLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption.fontSize,
  },
  syncBtn: {
    marginBottom: theme.spacing.md,
  },
  purgeBtn: {
    borderColor: theme.colors.error,
  },
  purgeText: {
    color: theme.colors.error,
  },
});
