import { ActionButton } from '@/components/ActionButton';
import BottomSheetContainer from '@/components/BottomSheetContainer';
import { NumberInputField } from '@/components/NumberInputField';
import OptionList, { OptionEntry } from '@/components/OptionList';
import { OptionPickerItem } from '@/components/OptionPickerItem';
import { TextField } from '@/components/TextField';
import { View } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import { useJobDb } from '@/context/DatabaseContext';
import { ReceiptItemEntry, useItemizedReceiptDataStore } from '@/stores/itemizedReceiptDataStore';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const AddReceiptLineItemPage = () => {
  const router = useRouter();
  const { receiptId } = useLocalSearchParams<{ receiptId: string }>();
  const { allReceiptItems, updateReceiptItem } = useItemizedReceiptDataStore();
  const { jobDbHost } = useJobDb();
  const colorScheme = useColorScheme();
  const colors = useMemo(
    () =>
      colorScheme === 'dark'
        ? {
            separatorColor: Colors.dark.separatorColor,
            borderColor: Colors.dark.borderColor,
            iconColor: Colors.dark.iconColor,
          }
        : {
            separatorColor: Colors.light.separatorColor,
            borderColor: Colors.light.borderColor,
            iconColor: Colors.light.iconColor,
          },
    [colorScheme],
  );

  const [isCategoryPickerVisible, setIsCategoryPickerVisible] = useState<boolean>(false);
  const [pickedCategoryOption, setPickedCategoryOption] = useState<OptionEntry | undefined>(undefined);
  const [categories, setCategories] = useState<OptionEntry[]>([
    { label: 'Site', value: 1 },
    { label: 'Concrete', value: 2 },
    { label: 'Framing', value: 3 },
    { label: 'Window & Doors', value: 4 },
    { label: 'Plumbing', value: 5 },
    { label: 'HVAC', value: 6 },
    { label: 'Wiring', value: 7 },
    { label: 'Other', value: 999 },
  ]);

  const [isSubCategoryPickerVisible, setIsSubCategoryPickerVisible] = useState<boolean>(false);
  const [pickedSubCategoryOption, setSubPickedCategoryOption] = useState<OptionEntry | undefined>(undefined);
  const [subCategories, setSubCategories] = useState<OptionEntry[]>([
    { label: 'Not Specified', value: 0 },
    { label: 'Other', value: 999 },
  ]);

  const handleSubCategoryOptionChange = (option: OptionEntry) => {
    if (option) {
      handleSubCategoryChange(option.label);
    }
    setIsSubCategoryPickerVisible(false);
  };

  const handleCategoryOptionChange = (option: OptionEntry) => {
    if (option) {
      handleCategoryChange(option.label);
    }
    setIsCategoryPickerVisible(false);
  };

  const initItemizedEntry: ReceiptItemEntry = {
    label: '',
    amount: 0,
    receiptId,
  };

  const [itemizedEntry, setItemizedEntry] = useState<ReceiptItemEntry>(initItemizedEntry);

  const handleSubCategoryChange = useCallback((selectedSubCategory: string) => {
    setItemizedEntry((prevItem) => ({
      ...prevItem,
      subCategory: selectedSubCategory,
    }));
  }, []);

  const handleCategoryChange = useCallback((selectedCategory: string) => {
    setItemizedEntry((prevItem) => ({
      ...prevItem,
      category: selectedCategory,
    }));
  }, []);

  useEffect(() => {
    const match = categories.find((o) => o.label === itemizedEntry.category);
    setPickedCategoryOption(match);
  }, [itemizedEntry, categories]);

  const handleOkPress = useCallback(async () => {
    if (itemizedEntry._id) {
      const status = 'Success'; // await jobDbHost?.GetReceiptBucketDB().UpdateReceipt(itemizedEntry);
      if (status === 'Success') {
        updateReceiptItem(itemizedEntry._id, itemizedEntry);
      } else {
        console.log('Receipt update failed:', itemizedEntry);
      }
    }
    router.back();
  }, [itemizedEntry]);

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1, overflowY: 'hidden' }}>
      <Stack.Screen options={{ title: 'Add Receipt Line Item', headerShown: true }} />
      <View style={[styles.container, { borderColor: colors.borderColor }]}>
        <NumberInputField
          style={styles.inputContainer}
          label="Amount"
          value={itemizedEntry.amount}
          onChange={(value: number): void => {
            setItemizedEntry((prevItem) => ({
              ...prevItem,
              Amount: value,
            }));
          }}
        />
        <TextField
          containerStyle={styles.inputContainer}
          placeholder="Description"
          label="Description"
          value={itemizedEntry.label}
          onChangeText={(text): void => {
            setItemizedEntry((prevItem) => ({
              ...prevItem,
              Description: text,
            }));
          }}
        />
        <OptionPickerItem
          containerStyle={styles.inputContainer}
          optionLabel={itemizedEntry.category}
          label="Category"
          placeholder="Category"
          onOptionLabelChange={handleCategoryChange}
          onPickerButtonPress={() => setIsCategoryPickerVisible(true)}
        />
        <OptionPickerItem
          containerStyle={styles.inputContainer}
          optionLabel={itemizedEntry.subCategory}
          label="Sub-category"
          placeholder="Sub-category"
          onOptionLabelChange={handleSubCategoryChange}
          onPickerButtonPress={() => setIsSubCategoryPickerVisible(true)}
        />

        <View style={styles.saveButtonRow}>
          <ActionButton style={styles.saveButton} onPress={handleOkPress} type={'ok'} title="Save" />

          <ActionButton
            style={styles.cancelButton}
            onPress={() => {
              router.back();
            }}
            type={'cancel'}
            title="Cancel"
          />
        </View>
        {isCategoryPickerVisible && (
          <BottomSheetContainer
            isVisible={isCategoryPickerVisible}
            onClose={() => setIsCategoryPickerVisible(false)}
          >
            <OptionList
              options={categories}
              onSelect={(option) => handleCategoryOptionChange(option)}
              selectedOption={pickedCategoryOption}
            />
          </BottomSheetContainer>
        )}
        {isSubCategoryPickerVisible && (
          <BottomSheetContainer
            isVisible={isSubCategoryPickerVisible}
            onClose={() => setIsSubCategoryPickerVisible(false)}
          >
            <OptionList
              options={subCategories}
              onSelect={(option) => handleSubCategoryOptionChange(option)}
              selectedOption={pickedSubCategoryOption}
            />
          </BottomSheetContainer>
        )}
      </View>
    </SafeAreaView>
  );
};

export default AddReceiptLineItemPage;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    width: '100%',
  },
  inputContainer: {
    marginTop: 6,
  },
  itemContainer: {
    flexDirection: 'row',
    margin: 10,
    borderRadius: 15,
    padding: 10,
    height: 100,
  },
  saveButtonRow: {
    marginVertical: 20,
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
