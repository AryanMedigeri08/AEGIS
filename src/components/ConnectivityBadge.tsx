import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '@/constants/theme';
import { ConnectivityStatus } from '@/types';

interface ConnectivityBadgeProps {
  status: ConnectivityStatus;
  pendingCount?: number;
}

export default function ConnectivityBadge({ status, pendingCount }: ConnectivityBadgeProps) {
  const getDotColor = () => {
    switch (status) {
      case 'online': return theme.colors.success;
      case 'offline': return theme.colors.error;
      case 'sync_pending': return theme.colors.warning;
      default: return theme.colors.textDisabled;
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'online': return 'Online';
      case 'offline': return 'Offline';
      case 'sync_pending': return `${pendingCount || 0} Pending`;
      default: return 'Unknown';
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: getDotColor() }]} />
      <Text style={styles.label}>{getLabel()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  label: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: theme.typography.caption.fontWeight,
  },
});
