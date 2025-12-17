import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useAppSettings } from '@/src/tbStores/appSettingsStore/appSettingsStoreHooks';

interface NetworkContextType {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  networkType: string | null;
}

const NetworkContext = createContext<NetworkContextType>({
  isConnected: true,
  isInternetReachable: null,
  networkType: null,
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

  // Check if we're in a development build and debug offline mode is enabled
  const isDevelopment = (global as any).__DEV__ === true;
  const debugForceOffline = isDevelopment && appSettings.debugForceOffline;

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      console.log('Network state changed:', {
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      });

      setIsConnected(state.isConnected ?? false);
      setIsInternetReachable(state.isInternetReachable ?? null);
      setNetworkType(state.type);
    });

    // Fetch initial network state
    NetInfo.fetch().then((state: NetInfoState) => {
      console.log('Initial network state:', {
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      });

      setIsConnected(state.isConnected ?? false);
      setIsInternetReachable(state.isInternetReachable ?? null);
      setNetworkType(state.type);
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  const value: NetworkContextType = {
    isConnected: debugForceOffline ? false : isConnected,
    isInternetReachable: debugForceOffline ? false : isInternetReachable,
    networkType,
  };

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
};
