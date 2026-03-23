// OkayCancelButtons removed — updates applied on input blur
import BottomSheetContainer from '@/src/components/BottomSheetContainer';
import OptionList, { OptionEntry } from '@/src/components/OptionList';
import { OptionPickerItem } from '@/src/components/OptionPickerItem';
import { Text, TextInput, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import { useNetwork } from '@/src/context/NetworkContext';
// import { useWorkCategoryItemDataStore } from '@/stores/categoryItemDataStore';
import {
  useAllRows,
  useSetWorkItemAccountingIdsCallback,
  useTableValue,
  useUpdateRowCallback,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import {
  USE_DEFAULT_EXPENSE_ACCOUNT_LABEL,
  USE_DEFAULT_EXPENSE_ACCOUNT_OPTION_VALUE,
} from '@/src/utils/quickbooksWorkItemAccounts';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DEFAULT_EXPENSE_ACCOUNT_OPTION: OptionEntry = {
  label: USE_DEFAULT_EXPENSE_ACCOUNT_LABEL,
  value: USE_DEFAULT_EXPENSE_ACCOUNT_OPTION_VALUE,
};

const EditWorkItem = () => {
  const { categoryId, itemId } = useLocalSearchParams<{ categoryId: string; itemId: string }>();
  const colors = useColors();
  const { isQuickBooksConnected } = useNetwork();
  const applyWorkItemUpdates = useUpdateRowCallback('workItems');
  const setWorkItemAccountingIds = useSetWorkItemAccountingIdsCallback();
  const allAccounts = useAllRows('accounts');
  const name = useTableValue('workItems', itemId, 'name');
  const [newName, setNewName] = useState(name);
  const code = useTableValue('workItems', itemId, 'code');
  const status = useTableValue('workItems', itemId, 'status');
  const accountingId = useTableValue('workItems', itemId, 'accountingId');
  const [newCode, setNewCode] = useState(code);
  const [isExpenseAccountPickerVisible, setIsExpenseAccountPickerVisible] = useState(false);
  const [selectedExpenseAccountOption, setSelectedExpenseAccountOption] = useState<OptionEntry>(
    DEFAULT_EXPENSE_ACCOUNT_OPTION,
  );

  const expenseAccountOptions = useMemo(() => {
    const expenseAccounts = allAccounts
      .filter((account) => account.accountType === 'Expense' || account.accountType === 'Cost of Goods Sold')
      .sort((a, b) => {
        const typeOrder = (type: string) => (type === 'Cost of Goods Sold' ? 0 : 1);
        const typeCompare = typeOrder(a.accountType) - typeOrder(b.accountType);
        if (typeCompare !== 0) return typeCompare;
        return a.name.localeCompare(b.name);
      })
      .map((account) => ({
        label: account.name,
        value: account.accountingId,
      }));

    return [DEFAULT_EXPENSE_ACCOUNT_OPTION, ...expenseAccounts];
  }, [allAccounts]);

  const shouldShowExpenseAccountPicker = isQuickBooksConnected && allAccounts.length > 0;

  useEffect(() => {
    if (!accountingId) {
      setSelectedExpenseAccountOption(DEFAULT_EXPENSE_ACCOUNT_OPTION);
      return;
    }

    const match = expenseAccountOptions.find((option) => option.value === accountingId);
    setSelectedExpenseAccountOption(match ?? DEFAULT_EXPENSE_ACCOUNT_OPTION);
  }, [accountingId, expenseAccountOptions]);

  const handleBlur = useCallback(() => {
    if (!itemId) return;
    if (newName.length && newCode.length) {
      applyWorkItemUpdates(itemId, {
        id: itemId,
        categoryId: categoryId,
        code: newCode,
        name: newName,
        status,
      });
    } else {
      if (newName.length === 0) setNewName(name);
      if (newCode.length === 0) setNewCode(code);
    }
  }, [itemId, newName, newCode, categoryId, status, applyWorkItemUpdates, name, code]);

  const handleExpenseAccountSelect = useCallback(
    (option: OptionEntry) => {
      if (!itemId) return;

      const mappedAccountingId =
        option.value === USE_DEFAULT_EXPENSE_ACCOUNT_OPTION_VALUE ? undefined : option.value;
      const result = setWorkItemAccountingIds([itemId], mappedAccountingId);
      if (result.status !== 'Success') {
        return;
      }

      setSelectedExpenseAccountOption(option);
      setIsExpenseAccountPickerVisible(false);
    },
    [itemId, setWorkItemAccountingIds],
  );

  if (!name || !code) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!itemId) {
    return (
      <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Edit Cost Item',
            headerBackTitle: '',
            headerBackButtonDisplayMode: 'minimal',
          }}
        />

        <View style={styles.container}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Edit Work Item',
          headerBackTitle: '',
          headerBackButtonDisplayMode: 'minimal',
        }}
      />

      <View style={styles.container}>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          placeholder="Name"
          placeholderTextColor={colors.textPlaceholder}
          value={newName}
          onChangeText={setNewName}
          onBlur={handleBlur}
        />
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          placeholder="Code"
          placeholderTextColor={colors.textPlaceholder}
          keyboardType="number-pad"
          value={newCode}
          onChangeText={setNewCode}
          onBlur={handleBlur}
        />

        {shouldShowExpenseAccountPicker && (
          <OptionPickerItem
            editable={false}
            label="Expense Account"
            optionLabel={selectedExpenseAccountOption.label}
            onPickerButtonPress={() => setIsExpenseAccountPickerVisible(true)}
            placeholder="Select Expense Account"
            containerStyle={styles.optionPickerContainer}
          />
        )}
      </View>

      {shouldShowExpenseAccountPicker && (
        <BottomSheetContainer
          isVisible={isExpenseAccountPickerVisible}
          onClose={() => setIsExpenseAccountPickerVisible(false)}
          modalHeight="70%"
          title="Select Expense Account"
        >
          <OptionList
            options={expenseAccountOptions}
            onSelect={handleExpenseAccountSelect}
            selectedOption={selectedExpenseAccountOption}
            showOkCancel={false}
            enableSearch={true}
            searchPlaceholder="Search expense accounts..."
          />
        </BottomSheetContainer>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  input: {
    height: 40,
    borderWidth: 1,
    marginBottom: 12,
    paddingLeft: 8,
    borderRadius: 4,
  },
  optionPickerContainer: {
    marginTop: 4,
  },
  saveButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 18,
  },
});

export default EditWorkItem;
