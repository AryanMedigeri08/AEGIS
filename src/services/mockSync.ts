import { AttendanceLog } from '@/types';
import { config } from '@/constants/config';
import * as Crypto from 'expo-crypto';

export interface SyncResult {
  success: boolean;
  receiptId: string;
  accepted: number;
  failed: number;
}

class MockSyncService {
  async syncRecords(records: AttendanceLog[]): Promise<SyncResult> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const isSuccess = Math.random() > 0.15; // 85% success rate

        if (isSuccess) {
          resolve({
            success: true,
            receiptId: Crypto.randomUUID(),
            accepted: records.length,
            failed: 0,
          });
        } else {
          reject(new Error('Connection timed out. Server unreachable.'));
        }
      }, config.TIMING.MOCK_NETWORK_DELAY);
    });
  }
}

export const mockSync = new MockSyncService();
