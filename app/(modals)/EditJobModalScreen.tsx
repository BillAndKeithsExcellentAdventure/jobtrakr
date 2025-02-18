import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { Text, TextInput, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { cancelButtonBg, Colors, saveButtonBg } from '@/constants/Colors';
import { useJobDb } from '@/context/DatabaseContext';
import { formatDate } from '@/utils/formatters';
import { JobData } from 'jobdb';
import * as Location from 'expo-location';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Keyboard,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Button as RNButton,
  SafeAreaView,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { ActionButton } from '@/components/ActionButton';

type Job = {
  jobId?: string;
  name: string;
  location?: string;
  owner?: string;
  finishDate: Date;
  startDate: Date;
  bidPrice?: number;
  longitude?: number;
  latitude?: number;
};

const EditJobModalScreen = ({
  jobId,
  hideModal,
}: {
  jobId: string | undefined;
  hideModal: (success: boolean) => void;
}) => {
  const defaultStartDate = new Date();
  const defaultFinishDate = new Date();
  defaultFinishDate.setMonth(defaultFinishDate.getMonth() + 9);

  const [job, setJob] = useState<Job>({
    jobId,
    name: '',
    location: '',
    owner: '',
    startDate: defaultStartDate,
    finishDate: defaultFinishDate,
    bidPrice: 0,
    longitude: undefined,
    latitude: undefined,
  });

  const [currentJob, setExistingJob] = useState<JobData | undefined>();
  const [visible, setVisible] = useState(false);
  const colorScheme = useColorScheme();

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
  }, [hasLocationPermission]);

  const colors = useMemo<any>(() => {
    const themeColors =
      colorScheme === 'dark'
        ? {
            background: Colors.dark.background,
            borderColor: Colors.dark.inputBorder,
            modalOverlayBackgroundColor: Colors.dark.modalOverlayBackgroundColor,
            transparent: Colors.dark.transparent,
            neutral200: Colors.dark.neutral200,
            buttonBlue: Colors.dark.buttonBlue,
          }
        : {
            background: Colors.light.background,
            borderColor: Colors.light.inputBorder,
            modalOverlayBackgroundColor: Colors.light.modalOverlayBackgroundColor,
            transparent: Colors.light.transparent,
            neutral200: Colors.light.neutral200,
            buttonBlue: Colors.light.buttonBlue,
          };

    return themeColors;
  }, [colorScheme]);

  const showStartDatePicker = () => {
    setStartDatePickerVisible(true);
  };

  const hideStartDatePicker = () => {
    setStartDatePickerVisible(false);
  };

  const handleStartDateConfirm = (date: Date) => {
    setJob((prevJob) => ({
      ...prevJob,
      startDate: date,
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
        finishDate: date,
      }));

      hideFinishDatePicker();
    },
    [setJob],
  );

  const [canAddJob, setCanAddJob] = useState(false);

  useEffect(() => {
    setCanAddJob(job.name?.length > 4);
  }, [job]);

  const { jobDbHost } = useJobDb();

  useEffect(() => {
    if (jobId === undefined) setVisible(false);
  }, [jobId]);

  useEffect(() => {
    async function loadJobData() {
      if (!jobId) return;

      const result = await jobDbHost?.GetJobDB().FetchJobById(jobId);
      const fetchedJob = result ? result.job : undefined;
      if (!!fetchedJob) {
        const jobData: Job = {
          ...job,
          name: fetchedJob.Name,
          location: fetchedJob.Location,
          owner: fetchedJob.OwnerName,
          bidPrice: fetchedJob.BidPrice,
          longitude: fetchedJob.Longitude,
          latitude: fetchedJob.Latitude,
        };

        if (fetchedJob.PlannedFinish) finishDate: fetchedJob.PlannedFinish;
        if (fetchedJob.StartDate) startDate: fetchedJob.StartDate;

        setExistingJob(fetchedJob);
        setJob(jobData);
        setVisible(true);
      }
    }

    loadJobData();
  }, [jobId, jobDbHost, visible]);

  const handleSubmit = useCallback(async () => {
    if (!jobId || !currentJob) return;

    const modifiedJob: JobData = {
      ...currentJob,
      Name: job.name,
      Location: job.location,
      OwnerName: job.owner,
      PlannedFinish: job.finishDate,
      StartDate: job.startDate,
      BidPrice: job.bidPrice,
      Latitude: job.latitude,
      Longitude: job.longitude,
    };

    const status = await jobDbHost?.GetJobDB().UpdateJob(modifiedJob);
    if (status === 'Success') {
      console.log('Job successfully updated:', job);
      hideModal(true);
    } else {
      console.log('Job update failed:', job);
      hideModal(false);
    }
  }, [job]);

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <SafeAreaView style={{ flex: 1 }}>
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
                  value={job.owner}
                  onChangeText={(text) => setJob({ ...job, owner: text })}
                />
                <TextField
                  style={[styles.input, { borderColor: colors.transparent }]}
                  containerStyle={styles.inputContainer}
                  placeholder="Bid Price"
                  label="Bid Price"
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
                    date={job.startDate}
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
                      value={job.startDate ? formatDate(job.finishDate) : 'No date selected'}
                    />
                  </TouchableOpacity>
                  <DateTimePickerModal
                    style={{ alignSelf: 'stretch', height: 200 }}
                    date={job.finishDate}
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
                    hideModal(false);
                  }}
                  type={'cancel'}
                  title="Cancel"
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    maxWidth: 400,
    width: '90%',
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

export default EditJobModalScreen;
