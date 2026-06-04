import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '@/components/GlassCard';
import { theme } from '@/constants/theme';
import { storage } from '@/services/storage';
import { AttendanceLog } from '@/types';

export default function AttendanceScreen() {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const allLogs = await storage.getAttendanceLogs();
      setLogs(allLogs);
    } catch (e) {
      console.error('Error loading attendance', e);
    } finally {
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

  const getStats = () => {
    const present = logs.length;
    const pending = logs.filter(l => l.syncStatus !== 'synced').length;
    return { present, pending };
  };

  const getMonthName = () => {
    return new Date().toLocaleDateString('en-US', { month: 'short' });
  };

  const stats = getStats();

  const renderItem = ({ item }: { item: AttendanceLog }) => {
    const date = new Date(item.timestamp);
    const dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    const dayStr = date.toLocaleDateString('en-GB', { weekday: 'long' });
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let statusColor, statusText;
    switch (item.syncStatus) {
      case 'synced':
        statusColor = theme.colors.success;
        statusText = 'Synced';
        break;
      case 'pending':
        statusColor = theme.colors.warning;
        statusText = 'Pending';
        break;
      case 'failed':
      case 'dead':
        statusColor = theme.colors.error;
        statusText = 'Failed';
        break;
      default:
        statusColor = theme.colors.textDisabled;
        statusText = 'Unknown';
    }

    return (
      <GlassCard style={styles.logCard}>
        <View style={styles.logRow}>
          <View style={styles.dateCol}>
            <Text style={styles.dateText}>{dateStr}</Text>
            <Text style={styles.dayText}>{dayStr}</Text>
          </View>
          
          <View style={styles.infoCol}>
            <Text style={styles.nameText}>{item.fullName}</Text>
            <Text style={styles.timeText}>Verified at {timeStr}</Text>
          </View>

          <View style={[styles.statusPill, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
        </View>
      </GlassCard>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Text style={styles.header}>Attendance History</Text>
      
      <View style={styles.summaryRow}>
        <GlassCard style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>This Month</Text>
          <Text style={styles.summaryValue}>{getMonthName()}</Text>
        </GlassCard>
        <GlassCard style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Present</Text>
          <Text style={styles.summaryValue}>{stats.present}</Text>
        </GlassCard>
        <GlassCard style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Pending Sync</Text>
          <Text style={[styles.summaryValue, { color: theme.colors.warning }]}>{stats.pending}</Text>
        </GlassCard>
      </View>

      <FlatList
        data={logs}
        keyExtractor={(item) => item.logId}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyText}>No attendance records yet.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.h1.fontSize,
    fontWeight: theme.typography.h1.fontWeight,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  summaryCard: {
    flex: 1,
    padding: theme.spacing.sm,
    alignItems: 'center',
  },
  summaryLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption.fontSize,
    marginBottom: 4,
    textAlign: 'center',
  },
  summaryValue: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.h2.fontSize,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 100, // Space for tab bar
    gap: theme.spacing.md,
  },
  logCard: {
    padding: theme.spacing.sm,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateCol: {
    width: 70,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: theme.colors.borderGlass,
    paddingRight: theme.spacing.sm,
    marginRight: theme.spacing.sm,
  },
  dateText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body.fontSize,
    fontWeight: '700',
  },
  dayText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption.fontSize,
  },
  infoCol: {
    flex: 1,
  },
  nameText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    marginBottom: 2,
  },
  timeText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption.fontSize,
  },
  statusPill: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  statusText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: theme.spacing.xxxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body.fontSize,
  },
});
