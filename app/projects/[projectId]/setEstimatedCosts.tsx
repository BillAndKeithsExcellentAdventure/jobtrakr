import { ActionButton } from '@/components/ActionButton';
import BottomSheetContainer from '@/components/BottomSheetContainer';
import OptionList, { OptionEntry } from '@/components/OptionList';
import { Text, TextInput, View } from '@/components/Themed';
import { ColorSchemeColors, useColors } from '@/context/ColorsContext';
import { useProject, useUpdateProjectCallback } from '@/tbStores/listOfProjects/ListOfProjectsStore';
import {
  useAllRows,
  useUpdateRowCallback,
  WorkItemSummaryData,
} from '@/tbStores/projectDetails/ProjectDetailsStoreHooks';
import * as Location from 'expo-location';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Keyboard, StyleSheet, TouchableWithoutFeedback, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useAllRows as useAllRowsConfiguration,
  WorkCategoryCodeCompareAsNumber,
  WorkCategoryData,
  WorkItemData,
  WorkItemDataCodeCompareAsNumber,
} from '@/tbStores/configurationStore/ConfigurationStoreHooks';
import { OptionPickerItem } from '@/components/OptionPickerItem';
import { NumberInputField } from '@/components/NumberInputField';
import { FlatList, Pressable } from 'react-native-gesture-handler';
import { formatCurrency } from '@/utils/formatters';
import { FontAwesome6 } from '@expo/vector-icons';
import { useResultRowCountListener } from 'tinybase/ui-react';

const SetEstimatedCostsPage = () => {
  const colors = useColors();
  const router = useRouter();
  const { projectId, projectName } = useLocalSearchParams<{ projectId: string; projectName: string }>();
  const currentProject = useProject(projectId);
  const updatedProject = useUpdateProjectCallback();
  const [isCategoryPickerVisible, setIsCategoryPickerVisible] = useState<boolean>(false);
  const [pickedCategoryOption, setPickedCategoryOption] = useState<OptionEntry | undefined>(undefined);

  const allWorkItemCostSummaries = useAllRows(projectId, 'workItemSummaries');
  const updateWorkItemCostSummary = useUpdateRowCallback(projectId, 'workItemSummaries');
  const allLineItemCostEntries = useAllRows(projectId, 'workItemCostEntries');
  const allWorkItems = useAllRowsConfiguration('workItems');
  const allWorkCategories = useAllRowsConfiguration('categories', WorkCategoryCodeCompareAsNumber);
  const availableCategoriesOptions: OptionEntry[] = useMemo(() => {
    // get a list of all unique workitemids from allWorkItemCostSummaries available in the project
    const uniqueWorkItemIds = allWorkItemCostSummaries.map((item) => item.workItemId);

    // now get list of all unique categoryIds from allWorkItems given list of uniqueWorkItemIds
    const uniqueCategoryIds = allWorkItems
      .filter((item) => uniqueWorkItemIds.includes(item.id))
      .map((item) => item.categoryId);

    // now get an array of OptionEntry for each entry in uniqueCategoryIds using allWorkCategories
    const uniqueCategories = allWorkCategories
      .filter((item) => uniqueCategoryIds.includes(item.id))
      .map((item) => ({
        label: item.name,
        value: item.id,
      }));
    return uniqueCategories;
  }, [allWorkItemCostSummaries, allWorkItems, allWorkCategories]);

  const allAvailableCostItems: WorkItemSummaryData[] = useMemo(() => {
    const currentCategoryId = pickedCategoryOption ? pickedCategoryOption.value : '';
    const categorySpecificWorkItemIds = allWorkItems
      .filter((item) => item.categoryId === currentCategoryId)
      .map((wi) => wi.id);
    return allWorkItemCostSummaries.filter((item) => categorySpecificWorkItemIds.includes(item.workItemId));
  }, [allWorkItemCostSummaries, allWorkItems, pickedCategoryOption]);

  const [currentCostSummary, setCurrentCostSummary] = useState<WorkItemSummaryData | undefined | null>();
  const [currentItemIndex, setCurrentItemIndex] = useState<number>(0);
  const [currentCategory, setCurrentCategory] = useState<WorkCategoryData | null>();
  const [itemEstimate, setItemEstimate] = useState(0);

  const flatListRef = React.useRef<FlatList>(null);

  const scrollToIndex = useCallback((index: number) => {
    flatListRef.current?.scrollToIndex({
      index,
      animated: true,
      viewPosition: 1.0,
    });
  }, []);

  useEffect(() => {
    scrollToIndex(currentItemIndex);
  }, [currentItemIndex, scrollToIndex]);

  useEffect(() => {
    const keyboardListener = Keyboard.addListener('keyboardDidShow', () => {
      scrollToIndex(currentItemIndex);
    });
    return () => keyboardListener.remove();
  }, [currentItemIndex, scrollToIndex]);

  const handleItemSelected = useCallback((index: number) => {
    setCurrentItemIndex(index);
  }, []);

  useEffect(() => {
    setCurrentCostSummary(allAvailableCostItems[currentItemIndex]);
  }, [allAvailableCostItems, currentItemIndex]);

  useEffect(() => {
    setItemEstimate(currentCostSummary ? currentCostSummary.bidAmount : 0);
  }, [currentCostSummary]);

  const handleCategoryChange = useCallback(
    (selectedCategory: OptionEntry) => {
      setPickedCategoryOption(selectedCategory);
      setCurrentCategory(allWorkCategories.find((c) => c.id === selectedCategory.value));
      setCurrentItemIndex(0);
    },
    [allWorkCategories],
  );

  const handleCategoryOptionChange = (option: OptionEntry) => {
    if (option) {
      handleCategoryChange(option);
    }
    setIsCategoryPickerVisible(false);
  };

  const updateBidEstimate = useCallback(() => {
    if (!currentCostSummary) return;
    updateWorkItemCostSummary(currentCostSummary.id, { ...currentCostSummary, bidAmount: itemEstimate });
    if (currentItemIndex < allAvailableCostItems.length - 1) setCurrentItemIndex(currentItemIndex + 1);
  }, [currentCostSummary, updateWorkItemCostSummary, itemEstimate, currentItemIndex, allAvailableCostItems]);

  const skipToNext = useCallback(() => {
    if (!currentCostSummary) return;
    if (currentItemIndex < allAvailableCostItems.length - 1) setCurrentItemIndex(currentItemIndex + 1);
  }, [currentCostSummary, currentItemIndex, allAvailableCostItems]);

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
      <Stack.Screen options={{ title: `${projectName}`, headerShown: true }} />

      <View
        style={[
          styles.container,
          styles.modalBackground,
          { backgroundColor: colors.modalOverlayBackgroundColor },
        ]}
      >
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <KeyboardAvoidingView
            style={styles.modalContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 105}
          >
            <View style={{ flex: 1 }}>
              <View style={{ paddingHorizontal: 10 }}>
                <Text txtSize="sub-title" style={styles.modalTitle}>
                  Set Price Estimates
                </Text>
                <OptionPickerItem
                  containerStyle={styles.inputContainer}
                  optionLabel={pickedCategoryOption?.label}
                  label="Category"
                  placeholder="Select a Category"
                  editable={false}
                  onPickerButtonPress={() => setIsCategoryPickerVisible(true)}
                />
              </View>
              {allAvailableCostItems.length > 0 && (
                <>
                  <View
                    style={{
                      width: '100%',
                      backgroundColor: colors.listBackground,
                      padding: 10,
                      marginVertical: 10,
                    }}
                  >
                    <View
                      style={{
                        borderRadius: 5,
                        padding: 10,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                        }}
                      >
                        <Text text="Estimate" txtSize="standard" style={{ marginRight: 10 }} />
                        <View style={{ flex: 1 }}>
                          <NumberInputField
                            value={itemEstimate}
                            onChange={setItemEstimate}
                            placeholder="Estimated Amount"
                          />
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                        <ActionButton
                          style={styles.saveButton}
                          onPress={updateBidEstimate}
                          type={'ok'}
                          title="Save"
                        />
                        <ActionButton
                          style={styles.cancelButton}
                          onPress={skipToNext}
                          type={'cancel'}
                          title="Skip"
                        />
                      </View>
                    </View>
                  </View>
                  <FlatList
                    keyboardShouldPersistTaps="handled"
                    ref={flatListRef}
                    style={{ borderTopWidth: 1, borderColor: colors.border }}
                    data={allAvailableCostItems}
                    keyExtractor={(item) => item.id}
                    getItemLayout={(data, index) => ({
                      length: 40,
                      offset: 40 * index,
                      index,
                    })}
                    renderItem={({ item, index }) =>
                      renderItem(
                        item,
                        index,
                        currentItemIndex,
                        currentCategory,
                        colors,
                        handleItemSelected,
                        allWorkItems.find((wi) => wi.id === item.workItemId),
                      )
                    }
                  />
                </>
              )}
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </View>
      {isCategoryPickerVisible && (
        <BottomSheetContainer
          isVisible={isCategoryPickerVisible}
          onClose={() => setIsCategoryPickerVisible(false)}
        >
          <OptionList
            options={availableCategoriesOptions}
            onSelect={(option) => handleCategoryOptionChange(option)}
            selectedOption={pickedCategoryOption}
          />
        </BottomSheetContainer>
      )}
    </SafeAreaView>
  );
};

