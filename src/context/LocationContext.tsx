import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import * as Location from 'expo-location'; // Import the Location namespace from expo-location

// Define the context and its types
interface LocationContextType {
  // Define the context and its types
  locationHost: Location.LocationObject | null;
}

// Create the context
const LocationContext = createContext<LocationContextType>({
  locationHost: null,
});

// Define the provider component
interface LocationHostProviderProps {
  children: ReactNode;
}

export const LocationHostProvider: React.FC<LocationHostProviderProps> = ({ children }) => {
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean>(false);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);

  useEffect(() => {
    const requestLocationPermission = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }
      // Fetch the current location after permission is granted
      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location);
      setHasLocationPermission(true);
    };

    requestLocationPermission();
  }, [hasLocationPermission]);

  return (
    <LocationContext.Provider value={{ locationHost: currentLocation }}>{children}</LocationContext.Provider>
  );
};

// Define the custom hook to use the database
export const useLocationServices = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocationServices must be used within a LocationProvider');
  }
  return context;
};
