import { ActionButton } from '@/src/components/ActionButton';
import BottomSheetContainer from '@/src/components/BottomSheetContainer';
import { KeyboardSpacer } from '@/src/components/KeyboardSpacer';
import { NumberInputField } from '@/src/components/NumberInputField';
import OptionList, { OptionEntry } from '@/src/components/OptionList';
import { OptionPickerItem } from '@/src/components/OptionPickerItem';
import { Text, View } from '@/src/components/Themed';
import { useKeyboardGradualAnimation } from '@/src/components/useKeyboardGradualAnimation';
import { ColorSchemeColors, useColors } from '@/src/context/ColorsContext';
import { useFocusManager } from '@/src/hooks/useFocusManager';
import {
  useAllRows as useAllRowsConfiguration,
  WorkCategoryCodeCompareAsNumber,
  WorkCategoryData,
  WorkItemData,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { useProject, useUpdateProjectCallback } from '@/src/tbStores/listOfProjects/ListOfProjectsStore';
import {
  useAllRows,
  useUpdateRowCallback,
  WorkItemSummaryData,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { formatCurrency } from '@/src/utils/formatters';
import { FontAwesome6 } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, LayoutChangeEvent, Platform, StyleSheet } from 'react-native';
import { FlatList, Pressable } from 'react-native-gesture-handler';
import { KeyboardToolbar } from 'react-native-keyboard-controller';

const LISTITEM_HEIGHT = 40;
const ESTIMATE_FIELD_ID = 'estimate-input';

const SetEstimatedCostsPage = () => {
  const colors = useColors();
  const { projectId, projectName, categoryId } = useLocalSearchParams<{
    projectId: string;
    projectName: string;
    categoryId?: string;
  }>();

  const focusManager = useFocusManager();
  const [isCategoryPickerVisible, setIsCategoryPickerVisible] = useState<boolean>(false);
  const [pickedCategoryOption, setPickedCategoryOption] = useState<OptionEntry | undefined>(undefined);

  const allWorkItemCostSummaries = useAllRows(projectId, 'workItemSummaries');
  const updateWorkItemCostSummary = useUpdateRowCallback(projectId, 'workItemSummaries');
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

  useEffect(() => {
    if (categoryId && availableCategoriesOptions.length > 0) {
      const matchingOption = availableCategoriesOptions.find((o) => o.value === categoryId);
      if (matchingOption) {
        setPickedCategoryOption(matchingOption);
      }
    }
  }, [categoryId, availableCategoriesOptions]);

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

  const scrollToCurrentIndex = useCallback(() => {
    if (
      flatListRef.current &&
      allAvailableCostItems.length > 0 &&
      currentItemIndex >= 0 &&
      currentItemIndex < allAvailableCostItems.length
    ) {
      requestAnimationFrame(() => {
        // console.log(`scrollToIndex ${currentItemIndex}`);
        flatListRef.current?.scrollToOffset({
          offset: currentItemIndex * LISTITEM_HEIGHT,
          animated: true,
        });
      });
    }
  }, [currentItemIndex, allAvailableCostItems.length]);

  const { height } = useKeyboardGradualAnimation();

  useEffect(() => {
    scrollToCurrentIndex();
  }, [scrollToCurrentIndex]);

  useEffect(() => {
    const keyboardListener = Keyboard.addListener('keyboardDidShow', () => {
      scrollToCurrentIndex();
    });
    return () => keyboardListener.remove();
  }, [scrollToCurrentIndex]);

  const handleItemSelected = useCallback((index: number) => {
    setCurrentItemIndex(index);
  }, []);

  useEffect(() => {
    setCurrentCostSummary(allAvailableCostItems[currentItemIndex]);
    console.log('Set currentCostSummary to ', allAvailableCostItems[currentItemIndex]);
  }, [allAvailableCostItems, currentItemIndex]);

  useEffect(() => {
    console.log('Set itemEstimate to ', currentCostSummary ? currentCostSummary.bidAmount : 0);
    setItemEstimate(currentCostSummary ? currentCostSummary.bidAmount : 0);
  }, [currentCostSummary]);

  const handleCategoryChange = useCallback(
    (selectedCategory: OptionEntry) => {
      setPickedCategoryOption(selectedCategory);
      setCurrentItemIndex(0);
    },
    [allWorkCategories],
  );

  useEffect(() => {
    if (pickedCategoryOption) {
      setCurrentCategory(allWorkCategories.find((c) => c.id === pickedCategoryOption.value));
    }
  }, [pickedCategoryOption]);

  const handleCategoryOptionChange = (option: OptionEntry) => {
    if (option) {
      handleCategoryChange(option);
    }
    setIsCategoryPickerVisible(false);
  };

  const updateBidEstimate = useCallback(() => {
    if (!currentCostSummary) return;
    // Use FocusManager.getFieldValue to get the current value from the input field
    // without waiting for blur. This solves the issue where NumberInputField only
    // calls onChange on blur events.
    const newValue = focusManager.getFieldValue<number>(ESTIMATE_FIELD_ID) ?? 0;
    setTimeout(() => {
      updateWorkItemCostSummary(currentCostSummary.id, { ...currentCostSummary, bidAmount: newValue });
      setCurrentItemIndex((prev) => (prev < allAvailableCostItems.length - 1 ? prev + 1 : prev));
    }, 0);
  }, [currentCostSummary, updateWorkItemCostSummary, focusManager, allAvailableCostItems]);

  const skipToNext = useCallback(() => {
    if (!currentCostSummary) return;
    setCurrentItemIndex((prev) => (prev < allAvailableCostItems.length - 1 ? prev + 1 : prev));
  }, [currentCostSummary, allAvailableCostItems]);

  const prevLayoutHeightRef = useRef(0);

  const layoutChanged = useCallback(
    (event: LayoutChangeEvent): void => {
      const newLayout = event.nativeEvent.layout;
      if (Math.abs(newLayout.height - prevLayoutHeightRef.current) > 50) {
        prevLayoutHeightRef.current = newLayout.height;
        scrollToCurrentIndex();
      }
    },
    [scrollToCurrentIndex],
  );

  return (
    <>
      <Stack.Screen options={{ title: `${projectName}`, headerShown: true }} />
      <View style={styles.modalContainer}>
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
                        focusManagerId={ESTIMATE_FIELD_ID}
                        value={itemEstimate}
                        onChange={setItemEstimate}
                        placeholder="Estimated Amount"
                        autoFocus={true}
                        itemId={currentCostSummary?.id}
                      />
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                    <ActionButton
                      style={styles.saveButton}
                      onPress={updateBidEstimate}
                      type={'ok'}
                      title="Save"
                      triggerBlurOnPress={false}
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
                onLayout={layoutChanged}
                ref={flatListRef}
                style={{ borderTopWidth: 1, borderColor: colors.border }}
                data={allAvailableCostItems}
                keyExtractor={(item) => item.id}
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
              <KeyboardSpacer height={height} />
              {Platform.OS === 'ios' && <KeyboardToolbar />}
            </>
          )}
        </View>
      </View>
      {isCategoryPickerVisible && (
        <BottomSheetContainer
          modalHeight="70%"
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
    </>
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
          height: LISTITEM_HEIGHT,
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
  container: {
    flex: 1,
    justifyContent: 'flex-start', // Align items at the top vertically
    alignItems: 'center', // Center horizontally
    width: '100%',
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
  input: {
    borderWidth: 1,
    alignContent: 'stretch',
    justifyContent: 'center',
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

export default SetEstimatedCostsPage;
