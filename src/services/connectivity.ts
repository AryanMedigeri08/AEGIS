import { ConnectivityStatus } from '@/types';
import NetInfo from '@react-native-community/netinfo';

class ConnectivityService {
  async getConnectivityStatus(pendingCount: number): Promise<ConnectivityStatus> {
    try {
      const state = await NetInfo.fetch();
      const isOnline = state.isConnected && state.isInternetReachable !== false;

      if (isOnline) {
        return pendingCount > 0 ? 'sync_pending' : 'online';
      }
      return 'offline';
    } catch (error) {
      console.error('Error fetching connectivity state:', error);
      return 'offline'; // Assume offline on error
    }
  }

  // Helper to quickly check raw online status
  async isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return !!(state.isConnected && state.isInternetReachable !== false);
  }
}

export const connectivity = new ConnectivityService();
