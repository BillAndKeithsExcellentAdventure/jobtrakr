import { ActionButton } from '@/components/ActionButton';
import { Text, TextInput, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useJobDb } from '@/context/DatabaseContext';
import { JobData } from 'jobdb';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Job = {
  name: string;
  location: string;
  owner: string;
};

const JobModalScreen = ({
  visible,
  hideModal,
}: {
  visible: boolean;
  hideModal: (success: boolean) => void;
}) => {
  const [job, setJob] = useState<Job>({
    name: '',
    location: '',
    owner: '',
  });

  const insets = useSafeAreaInsets(); // just in case we use it on IOS
  const colorScheme = useColorScheme();

  const colors = useMemo(
    () =>
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
          },
    [colorScheme],
  );

  const [canAddJob, setCanAddJob] = useState(false);

  useEffect(() => {
    setCanAddJob(job.name?.length > 4);
  }, [job]);

  const { jobDbHost } = useJobDb();

  const handleSubmit = useCallback(async () => {
    const id = { value: 0n };

    const jobData: JobData = {
      Name: job.name,
      Location: job.location,
      OwnerName: job.owner,
    };

    const result = await jobDbHost?.GetJobDB().CreateJob(jobData);
    if (result?.status === 'Success') {
      console.log('Job created:', job);
      hideModal(true);
    } else {
      console.log('Job creation failed:', job);
      hideModal(false);
    }
  }, [job]);

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
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  modalContainer: {
    width: '100%',
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
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 8,
    borderRadius: 5,
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

export default JobModalScreen;
