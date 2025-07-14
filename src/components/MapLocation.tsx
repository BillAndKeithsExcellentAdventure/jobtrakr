import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Alert, Dimensions, Modal, TouchableOpacity } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Text } from './Themed';
import { ActionButton } from './ActionButton';
import { useColors } from '@/src/context/ColorsContext';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

interface LocationPickerProps {
  visible: boolean;
  onLocationSelected: (latitude: number, longitude: number) => void;
  onClose: () => void;
  initialLatitude?: number;
  initialLongitude?: number;
  projectName?: string;
}

interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

const { width, height } = Dimensions.get('window');

export const LocationPicker: React.FC<LocationPickerProps> = ({
  visible,
  onLocationSelected,
  onClose,
  initialLatitude,
  initialLongitude,
  projectName,
}) => {
  const colors = useColors();
  const [currentLocation, setCurrentLocation] = useState<LocationCoordinates | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationCoordinates | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Convert feet to approximate latitude/longitude delta
  // 1 degree latitude ≈ 364,000 feet
  // 1 degree longitude ≈ 288,000 feet (varies by latitude)
  const feetToLatDelta = (feet: number) => feet / 364000;
  const feetToLngDelta = (feet: number, latitude: number) =>
    feet / (288000 * Math.cos((latitude * Math.PI) / 180));

  useEffect(() => {
    if (visible) {
      getCurrentLocation();
    }
  }, [visible]);

  const getCurrentLocation = async () => {
    setIsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location was denied');
        setIsLoading(false);
        return;
      }

      let coords: LocationCoordinates;

      if (initialLatitude && initialLongitude) {
        // Use provided initial coordinates
        coords = {
          latitude: initialLatitude,
          longitude: initialLongitude,
        };
        setSelectedLocation(coords);
      } else {
        // Get current device location
        const location = await Location.getCurrentPositionAsync({});
        coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        setCurrentLocation(coords);
      }

      // Set initial region with 500x500 ft view
      const latDelta = feetToLatDelta(500);
      const lngDelta = feetToLngDelta(500, coords.latitude);

      setRegion({
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: latDelta,
        longitudeDelta: lngDelta,
      });

      setIsLoading(false);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Could not get current location');
      setIsLoading(false);
    }
  };

  // Fix the event handler typing for expo-maps
  const handleMapPress = useCallback((event: { nativeEvent: { coordinate: LocationCoordinates } }) => {
    const { coordinate } = event.nativeEvent;
    setSelectedLocation(coordinate);
  }, []);

  const handleSaveLocation = useCallback(() => {
    if (selectedLocation) {
      onLocationSelected(selectedLocation.latitude, selectedLocation.longitude);
      Alert.alert(
        'Location Saved',
        `Coordinates saved for ${projectName || 'project'}:\nLatitude: ${selectedLocation.latitude.toFixed(
          6,
        )}\nLongitude: ${selectedLocation.longitude.toFixed(6)}`,
        [{ text: 'OK', onPress: onClose }],
      );
    } else {
      Alert.alert('No Location Selected', 'Please tap on the map to select a location');
    }
  }, [selectedLocation, onLocationSelected, projectName, onClose]);

  const handleResetToCurrentLocation = useCallback(() => {
    if (currentLocation) {
      const latDelta = feetToLatDelta(500);
      const lngDelta = feetToLngDelta(500, currentLocation.latitude);

      setRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: latDelta,
        longitudeDelta: lngDelta,
      });
      setSelectedLocation(null);
    }
  }, [currentLocation]);

  const handleClose = useCallback(() => {
    setSelectedLocation(null);
    setRegion(null);
    setIsLoading(true);
    onClose();
  }, [onClose]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
          <Text text="Loading map..." txtSize="subtitle" />
        </View>
      );
    }

    if (!region) {
      return (
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
          <Text text="Unable to load map" txtSize="subtitle" />
          <ActionButton title="Retry" type="action" onPress={getCurrentLocation} style={styles.retryButton} />
        </View>
      );
    }

    return (
      <>
        <View style={styles.headerContainer}>
          <Text text={`Select Location${projectName ? ` for ${projectName}` : ''}`} txtSize="title" />
          <Text
            text="Tap on the map to select a location. Use pinch and drag to adjust the view."
            txtSize="caption"
            style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 5 }}
          />
        </View>

        <MapView
          style={styles.map}
          initialRegion={region}
          onPress={handleMapPress}
          showsUserLocation={!!currentLocation}
          showsMyLocationButton={false}
          mapType="standard"
          provider={PROVIDER_GOOGLE}
        >
          {selectedLocation && (
            <Marker
              coordinate={selectedLocation}
              title="Selected Location"
              description={`${selectedLocation.latitude.toFixed(6)}, ${selectedLocation.longitude.toFixed(
                6,
              )}`}
            />
          )}
        </MapView>

        <View style={styles.infoContainer}>
          {selectedLocation ? (
            <View>
              <Text text="Selected Coordinates:" txtSize="subtitle" />
              <Text
                text={`Latitude: ${selectedLocation.latitude.toFixed(6)}`}
                style={{ color: colors.textSecondary }}
              />
              <Text
                text={`Longitude: ${selectedLocation.longitude.toFixed(6)}`}
                style={{ color: colors.textSecondary }}
              />
            </View>
          ) : (
            <Text
              text="Tap on the map to select a location"
              txtSize="subtitle"
              style={{ color: colors.textSecondary, textAlign: 'center' }}
            />
          )}
        </View>

        <View style={styles.buttonContainer}>
          {currentLocation && (
            <ActionButton
              title="Reset to Current Location"
              type="secondary"
              onPress={handleResetToCurrentLocation}
              style={styles.resetButton}
            />
          )}
          <ActionButton
            title="Save Location"
            type={selectedLocation ? 'action' : 'disabled'}
            onPress={handleSaveLocation}
            style={styles.saveButton}
          />
        </View>
      </>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <SafeAreaView
        edges={['top', 'right', 'bottom', 'left']}
        style={[styles.modalContainer, { backgroundColor: colors.background }]}
      >
        <View
          style={[
            styles.modalHeader,
            { backgroundColor: colors.background, borderBottomColor: colors.border },
          ]}
        >
          <View style={styles.headerLeft} />
          <Text text="Select Location" txtSize="title" />
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={[styles.container, { backgroundColor: colors.background }]}>{renderContent()}</View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    width: 24,
  },
  closeButton: {
    padding: 4,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  map: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  infoContainer: {
    padding: 16,
    marginTop: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    minHeight: 80,
    justifyContent: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  resetButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 32,
  },
});
