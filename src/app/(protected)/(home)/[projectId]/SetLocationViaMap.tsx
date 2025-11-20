import React, { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { LocationPicker } from '@/src/components/MapLocation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProject, useUpdateProjectCallback } from '@/src/tbStores/listOfProjects/ListOfProjectsStore';
import { useColors } from '@/src/context/ColorsContext';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, StyleSheet } from 'react-native';
export interface CoordinateLocation {
  latitude: number;
  longitude: number;
}

const SetLocationViaMap = () => {
  const { projectId } = useLocalSearchParams<{ projectId: string; projectName: string }>();
  const router = useRouter();
  const colors = useColors();
  const [currentLocation, setCurrentLocation] = useState<CoordinateLocation | null>(null);
  const [deviceLocation, setDeviceLocation] = useState<CoordinateLocation | null>(null);
  const currentProject = useProject(projectId);

  const fetchCurrentDeviceLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location was denied');
        return;
      }

      // Get current device location
      const location = await Location.getCurrentPositionAsync({});
      setDeviceLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Could not get current device location');
    }
  };

  useEffect(() => {
    fetchCurrentDeviceLocation();
  }, []);

  useEffect(() => {
    if (currentProject) {
      if (currentProject.latitude && currentProject.longitude) {
        setCurrentLocation({
          latitude: currentProject.latitude,
          longitude: currentProject.longitude,
        });
      } else {
        if (deviceLocation) {
          setCurrentLocation({
            latitude: deviceLocation.latitude,
            longitude: deviceLocation.longitude,
          });
        }
      }
    }
  }, [currentProject, deviceLocation]);

  const updateProject = useUpdateProjectCallback();

  const handleLocationSelected = useCallback(
    (latitude: number, longitude: number) => {
      if (projectId && updateProject) {
        const result = updateProject(projectId, { latitude, longitude });
        if (result.status != 'Success') {
          Alert.alert('Error updating project location', `Error updating project location - ${result.msg}`);
        }
        router.back();
      }
    },
    [currentProject, projectId, updateProject, router],
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Set Project Location', headerShown: true }} />

      <SafeAreaView
        edges={['right', 'bottom', 'left']}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        {currentProject && currentLocation && (
          <LocationPicker
            onLocationSelected={handleLocationSelected}
            onClose={() => router.back()}
            projectName={currentProject.name}
            projectLocation={currentLocation}
            deviceLocation={deviceLocation}
          />
        )}
      </SafeAreaView>
    </>
  );
};

export default SetLocationViaMap;
const styles = StyleSheet.create({
  modalBackground: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  container: {
    flex: 1,
    justifyContent: 'flex-start', // Align items at the top vertically
    alignItems: 'center', // Center horizontally
    width: '100%',
  },
  input: {
    borderWidth: 1,
    alignContent: 'stretch',
    justifyContent: 'center',
    borderRadius: 5,
  },
  dateInput: {
    borderWidth: 1,
    alignContent: 'stretch',
    justifyContent: 'center',
    borderRadius: 5,
    paddingHorizontal: 8,
    height: 40,
    paddingVertical: 0,
  },
  gpsButtonContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  gpsButton: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10, // Rounded edges
  },
  gpsButtonLeft: {
    marginRight: 10, // Add margin between the two buttons
  },
  gpsButtonRight: {
    marginLeft: 10, // Add margin between the two buttons
  },
  gpsButtonText: {
    fontSize: 16,
    fontWeight: 'semibold',
  },
  saveButtonRow: {
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  saveButton: {
    flex: 1,
  },
  cancelButton: {
    flex: 1,
  },
});
