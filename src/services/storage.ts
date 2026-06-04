import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { User, AttendanceLog, Session } from '@/types';
import { config } from '@/constants/config';

class StorageService {
  async saveUser(user: User): Promise<void> {
    try {
      const users = await this.getUsers();
      const updatedUsers = [...users, user];
      await AsyncStorage.setItem(config.STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  }

  async getUsers(): Promise<User[]> {
    try {
      const data = await AsyncStorage.getItem(config.STORAGE_KEYS.USERS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }

  async getUserByEmployeeId(id: string): Promise<User | null> {
    const users = await this.getUsers();
    return users.find(u => u.employeeId === id) || null;
  }

  async saveAttendanceLog(log: AttendanceLog): Promise<void> {
    try {
      const logs = await this.getAttendanceLogs();
      const updatedLogs = [log, ...logs]; // Prepend new log
      await AsyncStorage.setItem(config.STORAGE_KEYS.ATTENDANCE_LOGS, JSON.stringify(updatedLogs));
    } catch (error) {
      console.error('Error saving attendance log:', error);
      throw error;
    }
  }

  async getAttendanceLogs(): Promise<AttendanceLog[]> {
    try {
      const data = await AsyncStorage.getItem(config.STORAGE_KEYS.ATTENDANCE_LOGS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting attendance logs:', error);
      return [];
    }
  }

  async updateLogSyncStatus(
    logId: string,
    status: AttendanceLog['syncStatus'],
    receiptId?: string
  ): Promise<void> {
    try {
      const logs = await this.getAttendanceLogs();
      const updatedLogs = logs.map(log => {
        if (log.logId === logId) {
          return {
            ...log,
            syncStatus: status,
            syncedAt: status === 'synced' ? Date.now() : log.syncedAt,
            receiptId: receiptId || log.receiptId,
          };
        }
        return log;
      });
      await AsyncStorage.setItem(config.STORAGE_KEYS.ATTENDANCE_LOGS, JSON.stringify(updatedLogs));
    } catch (error) {
      console.error('Error updating sync status:', error);
      throw error;
    }
  }

  async deleteSyncedLogs(): Promise<number> {
    try {
      const logs = await this.getAttendanceLogs();
      const initialCount = logs.length;
      const pendingLogs = logs.filter(log => log.syncStatus !== 'synced');
      await AsyncStorage.setItem(config.STORAGE_KEYS.ATTENDANCE_LOGS, JSON.stringify(pendingLogs));
      return initialCount - pendingLogs.length;
    } catch (error) {
      console.error('Error deleting synced logs:', error);
      throw error;
    }
  }

  async getDeviceId(): Promise<string> {
    try {
      let deviceId = await AsyncStorage.getItem(config.STORAGE_KEYS.DEVICE_ID);
      if (!deviceId) {
        deviceId = Crypto.randomUUID();
        await AsyncStorage.setItem(config.STORAGE_KEYS.DEVICE_ID, deviceId);
      }
      return deviceId;
    } catch (error) {
      console.error('Error getting/generating device ID:', error);
      return Crypto.randomUUID(); // Fallback to a new UUID if storage fails
    }
  }

  async saveSession(session: Session): Promise<void> {
    try {
      await AsyncStorage.setItem(config.STORAGE_KEYS.SESSION, JSON.stringify(session));
    } catch (error) {
      console.error('Error saving session:', error);
      throw error;
    }
  }

  async getSession(): Promise<Session | null> {
    try {
      const data = await AsyncStorage.getItem(config.STORAGE_KEYS.SESSION);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  async clearSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem(config.STORAGE_KEYS.SESSION);
    } catch (error) {
      console.error('Error clearing session:', error);
      throw error;
    }
  }

  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        config.STORAGE_KEYS.USERS,
        config.STORAGE_KEYS.ATTENDANCE_LOGS,
        config.STORAGE_KEYS.SESSION,
      ]);
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }
}

export const storage = new StorageService();
