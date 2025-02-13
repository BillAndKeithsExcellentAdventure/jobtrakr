import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
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
  const insets = useSafeAreaInsets(); // just in case we use it on IOS
  const colorScheme = useColorScheme();

  const [startDatePickerVisible, setStartDatePickerVisible] = useState(false);
  const [finishDatePickerVisible, setFinishDatePickerVisible] = useState(false);

  const colors = useMemo<any>(() => {
    const themeColors =
      colorScheme === 'dark'
        ? {
            background: Colors.dark.background,
            borderColor: Colors.dark.inputBorder,
            modalOverlayBackgroundColor: Colors.dark.modalOverlayBackgroundColor,
            transparent: Colors.dark.transparent,
            neutral200: Colors.dark.neutral200,
          }
        : {
            background: Colors.light.background,
            borderColor: Colors.light.inputBorder,
            modalOverlayBackgroundColor: Colors.light.modalOverlayBackgroundColor,
            transparent: Colors.light.transparent,
            neutral200: Colors.light.neutral200,
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

  const handleFinishDateConfirm = (date: Date) => {
    setJob((prevJob) => ({
      ...prevJob,
      finishDate: date,
    }));

    hideFinishDatePicker();
  };

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

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={[styles.modalBackground, { backgroundColor: colors.modalOverlayBackgroundColor }]}>
        <View style={[styles.modalContainer, { marginTop: insets.top }]}>
          <Text style={styles.modalTitle}>Edit Existing Job</Text>
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
  dateContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalContainer: {
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

  dateButton: {
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttons: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-evenly',
  },
});

export default EditJobModalScreen;
