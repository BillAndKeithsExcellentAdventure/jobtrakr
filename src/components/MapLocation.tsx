import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { StyleSheet, Alert, Platform } from 'react-native';
import { AppleMaps, GoogleMaps } from 'expo-maps';
import { ActionButton } from './ActionButton';
import { useColors } from '@/src/context/ColorsContext';
import { View, Text } from '@/src/components/Themed';
import { AppleMapsMapType } from 'expo-maps/build/apple/AppleMaps.types';
import { GoogleMapsMapType } from 'expo-maps/build/google/GoogleMaps.types';
import { CoordinateLocation } from '../app/(protected)/(home)/[projectId]/SetLocationViaMap';
import { useRouter } from 'expo-router';

const SF_ZOOM = 15;

interface GoogleMarkerLocation {
  coordinates: CoordinateLocation;
  title: string;
  snippet: string;
  draggable: boolean;
}

interface AppleMarkerLocation {
  coordinates: CoordinateLocation;
  title: string;
  tintColor: string;
  systemImage?: string;
}

interface LocationPickerProps {
  onLocationSelected: (latitude: number, longitude: number) => void;
  onClose: () => void;
  projectLocation: CoordinateLocation;
  projectName?: string;
  deviceLocation: CoordinateLocation | null;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelected,
  onClose,
  projectLocation,
  projectName,
  deviceLocation,
}) => {
  const colors = useColors();
  const [selectedLocation, setSelectedLocation] = useState<CoordinateLocation | null>(null);
  const [markerLocation, setMarkerLocation] = useState<CoordinateLocation | null>(null);
  const [googleMarkers, setGoogleMarkers] = useState<GoogleMarkerLocation[]>([]);
  const [appleMarkers, setAppleMarkers] = useState<AppleMarkerLocation[]>([]);
  const router = useRouter();
  const ref = useRef<AppleMaps.MapView>(null);
  useEffect(() => {
    const location = selectedLocation ?? projectLocation;
    setMarkerLocation({ ...location });
  }, [selectedLocation, projectLocation]);

  useEffect(() => {
    if (markerLocation) {
      if (Platform.OS === 'android') {
        setGoogleMarkers([
          {
            coordinates: {
              latitude: markerLocation.latitude,
              longitude: markerLocation.longitude,
            },
            title: 'Project Site',
            snippet: 'Project Site',
            draggable: false,
          },
        ]);
      } else if (Platform.OS === 'ios') {
        setAppleMarkers([
          {
            coordinates: {
              latitude: markerLocation.latitude,
              longitude: markerLocation.longitude,
            },
            title: 'Project Site',
            tintColor: 'blue',
            //systemImage: 'mappin',
          },
        ]);
      }
    }
  }, [markerLocation]);

  const handleSaveLocation = useCallback(() => {
    if (selectedLocation) {
      onLocationSelected(selectedLocation.latitude, selectedLocation.longitude);
    } else {
      Alert.alert('No Location Selected', 'Please tap on the map to select a location');
    }
  }, [selectedLocation, onLocationSelected]);

  const handleResetToCurrentDeviceLocation = useCallback(() => {
    if (deviceLocation) {
      // Use provided initial coordinates
      setSelectedLocation({ ...deviceLocation });
    }
  }, [deviceLocation]);

  const handleMapClick = useCallback((e: any) => {
    //const value = e as unknown as CoordinateLocation;
    //if (value.latitude && value.longitude) {
    //  setSelectedLocation({ latitude: value.latitude, longitude: value.longitude });
    //  console.log(JSON.stringify({ type: 'onMapClick', data: e }, null, 2));
    //}
    const { coordinates } = e;
    if (coordinates && coordinates.latitude && coordinates.longitude) {
      console.log(JSON.stringify({ type: 'onMapClick', data: e }, null, 2));
      setSelectedLocation({ latitude: coordinates.latitude, longitude: coordinates.longitude });
    }
  }, []);

  const handlePOIClick = useCallback((e: any) => {
    const { coordinates } = e;
    if (coordinates && coordinates.latitude && coordinates.longitude) {
      console.log(JSON.stringify({ type: 'onPOIClick', data: e }, null, 2));
      setSelectedLocation({ latitude: coordinates.latitude, longitude: coordinates.longitude });
    }
  }, []);

  const handleMarkerClick = useCallback((e: any) => {
    const { coordinates } = e;
    if (coordinates && coordinates.latitude && coordinates.longitude) {
      console.log(JSON.stringify({ type: 'onMarkerClick', data: e }, null, 2));
      setSelectedLocation({ latitude: coordinates.latitude, longitude: coordinates.longitude });
    }
  }, []);

  const cameraPosition = useMemo(() => {
    return {
      coordinates: {
        latitude: markerLocation ? markerLocation.latitude : 0,
        longitude: markerLocation ? markerLocation.longitude : 0,
      },
      zoom: SF_ZOOM,
    };
  }, [markerLocation]);

  const content = useMemo(() => {
    return (
      <>
        <View style={styles.headerContainer}>
          <Text text={projectName} txtSize="title" />
          <Text
            text="Tap on the map to select a location. Use pinch and drag to adjust the view."
            txtSize="sub-title"
            style={{ color: colors.text, textAlign: 'center', marginTop: 5 }}
          />
        </View>
        <View style={{ flex: 1 }}>
          {Platform.OS === 'android' && (
            <GoogleMaps.View
              ref={ref}
              style={StyleSheet.absoluteFill}
              cameraPosition={cameraPosition}
              properties={{
                isBuildingEnabled: true,
                isIndoorEnabled: false,
                mapType: GoogleMapsMapType.NORMAL,
                selectionEnabled: false,
                isMyLocationEnabled: true,
                isTrafficEnabled: false,
                minZoomPreference: 1,
                maxZoomPreference: 20,
              }}
              markers={googleMarkers}
              onMapClick={handleMapClick}
              onPOIClick={handlePOIClick}
              onMarkerClick={handleMarkerClick}
            />
          )}
          {Platform.OS === 'ios' && (
            <AppleMaps.View
              ref={ref}
              style={StyleSheet.absoluteFill}
              cameraPosition={cameraPosition}
              properties={{
                isTrafficEnabled: false,
                mapType: AppleMapsMapType.STANDARD,
                selectionEnabled: true,
              }}
              markers={appleMarkers}
              onMapClick={handleMapClick}
              onMarkerClick={handleMarkerClick}
            />
          )}
        </View>

        <View style={styles.buttonContainer}>
          {deviceLocation && (
            <ActionButton
              title="Set to Current Device Location"
              type="action"
              onPress={handleResetToCurrentDeviceLocation}
              style={styles.resetButton}
            />
          )}
          <View style={[styles.infoContainer, { borderColor: colors.border, borderWidth: 1 }]}>
            {selectedLocation ? (
              <View>
                <Text text="Selected Coordinates:" txtSize="sub-title" />
                <Text
                  text={`Latitude: ${selectedLocation.latitude.toFixed(14)}`}
                  style={{ color: colors.text, paddingLeft: 10 }}
                />
                <Text
                  text={`Longitude: ${selectedLocation.longitude.toFixed(14)}`}
                  style={{ color: colors.text, paddingLeft: 10 }}
                />
              </View>
            ) : (
              <Text
                text="Tap on the map to select a location"
                txtSize="sub-title"
                style={{ color: colors.text, textAlign: 'center' }}
              />
            )}
          </View>
          <View style={styles.saveButtonRow}>
            <ActionButton
              style={styles.saveButton}
              onPress={handleSaveLocation}
              type={selectedLocation ? 'ok' : 'disabled'}
              title="Save"
            />

            <ActionButton
              style={styles.cancelButton}
              onPress={() => {
                router.back();
              }}
              type={'cancel'}
              title="Cancel"
            />
          </View>
        </View>
      </>
    );
  }, [
    colors,
    projectName,
    cameraPosition,
    deviceLocation,
    selectedLocation,
    handleResetToCurrentDeviceLocation,
    handleSaveLocation,
    handleMapClick,
    handlePOIClick,
    handleMarkerClick,
    googleMarkers,
    appleMarkers,
    router,
  ]);

  return (
    <>
      <View style={[styles.container, { backgroundColor: colors.background }]}>{content}</View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  headerContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  infoContainer: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
    minHeight: 80,
    justifyContent: 'center',
  },
  buttonContainer: {
    marginTop: 16,
    gap: 12,
  },
  resetButton: {},
  saveButtonRow: {
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
