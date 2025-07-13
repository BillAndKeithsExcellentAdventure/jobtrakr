import { ActionButton } from '@/src/components/ActionButton';
import { TextField } from '@/src/components/TextField';
import { Text, TextInput, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import { ProjectData } from '@/src/models/types';
import { useProject, useUpdateProjectCallback } from '@/src/tbStores/listOfProjects/ListOfProjectsStore';
import { formatDate } from '@/src/utils/formatters';
import * as Location from 'expo-location';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, TouchableOpacity } from 'react-native';
import { KeyboardAwareScrollView, KeyboardToolbar } from 'react-native-keyboard-controller';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { LocationPicker } from '@/src/components/MapLocation';

const EditProjectScreen = () => {
  const colors = useColors();
  const router = useRouter();
  const { projectId, projectName } = useLocalSearchParams<{ projectId: string; projectName: string }>();

  const [project, setProject] = useState<ProjectData>({
    id: '',
    name: '',
    location: '',
    ownerName: '',
    bidPrice: 0,
    amountSpent: 0,
    longitude: 0,
    latitude: 0,
    radius: 50,
    favorite: 0,
    thumbnail: '',
    status: 'active',
    seedWorkItems: '',
    startDate: 0,
    plannedFinish: 0,
    ownerAddress: '',
    ownerAddress2: '',
    ownerCity: '',
    ownerState: '',
    ownerZip: '',
    ownerPhone: '',
    ownerEmail: 'string',
  });

  const currentProject = useProject(projectId);

  useEffect(() => {
    if (currentProject && project.id !== currentProject.id) {
      setProject({
        ...currentProject,
      });
    }
  }, [currentProject]);

  const updatedProject = useUpdateProjectCallback();
  const [startDatePickerVisible, setStartDatePickerVisible] = useState(false);
  const [finishDatePickerVisible, setFinishDatePickerVisible] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean>(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

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
  }, []);

  const showStartDatePicker = () => {
    setStartDatePickerVisible(true);
  };

  const hideStartDatePicker = () => {
    setStartDatePickerVisible(false);
  };

  const handleStartDateConfirm = (date: Date) => {
    setProject((prev) => ({
      ...prev,
      startDate: date.getTime(),
    }));

    hideStartDatePicker();
  };

  const showFinishDatePicker = () => {
    setFinishDatePickerVisible(true);
  };

  const hideFinishDatePicker = () => {
    setFinishDatePickerVisible(false);
  };

  const handlePickGpsLocation = () => {
    setShowLocationPicker(true);
  };

  const handleSetCurrentGpsLocation = useCallback(async () => {
    if (currentLocation) {
      console.log('Current location:', currentLocation);
      setProject((prevProject) => ({
        ...prevProject,
        longitude: currentLocation.coords.longitude,
        latitude: currentLocation.coords.latitude,
      }));
    }
  }, [currentLocation]);

  const handleFinishDateConfirm = useCallback((date: Date) => {
    setProject((prevProject) => ({
      ...prevProject,
      plannedFinish: date.getTime(),
    }));
    hideFinishDatePicker();
  }, []);

  const handleLocationSelected = useCallback((latitude: number, longitude: number) => {
    setProject((prevProject) => ({
      ...prevProject,
      latitude,
      longitude,
    }));
    setShowLocationPicker(false);
  }, []);

  const canAddProject = useMemo(() => project.name?.length > 4, [project.name]);

  const handleSubmit = useCallback(async () => {
    if (!project || !projectId || !updatedProject) return;

    const result = updatedProject(projectId, project);
    if (result.status !== 'Success') {
      console.log('Project update failed:', project);
    }
    router.back();
  }, [project, projectId, updatedProject, router]);

  return (
    <>
      <Stack.Screen options={{ title: 'Edit Project', headerShown: true }} />
      <KeyboardAwareScrollView
        bottomOffset={62}
        contentContainerStyle={styles.modalContainer}
        style={[{ backgroundColor: colors.modalOverlayBackgroundColor }, { flex: 1, marginBottom: 62 }]}
      >
        <View style={{ padding: 10, gap: 6 }}>
          <TextField
            style={[styles.input, { borderColor: colors.transparent }]}
            label="Project Name"
            placeholder="Project Name"
            value={project.name}
            onChangeText={(text) => setProject({ ...project, name: text })}
          />
          <TextField
            containerStyle={styles.inputContainer}
            style={[styles.input, { borderColor: colors.transparent }]}
            placeholder="Location"
            label="Location"
            value={project.location}
            onChangeText={(text) => setProject({ ...project, location: text })}
          />
          <TextField
            containerStyle={styles.inputContainer}
            style={[styles.input, { borderColor: colors.transparent }]}
            placeholder="Owner"
            label="Owner"
            value={project.ownerName}
            onChangeText={(text) => setProject({ ...project, ownerName: text })}
          />

          <View style={styles.dateContainer}>
            <TouchableOpacity activeOpacity={1} onPress={showStartDatePicker}>
              <Text txtSize="formLabel" text="Start Date" style={styles.inputLabel} />
              <TextInput
                readOnly={true}
                style={[styles.dateInput, { backgroundColor: colors.neutral200 }]}
                placeholder="Start Date"
                onPressIn={showStartDatePicker}
                value={project.startDate ? formatDate(project.startDate) : 'No date selected'}
              />
            </TouchableOpacity>
            <DateTimePickerModal
              style={{ alignSelf: 'stretch' }}
              date={new Date(project.startDate)}
              isVisible={startDatePickerVisible}
              mode="date"
              onConfirm={handleStartDateConfirm}
              onCancel={hideStartDatePicker}
            />

            <TouchableOpacity activeOpacity={1} onPress={showFinishDatePicker}>
              <Text txtSize="formLabel" text="Finish Date" style={styles.inputLabel} />
              <TextInput
                readOnly={true}
                style={[styles.dateInput, { backgroundColor: colors.neutral200 }]}
                placeholder="Finish Date"
                onPressIn={showFinishDatePicker}
                value={project.plannedFinish ? formatDate(project.plannedFinish) : 'No date selected'}
              />
            </TouchableOpacity>
            <DateTimePickerModal
              style={{ alignSelf: 'stretch', height: 200 }}
              date={new Date(project.plannedFinish)}
              isVisible={finishDatePickerVisible}
              mode="date"
              onConfirm={handleFinishDateConfirm}
              onCancel={hideFinishDatePicker}
            />
          </View>
          {project.latitude && project.longitude ? (
            <Text style={styles.inputLabel}>{`GPS Coordinates  (${project.latitude.toFixed(
              4,
            )}/${project.longitude.toFixed(4)})`}</Text>
          ) : (
            <Text style={styles.inputLabel}>GPS Coordinates</Text>
          )}
          <View style={styles.gpsButtonContainer}>
            {hasLocationPermission && (
              <TouchableOpacity
                style={[styles.gpsButton, styles.gpsButtonLeft, { borderColor: colors.buttonBlue }]}
                onPress={handleSetCurrentGpsLocation}
              >
                <Text style={[styles.gpsButtonText, { color: colors.buttonBlue }]}>Use Current</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.gpsButton, styles.gpsButtonRight, { borderColor: colors.buttonBlue }]}
              onPress={handlePickGpsLocation}
            >
              <Text style={[styles.gpsButtonText, { color: colors.buttonBlue }]}>Select on Map</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.saveButtonRow}>
          <ActionButton
            style={styles.saveButton}
            onPress={handleSubmit}
            type={canAddProject ? 'ok' : 'disabled'}
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
      </KeyboardAwareScrollView>

      <LocationPicker
        visible={showLocationPicker}
        onLocationSelected={handleLocationSelected}
        onClose={() => setShowLocationPicker(false)}
        projectName={project.name}
        initialLatitude={project.latitude || undefined}
        initialLongitude={project.longitude || undefined}
      />

      {Platform.OS === 'ios' && <KeyboardToolbar />}
    </>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  container: {
    flex: 1,
    justifyContent: 'flex-start', // Align items at the top vertically
    alignItems: 'center', // Center horizontally
    width: '100%',
    paddingTop: 10,
  },
  dateContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalContainer: {
    maxWidth: 460,
    width: '100%',
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  inputContainer: {
    marginTop: 0, // use gap instead
  },
  inputLabel: {
    marginTop: 0, // use gap instead
    marginBottom: 4,
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

export default EditProjectScreen;