const renderItem = (
  item: WorkItemSummaryData,
  index: number,
  selectedIndex: number,
  currentCategory: WorkCategoryData | null | undefined,
  colors: ColorSchemeColors,
  onItemSelected: (index: number) => void,
  workItem: WorkItemData | undefined,
) => {
  const itemLabel = `${currentCategory?.code}.${workItem?.code} - ${workItem?.name}`;
  return (
    <Pressable onPress={() => onItemSelected(index)}>
      <View
        style={{
          flexDirection: 'row',
          height: 40,
          paddingLeft: 5,
          alignItems: 'center',
          borderBottomWidth: StyleSheet.hairlineWidth,
        }}
      >
        <Text
          numberOfLines={1}
          style={{ flex: 1, textOverflow: 'ellipsis', overflow: 'hidden' }}
          text={itemLabel}
        />
        <Text
          style={{ width: 100, textAlign: 'right', overflow: 'hidden' }}
          text={formatCurrency(item.bidAmount, false, true)}
        />
        <View style={{ width: 41, paddingLeft: 5, alignItems: 'center' }}>
          {index === selectedIndex && (
            <FontAwesome6 name="hand-point-left" size={28} color={colors.iconColor} />
          )}
        </View>
      </View>
    </Pressable>
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
  },
  dateContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalContainer: {
    flex: 1,
    maxWidth: 460,
    width: '100%',
  },
  modalTitle: {
    marginTop: 5,
    textAlign: 'center',
    fontWeight: 'bold',
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

export default SetEstimatedCostsPage;
