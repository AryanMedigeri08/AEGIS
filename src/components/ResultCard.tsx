import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from './GlassCard';
import PrimaryButton from './PrimaryButton';
import { theme } from '@/constants/theme';

interface ResultCardProps {
  variant: 'success' | 'failure';
  title?: string; // override default title
  subtitle?: string; // override default subtitle
  employeeName?: string;
  employeeId?: string;
  confidence?: number;
  timestamp?: number;
  onPrimaryAction: () => void;
  primaryActionLabel: string;
  onSecondaryAction?: () => void;
  secondaryActionLabel?: string;
}

export default function ResultCard({
  variant,
  title,
  subtitle,
  employeeName,
  employeeId,
  confidence,
  timestamp,
  onPrimaryAction,
  primaryActionLabel,
  onSecondaryAction,
  secondaryActionLabel,
}: ResultCardProps) {
  const isSuccess = variant === 'success';
  const defaultTitle = isSuccess ? 'Verification Successful' : 'Face Not Recognised';
  const defaultSubtitle = isSuccess ? '' : 'Please contact your administrator.';

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <GlassCard style={styles.card}>
      <View style={styles.iconContainer}>
        <Ionicons
          name={isSuccess ? 'checkmark-circle' : 'close-circle'}
          size={80}
          color={isSuccess ? theme.colors.success : theme.colors.error}
        />
      </View>

      <Text style={styles.title}>{title || defaultTitle}</Text>
      
      {(!isSuccess || subtitle) && (
        <Text style={styles.subtitle}>{subtitle || defaultSubtitle}</Text>
      )}

      {isSuccess && employeeName && (
        <View style={styles.detailsContainer}>
          <Text style={styles.name}>{employeeName}</Text>
          {employeeId && <Text style={styles.monoText}>{employeeId}</Text>}
          
          <View style={styles.statsRow}>
            {confidence !== undefined && (
              <Text style={styles.statText}>Confidence: {(confidence * 100).toFixed(0)}%</Text>
            )}
            {timestamp && (
              <Text style={styles.statText}>{formatTime(timestamp)}</Text>
            )}
          </View>
        </View>
      )}

      <View style={styles.actionContainer}>
        <PrimaryButton
          title={primaryActionLabel}
          onPress={onPrimaryAction}
          style={isSuccess ? {} : styles.errorButton}
        />
        
        {onSecondaryAction && secondaryActionLabel && (
          <Text style={styles.cancelLink} onPress={onSecondaryAction}>
            {secondaryActionLabel}
          </Text>
        )}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.h1.fontSize,
    fontWeight: theme.typography.h1.fontWeight,
    letterSpacing: theme.typography.h1.letterSpacing,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body.fontSize,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  detailsContainer: {
    alignItems: 'center',
    width: '100%',
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderGlass,
    marginBottom: theme.spacing.lg,
  },
  name: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.h2.fontSize,
    fontWeight: theme.typography.h2.fontWeight,
    marginBottom: theme.spacing.xs,
  },
  monoText: {
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.mono.fontFamily,
    fontSize: theme.typography.mono.fontSize,
    marginBottom: theme.spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: theme.spacing.md,
  },
  statText: {
    color: theme.colors.textDisabled,
    fontSize: theme.typography.caption.fontSize,
  },
  actionContainer: {
    width: '100%',
    gap: theme.spacing.md,
  },
  errorButton: {
    backgroundColor: theme.colors.error,
  },
  cancelLink: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body.fontSize,
    textAlign: 'center',
    padding: theme.spacing.sm,
  },
});
