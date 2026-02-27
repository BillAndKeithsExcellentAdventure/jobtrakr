import { ActionButton } from '@/src/components/ActionButton';
import BottomSheetContainer from '@/src/components/BottomSheetContainer';
import { KeyboardSpacer } from '@/src/components/KeyboardSpacer';
import { NumberInputField } from '@/src/components/NumberInputField';
import OptionList, { OptionEntry } from '@/src/components/OptionList';
import { OptionPickerItem } from '@/src/components/OptionPickerItem';
import { Text, TextInput, View } from '@/src/components/Themed';
import { useKeyboardGradualAnimation } from '@/src/components/useKeyboardGradualAnimation';
import { IOS_KEYBOARD_TOOLBAR_OFFSET } from '@/src/constants/app-constants';
import { ColorSchemeColors, useColors } from '@/src/context/ColorsContext';
import { useFocusManager } from '@/src/hooks/useFocusManager';
import { useProjectWorkItems } from '@/src/hooks/useProjectWorkItems';
import { WorkCategoryData, WorkItemData } from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import {
  useAllRows,
  useUpdateRowCallback,
  WorkItemSummaryData,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { formatCurrency } from '@/src/utils/formatters';
import { FontAwesome6 } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
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
  const { availableCategoriesOptions, allWorkItems, allWorkCategories } = useProjectWorkItems(projectId);

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
  const [itemNote, setItemNote] = useState('');

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
  }, [allAvailableCostItems, currentItemIndex]);

  useEffect(() => {
    setItemEstimate(currentCostSummary ? currentCostSummary.bidAmount : 0);
    setItemNote(currentCostSummary ? (currentCostSummary.bidNote ?? '') : '');
  }, [currentCostSummary]);

  const handleCategoryChange = useCallback((selectedCategory: OptionEntry) => {
    setPickedCategoryOption(selectedCategory);
    setCurrentItemIndex(0);
  }, []);

  useEffect(() => {
    if (pickedCategoryOption) {
      setCurrentCategory(allWorkCategories.find((c) => c.id === pickedCategoryOption.value));
    }
  }, [pickedCategoryOption, allWorkCategories]);

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
    updateWorkItemCostSummary(currentCostSummary.id, {
      ...currentCostSummary,
      bidAmount: newValue,
      bidNote: itemNote,
    });
    setTimeout(() => {
      setCurrentItemIndex((prev) => (prev < allAvailableCostItems.length - 1 ? prev + 1 : prev));
    }, 0);
  }, [currentCostSummary, updateWorkItemCostSummary, focusManager, allAvailableCostItems, itemNote]);
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
      <Stack.Screen
        options={{
          title: `${projectName}`,
          headerShown: true,
          headerBackTitle: '',
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
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
                    <Text
                      text="Est"
                      txtSize="standard"
                      style={{ width: 50, marginRight: 10, textAlign: 'right' }}
                    />
                    <View style={{ flex: 1 }}>
                      <NumberInputField
                        style={{ backgroundColor: colors.background }}
                        focusManagerId={ESTIMATE_FIELD_ID}
                        value={itemEstimate}
                        onChange={setItemEstimate}
                        placeholder="Estimated Amount"
                        autoFocus={true}
                        itemId={currentCostSummary?.id}
                      />
                    </View>
                  </View>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginTop: 5,
                    }}
                  >
                    <Text
                      text="Note"
                      txtSize="standard"
                      style={{ width: 50, marginRight: 10, textAlign: 'right' }}
                    />
                    <TextInput
                      value={itemNote}
                      onChangeText={setItemNote}
                      placeholder="Add a note"
                      style={{
                        flex: 1,
                        borderColor: colors.border,
                        borderWidth: 1,
                        borderRadius: 5,
                        padding: 5,
                      }}
                    />
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                    <ActionButton
                      style={styles.saveButton}
                      onPress={updateBidEstimate}
                      type={'ok'}
                      title="Save"
                      triggerBlurOnPress={true}
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
              {Platform.OS === 'ios' && <KeyboardToolbar offset={{ opened: IOS_KEYBOARD_TOOLBAR_OFFSET }} />}
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
            enableSearch={availableCategoriesOptions.length > 15}
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
          style={{ flex: 1, overflow: 'hidden' }}
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
