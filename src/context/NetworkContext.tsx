import React, { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useAppSettings } from '@/src/tbStores/appSettingsStore/appSettingsStoreHooks';
import { isDevelopmentBuild } from '@/src/utils/environment';
import { isQuickBooksConnected as testQbIsConnected } from '@/src/utils/quickbooksAPI';
import { useAuth } from '@clerk/clerk-expo';

interface NetworkContextType {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  isQuickBooksConnected: boolean;
  isQuickBooksAccessible: boolean;
  networkType: string | null;
  setQuickBooksAccessible: (connected: boolean) => void;
}

const NetworkContext = createContext<NetworkContextType>({
  isConnected: true,
  isInternetReachable: null,
  networkType: null,
  isQuickBooksConnected: false,
  isQuickBooksAccessible: false,
  setQuickBooksAccessible: () => {},
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
  const [isQuickBooksAccessible, setIsQuickBooksAccessible] = useState<boolean>(false);
  const isQuickBooksAccessibleRef = useRef<boolean>(false);
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
      if (!auth.isLoaded || !auth.isSignedIn) {
        console.log('Skipping QuickBooks check: auth not ready/signed in');
        isQuickBooksAccessibleRef.current = false;
        setIsQuickBooksAccessible(false);
        return;
      }

      if (!orgId || !userId) {
        console.log('Skipping QuickBooks check: missing orgId/userId');
        isQuickBooksAccessibleRef.current = false;
        setIsQuickBooksAccessible(false);
        return;
      }

      if (!isConnected || isInternetReachable === false) {
        console.log('Skipping QuickBooks check: offline');
        isQuickBooksAccessibleRef.current = false;
        setIsQuickBooksAccessible(false);
        return;
      }

      if (!appSettings.id) {
        isQuickBooksAccessibleRef.current = false;
        return;
      }

      if (!appSettings.syncWithQuickBooks) {
        console.log('QuickBooks not accessible because syncWithQuickBooks is false');
        return;
      }

      try {
        const connected = await testQbIsConnected(orgId, userId, getToken);
        if (connected !== isQuickBooksAccessibleRef.current) {
          console.log(
            `QuickBooks accessibility status changed: ${connected ? 'QuickBooks is accessible ✅' : 'QuickBooks is not accessible ❌'}`,
          );
          isQuickBooksAccessibleRef.current = connected;
          setIsQuickBooksAccessible(connected);
        }
      } catch (error) {
        console.error('QuickBooks Connection Error. Error:', error);
        isQuickBooksAccessibleRef.current = false;
        setIsQuickBooksAccessible(false);
      }
    };

    void checkQbConnection();
  }, [
    auth.isLoaded,
    auth.isSignedIn,
    appSettings,
    orgId,
    userId,
    isConnected,
    isInternetReachable,
    getToken,
  ]);

  const setQuickBooksAccessible = useCallback((connected: boolean) => {
    isQuickBooksAccessibleRef.current = connected;
    setIsQuickBooksAccessible(connected);
  }, []);

  const value: NetworkContextType = {
    isConnected: debugForceOffline ? false : isConnected,
    isInternetReachable: debugForceOffline ? false : isInternetReachable,
    isQuickBooksConnected: appSettings.syncWithQuickBooks ?? false,
    isQuickBooksAccessible: debugForceOffline ? false : isQuickBooksAccessible,
    networkType,
    setQuickBooksAccessible,
  };

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
};
