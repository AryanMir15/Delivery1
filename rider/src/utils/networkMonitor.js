import NetInfo from '@react-native-community/netinfo';
import { store } from '../store';
import { setOnlineStatus } from '../store/offlineSlice';

let unsubscribe = null;

export const startNetworkMonitoring = () => {
  unsubscribe = NetInfo.addEventListener(state => {
    const isOnline = state.isConnected && state.isInternetReachable;
    store.dispatch(setOnlineStatus(isOnline));
    
    if (isOnline) {
      console.log('📶 Back online - syncing pending actions');
      syncPendingActions();
    } else {
      console.log('📵 Offline mode activated');
    }
  });
};

export const stopNetworkMonitoring = () => {
  if (unsubscribe) {
    unsubscribe();
  }
};

export const checkNetworkStatus = async () => {
  const state = await NetInfo.fetch();
  return state.isConnected && state.isInternetReachable;
};

const syncPendingActions = async () => {
  const state = store.getState();
  const pendingActions = state.offline.pendingActions;
  
  for (const action of pendingActions) {
    try {
      console.log('Syncing action:', action.type);
      // Add your sync logic here
    } catch (error) {
      console.error('Failed to sync action:', error);
    }
  }
};
