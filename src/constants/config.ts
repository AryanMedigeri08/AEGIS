export const config = {
  APP_VERSION: '1.0.0',
  APP_NAME: 'AEGIS',
  HACKATHON: 'Hackathon 7.0',
  
  // Storage Keys
  STORAGE_KEYS: {
    USERS: '@aegis_users',
    ATTENDANCE_LOGS: '@aegis_attendance_logs',
    SESSION: '@aegis_session',
    DEVICE_ID: '@aegis_device_id',
  },

  // Timing constants (in ms)
  TIMING: {
    LIVENESS_CHALLENGE_TIMEOUT: 8000,
    LIVENESS_STABLE_FACE: 1000,
    MOCK_NETWORK_DELAY: 2000,
    MOCK_AUTH_DELAY: 800,
    MOCK_FACE_EMBEDDING_DELAY: 400,
    MOCK_FACE_COMPARE_DELAY: 600,
  }
};
