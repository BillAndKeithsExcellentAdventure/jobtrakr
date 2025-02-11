import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, TextInput } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Button } from '@/components/Button';
import { useJobDb } from '@/context/DatabaseContext';
import { DBStatus, JobData } from 'jobdb';
import { TextField } from '@/components/TextField';
import { formatDate } from '@/utils/formatters';

type Job = {
  jobId?: string;
  name: string;
  location?: string;
  owner?: string;
  finishDate: Date;
  startDate: Date;
  bidPrice?: number;
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
  });

  const [currentJob, setExistingJob] = useState<JobData | undefined>();
  const [visible, setVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const insets = useSafeAreaInsets(); // just in case we use it on IOS
  const colorScheme = useColorScheme();

  const colors = useMemo<any>(() => {
    const themeColors =
      colorScheme === 'dark'
        ? {
            background: Colors.dark.background,
            borderColor: Colors.dark.inputBorder,
            modalOverlayBackgroundColor: Colors.dark.modalOverlayBackgroundColor,
            transparent: Colors.dark.transparent,
          }
        : {
            background: Colors.light.background,
            borderColor: Colors.light.inputBorder,
            modalOverlayBackgroundColor: Colors.light.modalOverlayBackgroundColor,
            transparent: Colors.light.transparent,
          };

    return themeColors;
  }, [colorScheme]);

  const [canAddJob, setCanAddJob] = useState(false);

  useEffect(() => {
    setCanAddJob(job.name?.length > 4);
  }, [job]);

  useEffect(() => {
    if (Platform.OS === 'ios') setShowDatePicker(true); // Keeps the picker open for iOS
  }, []);

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

  const handleDateChange = useCallback((event: any, selectedDate: Date | undefined) => {
    if (Platform.OS !== 'ios') setShowDatePicker(false);

    if (selectedDate) {
      setJob((prevJob) => ({
        ...prevJob,
        finishDate: selectedDate,
      }));
    }
  }, []);

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

  const handleAndroidShowDatePicker = useCallback((): void => {
    setShowDatePicker(!showDatePicker);
  }, []);

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={[styles.modalBackground, { backgroundColor: colors.modalOverlayBackgroundColor }]}>
        <View style={[styles.modalContainer, { marginTop: insets.top }]}>
          <Text style={styles.modalTitle}>Edit Existing Job</Text>

          <TextInput
            style={styles.input}
            placeholder="Job Name"
            value={job.name}
            onChangeText={(text) => setJob({ ...job, name: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Location"
            value={job.location}
            onChangeText={(text) => setJob({ ...job, location: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Owner"
            value={job.owner}
            onChangeText={(text) => setJob({ ...job, owner: text })}
          />

          <View style={[styles.input, { flexDirection: 'row' }]}>
            {Platform.OS === 'android' && (
              <TouchableOpacity activeOpacity={1} onPress={handleAndroidShowDatePicker}>
                <View pointerEvents="none" style={{ minWidth: 240, borderColor: colors.transparent }}>
                  <TextField
                    value={job.finishDate ? formatDate(job.finishDate) : undefined}
                    placeholder="Finish Date"
                    editable={false}
                    inputWrapperStyle={{ borderColor: colors.transparent, alignSelf: 'stretch' }}
                    style={{ borderColor: colors.transparent, alignSelf: 'stretch' }}
                  />
                </View>
              </TouchableOpacity>
            )}
            {showDatePicker && (
              <DateTimePicker
                style={{ alignSelf: 'stretch' }}
                value={job.finishDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Bid Price"
            value={job.bidPrice ? job.bidPrice.toString() : undefined}
            onChangeText={(text) => setJob({ ...job, bidPrice: parseFloat(text) })}
            keyboardType="numeric"
          />

          <View style={styles.buttons}>
            <Button disabled={!canAddJob} text="Submit" onPress={handleSubmit} />
            <Button text="Cancel" onPress={() => hideModal(false)} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: 300,
    padding: 20,
    borderRadius: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 8,
    borderRadius: 5,
  },
  dateButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: 'center',
  },
  dateButtonText: {
    color: 'white',
  },
  buttons: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-evenly',
  },
});

export default EditJobModalScreen;
