import React, { useEffect, useMemo, useState } from 'react';
import { Modal, TouchableOpacity, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, TextInput } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Button } from '@/components/Button';
import { formatCurrency } from '@/utils/formatters';
import { useJobDb } from '@/session/DatabaseContext';
import { JobData } from 'jobdb';

type Job = {
  name: string;
  location: string;
  owner: string;
  finishDate: Date;
  bidAmount: number;
};

const JobModalScreen = ({ visible, hideModal }: { visible: boolean; hideModal: (success:boolean) => void }) => {
  const [job, setJob] = useState<Job>({
    name: '',
    location: '',
    owner: '',
    finishDate: new Date(),
    bidAmount: 0,
  });

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
          }
        : {
            background: Colors.light.background,
            borderColor: Colors.light.inputBorder,
            modalOverlayBackgroundColor: Colors.light.modalOverlayBackgroundColor,
          };

    return themeColors;
  }, [colorScheme]);

  const [canAddJob, setCanAddJob] = useState(false);

  useEffect(() => {
    setCanAddJob(job.name?.length > 4);
  }, [job]);

  const handleDateChange = (event: any, selectedDate: Date | undefined) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setJob((prevJob) => ({
        ...prevJob,
        finishDate: selectedDate,
      }));
    }
  };

  const { jobDbHost } = useJobDb();

  const handleSubmit = async () => {
    const id = { value: 0n };
    // Handle form submission here

    const jobData: JobData = {
      Name: job.name,
      UserId: 1,
      JobLocation: job.location,
      PlannedFinish: job.finishDate,
      BidPrice: job.bidAmount,
      _id: null,
      Code: null,
      JobTypeId: null,
      JobStatus: null,
      Thumbnail: undefined,
    };

    const status = await jobDbHost?.GetJobDB().CreateJob(id, jobData);
    if (status === 'Success') {
      console.log('Job created:', job);
      hideModal(true);
    } else {
      console.log('Job creation failed:', job);
      hideModal(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={[styles.modalBackground, { backgroundColor: colors.modalOverlayBackgroundColor }]}>
        <View style={[styles.modalContainer, { marginTop: insets.top }]}>
          <Text style={styles.modalTitle}>Create New Job</Text>

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

          <DateTimePicker value={job.finishDate} mode="date" display="default" onChange={handleDateChange} />

          <TextInput
            style={styles.input}
            placeholder="Bid Price"
            value={job.bidAmount ? job.bidAmount.toString() : undefined}
            onChangeText={(text) => setJob({ ...job, bidAmount: parseFloat(text) })}
            keyboardType="numeric"
          />

          <View style={styles.buttons}>
            <Button disabled={!canAddJob} text="Submit" onPress={handleSubmit} />
            <Button text="Cancel" onPress={()=>hideModal(false)} />
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

export default JobModalScreen;
