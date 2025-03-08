import { ActionButtonProps } from '@/components/ButtonBar';
import OptionList, { OptionEntry } from '@/components/OptionList';
import BottomSheetContainer from '@/components/BottomSheetContainer';
import RightHeaderMenu from '@/components/RightHeaderMenu';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Text, TextInput, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useJobDb } from '@/context/DatabaseContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Platform, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

type Job = {
  jobId?: string;
  name: string;
  location?: string;
  owner?: string;
  finishDate?: Date;
  startDate?: Date;
  bidPrice?: number;
  longitude?: number;
  latitude?: number;
};

const JobDetailsPage = () => {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const colorScheme = useColorScheme();
  const [headerMenuModalVisible, setHeaderMenuModalVisible] = useState<boolean>(false);
  const { jobDbHost } = useJobDb();
  const [job, setJob] = useState<Job>({
    jobId,
    name: '',
    location: '',
    owner: '',
    startDate: undefined,
    finishDate: undefined,
    bidPrice: 0,
    longitude: undefined,
    latitude: undefined,
  });

  const [isListPickerVisible, setIsListPickerVisible] = useState<boolean>(false);
  const [isOkToSaveSelectedValue, setIsOkToSaveSelectedValue] = useState<boolean>(false);
  const [pickedOption, setPickedOption] = useState<string | undefined>(undefined);

  const [pickerOptions] = useState<OptionEntry[]>([
    { label: '' },
    { label: 'One' },
    { label: 'Two' },
    { label: 'Three' },
    { label: 'Four' },
    { label: 'Five' },
    { label: 'Six' },
    { label: 'Seven' },
    { label: 'Eight' },
    { label: 'Nine' },
    { label: 'Ten' },
    { label: 'Eleven' },
  ]);

  // Define colors based on the color scheme (dark or light)
  const colors = useMemo(
    () =>
      colorScheme === 'dark'
        ? {
            screenBackground: Colors.dark.background,
            listBackground: Colors.dark.listBackground,
            itemBackground: Colors.dark.itemBackground,
            iconColor: Colors.dark.iconColor,
            shadowColor: Colors.dark.shadowColor,
            borderColor: Colors.dark.borderColor,
            bottomSheetBackground: Colors.dark.bottomSheetBackground,
            text: Colors.dark.text,
          }
        : {
            screenBackground: Colors.light.background,
            listBackground: Colors.light.listBackground,
            itemBackground: Colors.light.itemBackground,
            iconColor: Colors.light.iconColor,
            shadowColor: Colors.light.shadowColor,
            borderColor: Colors.light.borderColor,
            bottomSheetBackground: Colors.light.bottomSheetBackground,
            text: Colors.light.text,
          },
    [colorScheme],
  );

  const loadJobData = useCallback(async () => {
    const result = await jobDbHost?.GetJobDB().FetchJobById(jobId);
    const fetchedJob = result ? result.job : undefined;
    if (!!fetchedJob) {
      const fetchedJobData: Job = {
        ...job,
        name: fetchedJob.Name,
        location: fetchedJob.Location,
        owner: fetchedJob.OwnerName,
        bidPrice: fetchedJob.BidPrice,
        longitude: fetchedJob.Longitude,
        latitude: fetchedJob.Latitude,
      };

      setJob(fetchedJobData);
    }
  }, [jobDbHost, jobId]);

  useEffect(() => {
    loadJobData();
  }, [loadJobData]);

  const handleMenuItemPress = useCallback(
    (menuItem: string, actionContext: any) => {
      setHeaderMenuModalVisible(false);
      if (menuItem === 'Edit' && jobId) router.push(`/jobs/${jobId}/edit/?jobName=${job.name}`);
      //if (menuItem === 'Edit' && jobId) router.push(`/jobs/[jobId]/edit/${jobId}?jobName=${job.name}`);
    },
    [jobId, job],
  );

  const rightHeaderMenuButtons: ActionButtonProps[] = useMemo(
    () => [
      {
        icon: <FontAwesome name="edit" size={28} color={colors.iconColor} />,
        label: 'Edit Job Info',
        onPress: (e, actionContext) => {
          handleMenuItemPress('Edit', actionContext);
        },
      },
      {
        icon: <FontAwesome name="trash" size={28} color={colors.iconColor} />,
        label: 'Delete Job',
        onPress: (e, actionContext) => {
          handleMenuItemPress('Delete', actionContext);
        },
      },
    ],
    [colors],
  );

  const onListPickerModalClose = (okPressed?: boolean) => {
    if (okPressed) {
      // Todo if need to save only on OK
    }
    setIsListPickerVisible(false);
  };

  const onOptionSelected = (label: string) => {
    setPickedOption(label);
    setIsOkToSaveSelectedValue(!!label);
    //setIsListPickerVisible(false);
  };

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={styles.container}>
      <View style={styles.container}>
        {Platform.OS === 'android' ? (
          <Stack.Screen
            options={{
              headerShown: true,
              header: () => (
                <ScreenHeader
                  title="Job Overview"
                  headerLeft={() => (
                    <Pressable
                      onPress={() => {
                        router.back();
                      }}
                    >
                      {({ pressed }) => (
                        <MaterialCommunityIcons
                          name="arrow-left"
                          size={24}
                          color={colors.iconColor}
                          style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                        />
                      )}
                    </Pressable>
                  )}
                  headerRight={() => (
                    <Pressable
                      onPress={() => {
                        setHeaderMenuModalVisible(!headerMenuModalVisible);
                      }}
                    >
                      {({ pressed }) => (
                        <MaterialCommunityIcons
                          name="menu"
                          size={28}
                          color={colors.iconColor}
                          style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                        />
                      )}
                    </Pressable>
                  )}
                />
              ),
            }}
          />
        ) : (
          <Stack.Screen
            options={{
              headerShown: true,
              title: 'Job Overview',
              headerRight: () => (
                <Pressable
                  style={{ marginRight: 12 }}
                  onPress={() => {
                    setHeaderMenuModalVisible(!headerMenuModalVisible);
                  }}
                >
                  {({ pressed }) => (
                    <MaterialCommunityIcons
                      name="menu"
                      size={28}
                      color={colors.iconColor}
                      style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                    />
                  )}
                </Pressable>
              ),
            }}
          />
        )}

        <View style={styles.headerContainer}>
          <Text>JobName={job.name}</Text>
          <Text>JobId={jobId}</Text>
          <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center' }}>
            <Text text={pickedOption} style={{ marginRight: 10 }} />
            <View style={[styles.circleButtonContainer, { borderColor: colors.borderColor }]}>
              <Pressable style={styles.circleButton} onPress={() => setIsListPickerVisible(true)}>
                <MaterialIcons name="arrow-drop-down" size={36} color="#25292e" />{' '}
              </Pressable>
            </View>
          </View>
        </View>
      </View>
      <RightHeaderMenu
        modalVisible={headerMenuModalVisible}
        setModalVisible={setHeaderMenuModalVisible}
        buttons={rightHeaderMenuButtons}
      />
      <BottomSheetContainer
        isVisible={isListPickerVisible}
        onClose={onListPickerModalClose}
        title="Select an option"
        showOkCancel
        isOkEnabled={isOkToSaveSelectedValue}
      >
        <OptionList options={pickerOptions} onSelect={(option) => onOptionSelected(option.label)} />
      </BottomSheetContainer>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  headerContainer: {
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  itemContainer: {
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  circleButtonContainer: {
    width: 42,
    height: 42,
    marginHorizontal: 10,
    borderWidth: 4,
    borderRadius: 21,
    padding: 0,
  },

  circleButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 21,
  },
});

export default JobDetailsPage;
