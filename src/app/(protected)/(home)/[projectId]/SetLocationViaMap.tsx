import { Text, View } from '@/src/components/Themed';
import React, { useCallback, useEffect, useState } from 'react';
import { LocationPicker } from '@/src/components/MapLocation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProject, useUpdateProjectCallback } from '@/src/tbStores/listOfProjects/ListOfProjectsStore';
import { ProjectData } from '@/src/models/types';
import { useColors } from '@/src/context/ColorsContext';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';

const SetLocationViaMap = () => {
  const { projectId, projectName } = useLocalSearchParams<{ projectId: string; projectName: string }>();
  const router = useRouter();

  const colors = useColors();
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

  const handleLocationSelected = useCallback((latitude: number, longitude: number) => {
    setProject((prevProject) => ({
      ...prevProject,
      latitude,
      longitude,
    }));
  }, []);

  return (
    <>
      <Stack.Screen options={{ title: 'Set Project Location', headerShown: true }} />

      <SafeAreaView
        edges={['right', 'bottom', 'left']}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        {project && (
          <LocationPicker
            onLocationSelected={handleLocationSelected}
            onClose={() => router.back()}
            projectName={project.name}
            initialLatitude={project.latitude || undefined}
            initialLongitude={project.longitude || undefined}
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
