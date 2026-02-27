import { CustomerPicker } from '@/src/components/CustomerPicker';
import { NumberInputField } from '@/src/components/NumberInputField';
import { NumericInputField } from '@/src/components/NumericInputField';
import { StyledHeaderBackButton } from '@/src/components/StyledHeaderBackButton';
import { TextField } from '@/src/components/TextField';
import { Text, TextInput, View } from '@/src/components/Themed';
import { IOS_KEYBOARD_TOOLBAR_OFFSET } from '@/src/constants/app-constants';
import { useColors } from '@/src/context/ColorsContext';
import { useNetwork } from '@/src/context/NetworkContext';
import { ProjectData } from '@/src/models/types';
import { CustomerData, useAllRows } from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { useProject, useUpdateProjectCallback } from '@/src/tbStores/listOfProjects/ListOfProjectsStore';
import { formatDate } from '@/src/utils/formatters';
import { updateProjectInQuickBooks } from '@/src/utils/quickbooksAPI';
import { useAuth } from '@clerk/clerk-expo';
import * as Location from 'expo-location';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Platform, StyleSheet, TouchableOpacity } from 'react-native';
import { KeyboardAwareScrollView, KeyboardToolbar } from 'react-native-keyboard-controller';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

const EditProjectScreen = () => {
  const colors = useColors();
  const router = useRouter();
  const { projectId, projectName } = useLocalSearchParams<{ projectId: string; projectName: string }>();
  const { isConnectedToQuickBooks } = useNetwork();
  const { orgId, userId, getToken } = useAuth();

  const [project, setProject] = useState<ProjectData>({
    id: '',
    name: '',
    location: '',
    bidPrice: 0,
    amountSpent: 0,
    quotedPrice: 0,
    longitude: 0,
    latitude: 0,
    radius: 50,
    favorite: 0,
    thumbnail: '',
    status: 'active',
    seedWorkItems: '',
    startDate: 0,
    plannedFinish: 0,
    abbreviation: '',
    customerId: '',
  });

  const currentProject = useProject(projectId);
  const updateProject = useUpdateProjectCallback();
  const allCustomers = useAllRows('customers');
  const [startDatePickerVisible, setStartDatePickerVisible] = useState(false);
  const [finishDatePickerVisible, setFinishDatePickerVisible] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean>(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | undefined>(undefined);

  useEffect(() => {
    if (currentProject) {
      setProject({
        ...currentProject,
      });
      // Set selected customer based on customerId
      if (currentProject.customerId && allCustomers) {
        const customer = allCustomers.find((c) => c.id === currentProject.customerId);
        setSelectedCustomer(customer);
      }
    }
  }, [currentProject, allCustomers]);

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

  const handleStartDateConfirm = useCallback(
    (date: Date) => {
      const newProject = { ...project, startDate: date.getTime() };
      if (projectId) {
        updateProject(projectId, newProject);
      }
      hideStartDatePicker();
    },
    [project, projectId, updateProject],
  );

  const showFinishDatePicker = () => {
    setFinishDatePickerVisible(true);
  };

  const hideFinishDatePicker = () => {
    setFinishDatePickerVisible(false);
  };

  const handlePickGpsLocation = useCallback(() => {
    router.push({ pathname: '/[projectId]/SetLocationViaMap', params: { projectId, projectName } });
  }, [router, projectId, projectName]);

  const handleSetCurrentGpsLocation = useCallback(async () => {
    if (currentLocation) {
      console.log('Current location:', currentLocation);
      const newProject = {
        ...project,
        longitude: currentLocation.coords.longitude,
        latitude: currentLocation.coords.latitude,
      };
      if (projectId) {
        updateProject(projectId, newProject);
      }
    }
  }, [currentLocation, project, projectId, updateProject]);

  const handleFinishDateConfirm = useCallback(
    (date: Date) => {
      const newProject = { ...project, plannedFinish: date.getTime() };
      if (projectId) {
        updateProject(projectId, newProject);
      }
      hideFinishDatePicker();
    },
    [project, projectId, updateProject],
  );

  const handleSubmit = useCallback(async () => {
    if (!project || !projectId) return;

    const result = updateProject(projectId, project);
    if (result.status !== 'Success') {
      console.log('Project update failed:', project);
    }
  }, [project, projectId, updateProject]);

  const handleAbbreviationChange = useCallback((text: string) => {
    // Allow only uppercase letters and limit to 10 characters
    const formattedText = text
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 10);
    setProject((prev) => ({ ...prev, abbreviation: formattedText }));
  }, []);

  const handleBackPress = useCallback(() => {
    handleSubmit();
    router.back();
  }, [handleSubmit, router]);

  const handleCustomerSelected = useCallback(
    async (customer: CustomerData) => {
      const customerIdChanged = project.customerId !== customer.id;
      setSelectedCustomer(customer);
      const newProject = { ...project, customerId: customer.id };
      if (projectId) {
        updateProject(projectId, newProject);
      }
      if (
        customerIdChanged &&
        isConnectedToQuickBooks &&
        orgId &&
        userId &&
        customer.accountingId &&
        projectId
      ) {
        try {
          await updateProjectInQuickBooks(
            orgId,
            userId,
            { customerId: customer.accountingId, projectName: project.name, projectId },
            getToken,
          );
          console.log('Updating project customer in QuickBooks');
        } catch (error) {
          console.error('[QB] Failed to update project customer in QuickBooks:', error);
        }
      }
    },
    [project, projectId, updateProject, isConnectedToQuickBooks, orgId, userId, getToken],
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Edit Project',
          headerShown: true,
          gestureEnabled: false,
          headerLeft: () => <StyledHeaderBackButton onPress={handleBackPress} />,
        }}
      />
      <KeyboardAwareScrollView
        bottomOffset={62}
        style={[{ backgroundColor: colors.modalOverlayBackgroundColor }]}
        contentContainerStyle={[styles.modalContainer, { paddingBottom: Platform.OS === 'ios' ? 90 : 20 }]}
      >
        <View style={{ padding: 10, gap: 6 }}>
          <TextField
            style={[styles.input, { borderColor: colors.transparent }]}
            label="Project Name"
            placeholder="Project Name"
            value={project.name}
            onChangeText={(text) => setProject({ ...project, name: text })}
            onBlur={handleSubmit}
          />
          <TextField
            containerStyle={styles.inputContainer}
            style={[styles.input, { borderColor: colors.transparent }]}
            placeholder="Abbreviation for Receipts and Bills"
            label="Abbreviation for Receipts and Bills"
            value={project.abbreviation}
            autoCorrect={false}
            autoCapitalize="characters"
            onChangeText={handleAbbreviationChange}
            onBlur={handleSubmit}
          />
          <View style={{ flex: 1 }}>
            <NumericInputField
              label="Initial Quoted Price"
              style={{ paddingHorizontal: 10 }}
              decimals={0}
              maxDecimals={0}
              selectOnFocus={true}
              value={project.quotedPrice || 0}
              onChangeNumber={(value) => setProject({ ...project, quotedPrice: value ?? 0 })}
              placeholder="Initial Quoted Price"
            />
          </View>

          <TextField
            containerStyle={styles.inputContainer}
            style={[styles.input, { borderColor: colors.transparent }]}
            placeholder="Location"
            label="Location"
            value={project.location}
            onChangeText={(text) => setProject({ ...project, location: text })}
            onBlur={handleSubmit}
          />
          <CustomerPicker
            selectedCustomer={selectedCustomer}
            onCustomerSelected={handleCustomerSelected}
            customers={allCustomers}
            label="Customer"
            placeholder="Select a customer"
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
      </KeyboardAwareScrollView>

      {Platform.OS === 'ios' && <KeyboardToolbar offset={{ opened: IOS_KEYBOARD_TOOLBAR_OFFSET }} />}
    </>
  );
};

const styles = StyleSheet.create({
  dateContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalContainer: {
    maxWidth: 460,
    width: '100%',
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
});

export default EditProjectScreen;
