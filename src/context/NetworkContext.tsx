import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useAppSettings } from '@/src/tbStores/appSettingsStore/appSettingsStoreHooks';
import { isDevelopmentBuild } from '@/src/utils/environment';
import { isQuickBooksConnected as testQbIsConnected } from '@/src/utils/quickbooksAPI';
import { useAuth } from '@clerk/clerk-expo';

interface NetworkContextType {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  isConnectedToQuickBooks: boolean;
  networkType: string | null;
  setQuickBooksConnected: (connected: boolean) => void;
}

const NetworkContext = createContext<NetworkContextType>({
  isConnected: true,
  isInternetReachable: null,
  networkType: null,
  isConnectedToQuickBooks: false,
  setQuickBooksConnected: () => {},
});

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};

interface NetworkProviderProps {
  children: ReactNode;
}

export const NetworkProvider: React.FC<NetworkProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(null);
  const [networkType, setNetworkType] = useState<string | null>(null);
  const appSettings = useAppSettings();
  const [isConnectedToQuickBooks, setIsConnectedToQuickBooks] = useState<boolean>(false);
  const auth = useAuth();
  const lastNetworkStateRef = useRef<{
    isConnected: boolean;
    isInternetReachable: boolean | null;
    type: string | null;
  } | null>(null);

  const { userId, orgId, getToken } = auth;

  // Check if we're in a development build and debug offline mode is enabled
  const debugForceOffline = isDevelopmentBuild() && appSettings.debugForceOffline;

  useEffect(() => {
    if (debugForceOffline) {
      console.log('🔴 Debug offline mode is ENABLED - Network connectivity is being simulated as offline');
    }
  }, [debugForceOffline]);

  useEffect(() => {
    const handleNetworkState = (state: NetInfoState, logLabel: string) => {
      const nextState = {
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? null,
        type: state.type,
      };

      const lastState = lastNetworkStateRef.current;
      const hasChanged =
        !lastState ||
        lastState.isConnected !== nextState.isConnected ||
        lastState.isInternetReachable !== nextState.isInternetReachable ||
        lastState.type !== nextState.type;

      if (!hasChanged) {
        return;
      }

      lastNetworkStateRef.current = nextState;
      console.log(logLabel, nextState);
      setIsConnected(nextState.isConnected);
      setIsInternetReachable(nextState.isInternetReachable);
      setNetworkType(nextState.type);
    };

    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      handleNetworkState(state, 'Network state changed:');
    });

    // Fetch initial network state
    NetInfo.fetch().then((state: NetInfoState) => {
      handleNetworkState(state, 'Initial network state:');
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const checkQbConnection = async () => {
      if (orgId && userId && isConnected && isInternetReachable && appSettings.syncWithQuickBooks) {
        const connected = await testQbIsConnected(orgId, userId, getToken);
        setIsConnectedToQuickBooks(connected);
      } else {
        setIsConnectedToQuickBooks(false);
      }
    };
    checkQbConnection();
  }, [appSettings.syncWithQuickBooks, orgId, userId, isConnected, isInternetReachable, getToken]);

  const setQuickBooksConnected = (connected: boolean) => {
    setIsConnectedToQuickBooks(connected);
  };

  const value: NetworkContextType = {
    isConnected: debugForceOffline ? false : isConnected,
    isInternetReachable: debugForceOffline ? false : isInternetReachable,
    isConnectedToQuickBooks: debugForceOffline ? false : isConnectedToQuickBooks,
    networkType,
    setQuickBooksConnected,
  };

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
};
