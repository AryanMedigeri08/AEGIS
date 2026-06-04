export interface User {
  userId: string;
  employeeId: string;
  fullName: string;
  department?: string;
  enrolledAt: number;
  embedding: number[];
  embeddingVersion: number;
  isActive: boolean;
}

export interface AttendanceLog {
  logId: string;
  userId: string;
  employeeId: string;
  fullName: string;
  timestamp: number;
  confidence: number;
  livenessScore: number;
  latitude: number | null;
  longitude: number | null;
  deviceId: string;
  syncStatus: 'pending' | 'synced' | 'failed' | 'dead';
  syncedAt: number | null;
  receiptId: string | null;
}

export interface AuthResult {
  matched: boolean;
  userId: string | null;
  employeeId: string | null;
  fullName: string | null;
  confidence: number;
  livenessScore: number;
  timestamp: number;
  logId: string;
}

export interface Session {
  employeeId: string;
  fullName: string;
  department?: string;
  loggedInAt: number;
}

export type LivenessChallenge = 'BLINK' | 'SMILE' | 'HEAD_LEFT' | 'HEAD_RIGHT';

export type LivenessState =
  | 'IDLE'
  | 'FACE_DETECTING'
  | 'CHALLENGE_ACTIVE'
  | 'CHALLENGE_PASSED'
  | 'FASNET_CHECK'
  | 'RESULT_SUCCESS'
  | 'RESULT_FAILURE';

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export type ConnectivityStatus = 'online' | 'offline' | 'sync_pending';
