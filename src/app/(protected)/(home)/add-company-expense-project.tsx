import { ModalScreenContainer } from '@/src/components/ModalScreenContainer';
import { TextField } from '@/src/components/TextField';
import { View, Text } from '@/src/components/Themed';
import { useActiveProjectIds } from '@/src/context/ActiveProjectIdsContext';
import { useColors } from '@/src/context/ColorsContext';
import { ProjectData } from '@/src/models/types';
import {
  useAddProjectCallback,
  useHasActiveCompanyExpenseProject,
} from '@/src/tbStores/listOfProjects/ListOfProjectsStore';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';

const AddCompanyExpenseProjectScreen = () => {
  const defaultStart = new Date();
  const defaultFinish = new Date();
  defaultFinish.setMonth(defaultFinish.getMonth() + 12);

  const [project, setProject] = useState<ProjectData>({
    id: '',
    name: '',
    abbreviation: '',
    location: '',
    customerId: '',
    bidPrice: 0,
    quotedPrice: 0,
    amountSpent: 0,
    longitude: 0,
    latitude: 0,
    radius: 50,
    favorite: 0,
    thumbnail: '',
    status: 'active',
    seedWorkItems: '',
    startDate: defaultStart.getTime(),
    plannedFinish: defaultFinish.getTime(),
    isCompanyExpenseProject: true,
  });

  const addProject = useAddProjectCallback();
  const colors = useColors();
  const router = useRouter();
  const hasActiveCompanyExpenseProject = useHasActiveCompanyExpenseProject();
  const [canAddProject, setCanAddProject] = useState(false);
  const { addActiveProjectIds } = useActiveProjectIds();

  // Warn immediately on mount so the user knows before filling out the form.
  useEffect(() => {
    if (hasActiveCompanyExpenseProject) {
      Alert.alert(
        'Company Expense Project Exists',
        'There is already an active Company Expense project. Only one active Company Expense project is allowed at a time.',
        [{ text: 'OK', onPress: () => router.back() }],
      );
    }
  }, [hasActiveCompanyExpenseProject, router]);

  useEffect(() => {
    setCanAddProject(
      !hasActiveCompanyExpenseProject &&
        project.name.trim().length > 0 &&
        project.abbreviation.trim().length > 0,
    );
  }, [project, hasActiveCompanyExpenseProject]);

  const handleSubmit = useCallback(async () => {
    if (!canAddProject) return;

    const result = addProject(project);
    if (result.status !== 'Success') {
      Alert.alert(`Project creation failed for project ${project.name}: ${result.msg}`);
      router.back();
    } else {
      addActiveProjectIds(result.id);
      router.replace({ pathname: '/[projectId]', params: { projectId: result.id } });
    }
  }, [project, canAddProject, addProject, router, addActiveProjectIds]);

  return (
    <View style={{ flex: 1, width: '100%' }}>
      <ModalScreenContainer onSave={handleSubmit} onCancel={() => router.back()} canSave={canAddProject}>
        <Text style={styles.modalTitle}>Create Company Expense Project</Text>

        <TextField
          style={[styles.input, { backgroundColor: colors.neutral200 }]}
          placeholder="Project Name"
          value={project.name}
          onChangeText={(text) => setProject({ ...project, name: text })}
        />
        <TextField
          style={[styles.input, { backgroundColor: colors.neutral200 }]}
          placeholder="Abbreviation (used for receipts and bills)"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={10}
          value={project.abbreviation}
          onChangeText={(text) => setProject({ ...project, abbreviation: text })}
        />
        <TextField
          style={[styles.input, { backgroundColor: colors.neutral200 }]}
          placeholder="Location (optional)"
          value={project.location}
          onChangeText={(text) => setProject({ ...project, location: text })}
        />
      </ModalScreenContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    marginBottom: 10,
    padding: 4,
    borderRadius: 5,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default AddCompanyExpenseProjectScreen;
