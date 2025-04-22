import { ActionButton } from '@/components/ActionButton';
import { TextField } from '@/components/TextField';
import { Text, TextInput, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { ProjectData } from '@/models/types';
import { useProject, useUpdateProjectCallback } from '@/tbStores/listOfProjects/ListOfProjectsStore';
import { formatDate } from '@/utils/formatters';
import * as Location from 'expo-location';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Keyboard, StyleSheet, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { SafeAreaView } from 'react-native-safe-area-context';

const EditJobScreen = () => {
  const colorScheme = useColorScheme();
  const colors = useMemo(
    () =>
      colorScheme === 'dark'
        ? {
            background: Colors.dark.background,
            borderColor: Colors.dark.inputBorder,
            modalOverlayBackgroundColor: Colors.dark.opaqueModalOverlayBackgroundColor,
            transparent: Colors.dark.transparent,
            neutral200: Colors.dark.neutral200,
            buttonBlue: Colors.dark.buttonBlue,
          }
        : {
            background: Colors.light.background,
            borderColor: Colors.light.inputBorder,
            modalOverlayBackgroundColor: Colors.light.opaqueModalOverlayBackgroundColor,
            transparent: Colors.light.transparent,
            neutral200: Colors.light.neutral200,
            buttonBlue: Colors.light.buttonBlue,
          },
    [colorScheme],
  );

  const router = useRouter();
  const { jobId, jobName } = useLocalSearchParams<{ jobId: string; jobName: string }>();

  const [job, setJob] = useState<ProjectData>({
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
  });

  const currentJob = useProject(jobId);

  useEffect(() => {
    if (currentJob && job.id !== currentJob.id) {
      setJob((prevJob) => ({
        ...currentJob,
      }));
    }
  }, [currentJob]);

  const updatedProject = useUpdateProjectCallback();
  const [startDatePickerVisible, setStartDatePickerVisible] = useState(false);
  const [finishDatePickerVisible, setFinishDatePickerVisible] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean>(false);

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
    setJob((prevJob) => ({
      ...prevJob,
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

  const handlePickGpsLocation = () => {};

  const handleSetCurrentGpsLocation = useCallback(async () => {
    if (currentLocation) {
      console.log('Current location:', currentLocation);
      setJob((prevJob) => ({
        ...prevJob,
        longitude: currentLocation.coords.longitude,
        latitude: currentLocation.coords.latitude,
      }));
    }
  }, [currentLocation]);

  const handleFinishDateConfirm = useCallback(
    (date: Date) => {
      setJob((prevJob) => ({
        ...prevJob,
        plannedFinish: date.getTime(),
      }));
      hideFinishDatePicker();
    },
    [], // no dependencies needed since we're using the function form of setJob
  );

  const canAddJob = useMemo(() => job.name?.length > 4, [job.name]);

  const handleSubmit = useCallback(async () => {
    if (!job || !jobId || !updatedProject) return;

    const result = updatedProject(jobId, job);
    if (result.status !== 'Success') {
      console.log('Job update failed:', job);
    }
    router.back();
  }, [job, jobId, updatedProject, router]);

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
      <View
        style={[
          styles.container,
          styles.modalBackground,
          { backgroundColor: colors.modalOverlayBackgroundColor },
        ]}
      >
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Edit Existing Job</Text>
            <View style={{ paddingBottom: 10, borderBottomWidth: 1, borderColor: colors.borderColor }}>
              <TextField
                style={[styles.input, { borderColor: colors.transparent }]}
                label="Job Name"
                placeholder="Job Name"
                value={job.name}
                onChangeText={(text) => setJob({ ...job, name: text })}
              />
              <TextField
                containerStyle={styles.inputContainer}
                style={[styles.input, { borderColor: colors.transparent }]}
                placeholder="Location"
                label="Location"
                value={job.location}
                onChangeText={(text) => setJob({ ...job, location: text })}
              />
              <TextField
                containerStyle={styles.inputContainer}
                style={[styles.input, { borderColor: colors.transparent }]}
                placeholder="Owner"
                label="Owner"
                value={job.ownerName}
                onChangeText={(text) => setJob({ ...job, ownerName: text })}
              />
              <TextField
                style={[styles.input, { borderColor: colors.transparent }]}
                containerStyle={styles.inputContainer}
                placeholder="Estimated Price"
                label="Estimated Price"
                value={job.bidPrice ? job.bidPrice.toString() : undefined}
                onChangeText={(text) => setJob({ ...job, bidPrice: parseFloat(text) })}
                keyboardType="numeric"
              />
              <View style={styles.dateContainer}>
                <TouchableOpacity activeOpacity={1} onPress={showStartDatePicker}>
                  <Text txtSize="formLabel" text="Start Date" style={styles.inputLabel} />
                  <TextInput
                    readOnly={true}
                    style={[styles.dateInput, { backgroundColor: colors.neutral200 }]}
                    placeholder="Start Date"
                    onPressIn={showStartDatePicker}
                    value={job.startDate ? formatDate(job.startDate) : 'No date selected'}
                  />
                </TouchableOpacity>
                <DateTimePickerModal
                  style={{ alignSelf: 'stretch' }}
                  date={new Date(job.startDate)}
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
                    value={job.plannedFinish ? formatDate(job.plannedFinish) : 'No date selected'}
                  />
                </TouchableOpacity>
                <DateTimePickerModal
                  style={{ alignSelf: 'stretch', height: 200 }}
                  date={new Date(job.plannedFinish)}
                  isVisible={finishDatePickerVisible}
                  mode="date"
                  onConfirm={handleFinishDateConfirm}
                  onCancel={hideFinishDatePicker}
                />
              </View>
              {job.latitude && job.longitude ? (
                <Text style={styles.inputLabel}>{`GPS Coordinates  (${job.latitude.toFixed(
                  4,
                )}/${job.longitude.toFixed(4)})`}</Text>
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
                type={canAddJob ? 'ok' : 'disabled'}
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
        </TouchableWithoutFeedback>
      </View>
    </SafeAreaView>
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
    padding: 10,
    borderRadius: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  inputContainer: {
    marginTop: 6,
  },
  inputLabel: {
    marginTop: 6,
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
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveButton: {
    flex: 1,
    marginRight: 5,
  },
  cancelButton: {
    flex: 1,
    marginLeft: 5,
  },
});

export default EditJobScreen;
