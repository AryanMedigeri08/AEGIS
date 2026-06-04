import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '@/components/GlassCard';
import ConnectivityBadge from '@/components/ConnectivityBadge';
import SkeletonLoader from '@/components/SkeletonLoader';
import { theme } from '@/constants/theme';
import { storage } from '@/services/storage';
import { connectivity } from '@/services/connectivity';
import { Session, AttendanceLog, ConnectivityStatus } from '@/types';

export default function HomeScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [recentLogs, setRecentLogs] = useState<AttendanceLog[]>([]);
  const [connStatus, setConnStatus] = useState<ConnectivityStatus>('offline');
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const currentSession = await storage.getSession();
      setSession(currentSession);

      const logs = await storage.getAttendanceLogs();
      setRecentLogs(logs.slice(0, 3)); // Last 3 logs

      const pending = logs.filter(l => l.syncStatus !== 'synced').length;
      setPendingCount(pending);

      const status = await connectivity.getConnectivityStatus(pending);
      setConnStatus(status);
    } catch (e) {
      console.error('Error loading home data', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getSyncIcon = (status: AttendanceLog['syncStatus']) => {
    switch (status) {
      case 'synced': return { name: 'checkmark-circle' as const, color: theme.colors.success };
      case 'pending': return { name: 'time' as const, color: theme.colors.warning };
      case 'failed': return { name: 'alert-circle' as const, color: theme.colors.error };
      case 'dead': return { name: 'close-circle' as const, color: theme.colors.error };
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            {loading ? (
              <SkeletonLoader width={150} height={28} style={{ marginTop: 4 }} />
            ) : (
              <Text style={styles.name}>{session?.fullName?.split(' ')[0] || 'User'}</Text>
            )}
          </View>
          <ConnectivityBadge status={connStatus} pendingCount={pendingCount} />
        </View>

        <View style={styles.gridContainer}>
          <View style={styles.gridRow}>
            <GlassCard style={styles.gridCard} onPress={() => router.push('/liveness')}>
              <Ionicons name="shield-checkmark" size={32} color={theme.colors.primary} style={styles.cardIcon} />
              <Text style={styles.cardTitle}>Mark Attendance</Text>
              <Text style={styles.cardSubtitle}>Face verification</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textDisabled} style={styles.cardChevron} />
            </GlassCard>
            
            <GlassCard style={styles.gridCard} onPress={() => router.push('/register')}>
              <Ionicons name="person-add" size={32} color={theme.colors.primary} style={styles.cardIcon} />
              <Text style={styles.cardTitle}>Register Face</Text>
              <Text style={styles.cardSubtitle}>New employee</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textDisabled} style={styles.cardChevron} />
            </GlassCard>
          </View>
          
          <View style={styles.gridRow}>
            <GlassCard style={styles.gridCard} onPress={() => router.push('/(tabs)/sync')}>
              <Ionicons name="cloud-upload" size={32} color={theme.colors.primary} style={styles.cardIcon} />
              <Text style={styles.cardTitle}>Sync Records</Text>
              <Text style={styles.cardSubtitle}>{pendingCount} pending</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textDisabled} style={styles.cardChevron} />
            </GlassCard>
            
            <GlassCard style={styles.gridCard} onPress={() => router.push('/(tabs)/profile')}>
              <Ionicons name="settings" size={32} color={theme.colors.primary} style={styles.cardIcon} />
              <Text style={styles.cardTitle}>Settings</Text>
              <Text style={styles.cardSubtitle}>Preferences</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textDisabled} style={styles.cardChevron} />
            </GlassCard>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <Text style={styles.seeAll} onPress={() => router.push('/(tabs)/attendance')}>See All</Text>
        </View>

        <View style={styles.activityList}>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <GlassCard key={i} style={styles.activityCard}>
                <SkeletonLoader width="100%" height={24} style={{ marginBottom: 8 }} />
                <SkeletonLoader width="60%" height={16} />
              </GlassCard>
            ))
          ) : recentLogs.length > 0 ? (
            recentLogs.map((log) => {
              const syncIcon = getSyncIcon(log.syncStatus);
              return (
                <GlassCard key={log.logId} style={styles.activityCard}>
                  <View style={styles.activityRow}>
                    <View style={styles.activityInfo}>
                      <Text style={styles.activityName}>{log.fullName}</Text>
                      <Text style={styles.activityTime}>{formatTime(log.timestamp)}</Text>
                    </View>
                    <Ionicons name={syncIcon.name} size={24} color={syncIcon.color} />
                  </View>
                </GlassCard>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No recent activity.</Text>
              <Text style={styles.emptyStateSub}>Mark your first attendance.</Text>
            </View>
          )}
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xxxl,
  },
  greeting: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.h3.fontSize,
  },
  name: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.h1.fontSize,
    fontWeight: theme.typography.h1.fontWeight,
    marginTop: theme.spacing.xs,
  },
  gridContainer: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xxxl,
  },
  gridRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  gridCard: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  cardIcon: {
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    marginBottom: 4,
  },
  cardSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption.fontSize,
  },
  cardChevron: {
    position: 'absolute',
    right: theme.spacing.md,
    top: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.h2.fontSize,
    fontWeight: theme.typography.h2.fontWeight,
  },
  seeAll: {
    color: theme.colors.primary,
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
  },
  activityList: {
    gap: theme.spacing.sm,
  },
  activityCard: {
    padding: theme.spacing.md,
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body.fontSize,
    fontWeight: '500',
    marginBottom: 2,
  },
  activityTime: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption.fontSize,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyStateText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body.fontSize,
    marginBottom: 4,
  },
  emptyStateSub: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption.fontSize,
  },
});
