import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Switch, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import PrimaryButton from '@/components/PrimaryButton';
import GlassCard from '@/components/GlassCard';
import { theme } from '@/constants/theme';
import { storage } from '@/services/storage';
import { config } from '@/constants/config';
import { Session } from '@/types';

export default function ProfileScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [autoSync, setAutoSync] = useState(false);

  useFocusEffect(
    useCallback(() => {
      storage.getSession().then(setSession);
    }, [])
  );

  const handleClearData = () => {
    Alert.alert(
      'Clear Local Data',
      'This will delete all local attendance logs and cached users. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: async () => {
            await storage.clearAllData();
            router.replace('/login');
          }
        }
      ]
    );
  };

  const handleExport = () => {
    Alert.alert('Export Logs', 'Export functionality coming soon.');
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            await storage.clearSession();
            router.replace('/login');
          }
        }
      ]
    );
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>Profile</Text>

        <GlassCard style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(session?.fullName)}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{session?.fullName || 'User'}</Text>
            <Text style={styles.monoText}>{session?.employeeId || 'ID: Unknown'}</Text>
            {session?.department && (
              <Text style={styles.deptText}>{session.department}</Text>
            )}
          </View>
        </GlassCard>

        <Text style={styles.sectionTitle}>PREFERENCES</Text>
        <GlassCard style={styles.sectionCard}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="sync" size={20} color={theme.colors.textSecondary} style={styles.rowIcon} />
              <Text style={styles.rowText}>Auto Sync</Text>
            </View>
            <Switch
              value={autoSync}
              onValueChange={setAutoSync}
              trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
              thumbColor={autoSync ? theme.colors.primary : '#f4f3f4'}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="moon" size={20} color={theme.colors.textSecondary} style={styles.rowIcon} />
              <Text style={styles.rowText}>Dark Mode</Text>
            </View>
            <Ionicons name="lock-closed" size={16} color={theme.colors.textDisabled} />
          </View>
        </GlassCard>

        <Text style={styles.sectionTitle}>DATA</Text>
        <GlassCard style={styles.sectionCard}>
          <TouchableOpacity style={styles.row} onPress={handleClearData} activeOpacity={0.7}>
            <View style={styles.rowLeft}>
              <Ionicons name="trash" size={20} color={theme.colors.error} style={styles.rowIcon} />
              <Text style={[styles.rowText, { color: theme.colors.error }]}>Clear Local Data</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textDisabled} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row} onPress={handleExport} activeOpacity={0.7}>
            <View style={styles.rowLeft}>
              <Ionicons name="download" size={20} color={theme.colors.textSecondary} style={styles.rowIcon} />
              <Text style={styles.rowText}>Export Logs</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textDisabled} />
          </TouchableOpacity>
        </GlassCard>

        <Text style={styles.sectionTitle}>ABOUT</Text>
        <GlassCard style={styles.sectionCard}>
          <View style={styles.row}>
            <Text style={styles.rowText}>App Version</Text>
            <Text style={styles.valueText}>{config.APP_NAME} v{config.APP_VERSION}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowText}>Hackathon</Text>
            <Text style={styles.valueText}>{config.HACKATHON}</Text>
          </View>
        </GlassCard>

        <PrimaryButton
          title="Sign Out"
          onPress={handleSignOut}
          style={styles.signOutBtn}
        />
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
    paddingBottom: 40,
  },
  header: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.h1.fontSize,
    fontWeight: theme.typography.h1.fontWeight,
    marginBottom: theme.spacing.lg,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  avatarText: {
    color: '#FFF',
    fontSize: theme.typography.h1.fontSize,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.h1.fontSize,
    fontWeight: theme.typography.h1.fontWeight,
    marginBottom: 2,
  },
  monoText: {
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.mono.fontFamily,
    fontSize: theme.typography.mono.fontSize,
    marginBottom: 2,
  },
  deptText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption.fontSize,
  },
  sectionTitle: {
    color: theme.colors.textDisabled,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
    marginLeft: 4,
  },
  sectionCard: {
    padding: 0,
    marginBottom: theme.spacing.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowIcon: {
    marginRight: theme.spacing.md,
  },
  rowText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body.fontSize,
  },
  valueText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body.fontSize,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.borderGlass,
    marginLeft: 48,
  },
  signOutBtn: {
    backgroundColor: theme.colors.error,
    marginTop: theme.spacing.md,
  },
});
