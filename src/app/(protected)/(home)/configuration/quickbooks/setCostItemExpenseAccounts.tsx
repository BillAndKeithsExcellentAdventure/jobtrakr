import { ActionButton } from '@/src/components/ActionButton';
import BottomSheetContainer from '@/src/components/BottomSheetContainer';
import OptionList, { OptionEntry } from '@/src/components/OptionList';
import { OptionPickerItem } from '@/src/components/OptionPickerItem';
import { Text, TextInput, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import {
  AccountData,
  useAllRows,
  useSetWorkItemAccountingIdsCallback,
  WorkCategoryCodeCompareAsNumber,
  WorkItemDataCodeCompareAsNumber,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import {
  getQuickBooksAccountName,
  USE_DEFAULT_EXPENSE_ACCOUNT_LABEL,
  USE_DEFAULT_EXPENSE_ACCOUNT_OPTION_VALUE,
} from '@/src/utils/quickbooksWorkItemAccounts';
import { MaterialIcons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Platform, Pressable, StyleSheet, TouchableOpacity } from 'react-native';
import { KeyboardAvoidingView, KeyboardToolbar } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IOS_KEYBOARD_TOOLBAR_OFFSET } from '@/src/constants/app-constants';

type WorkItemListEntry = {
  id: string;
  label: string;
  accountName: string;
  sortCategoryCode: number;
  sortItemCode: number;
  accountNameColor: string;
};

const DEFAULT_EXPENSE_ACCOUNT_OPTION: OptionEntry = {
  label: USE_DEFAULT_EXPENSE_ACCOUNT_LABEL,
  value: USE_DEFAULT_EXPENSE_ACCOUNT_OPTION_VALUE,
};

const SetCostItemExpenseAccountsScreen = () => {
  const colors = useColors();
  const allWorkItems = useAllRows('workItems', WorkItemDataCodeCompareAsNumber);
  const allCategories = useAllRows('categories', WorkCategoryCodeCompareAsNumber);
  const allAccounts = useAllRows('accounts');
  const setWorkItemAccountingIds = useSetWorkItemAccountingIdsCallback();

  const [searchText, setSearchText] = useState('');
  const [selectedWorkItemIds, setSelectedWorkItemIds] = useState<string[]>([]);
  const [isAccountPickerVisible, setIsAccountPickerVisible] = useState(false);
  const [selectedAccountOption, setSelectedAccountOption] = useState<OptionEntry>(
    DEFAULT_EXPENSE_ACCOUNT_OPTION,
  );

  const expenseAccounts = useMemo(() => {
    const qbExpenseAccounts = allAccounts
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

    return [DEFAULT_EXPENSE_ACCOUNT_OPTION, ...qbExpenseAccounts];
  }, [allAccounts]);

  const workItemEntries = useMemo<WorkItemListEntry[]>(() => {
    const visibleWorkItems = allWorkItems.filter((workItem) => !workItem.hidden);

    return visibleWorkItems
      .map((workItem) => {
        const category = allCategories.find((item) => item.id === workItem.categoryId);
        const categoryCode = category?.code ? `${category.code}.` : '';
        const accountName = getQuickBooksAccountName(workItem.accountingId, allAccounts as AccountData[]);
        const accountNameColor = workItem.accountingId ? colors.text : colors.textDim;

        return {
          id: workItem.id,
          label: `${categoryCode}${workItem.code} - ${workItem.name}`,
          accountName,
          accountNameColor,
          sortCategoryCode: Number.parseFloat(category?.code ?? '0'),
          sortItemCode: Number.parseFloat(workItem.code),
        };
      })
      .sort((left, right) => {
        if (left.sortCategoryCode !== right.sortCategoryCode) {
          return left.sortCategoryCode - right.sortCategoryCode;
        }

        return left.sortItemCode - right.sortItemCode;
      });
  }, [allAccounts, allCategories, allWorkItems]);

  const filteredWorkItemEntries = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();
    if (!normalizedSearch) {
      return workItemEntries;
    }

    return workItemEntries.filter(
      (entry) =>
        entry.label.toLowerCase().includes(normalizedSearch) ||
        entry.accountName.toLowerCase().includes(normalizedSearch),
    );
  }, [searchText, workItemEntries]);

  const toggleWorkItemSelection = useCallback((workItemId: string) => {
    setSelectedWorkItemIds((currentIds) =>
      currentIds.includes(workItemId)
        ? currentIds.filter((id) => id !== workItemId)
        : [...currentIds, workItemId],
    );
  }, []);

  const handleAccountSelected = useCallback((option: OptionEntry) => {
    setSelectedAccountOption(option);
    setIsAccountPickerVisible(false);
  }, []);

  const handleApplySelectedAccount = useCallback(() => {
    if (selectedWorkItemIds.length === 0) {
      return;
    }

    const accountingIdToApply =
      selectedAccountOption.value === USE_DEFAULT_EXPENSE_ACCOUNT_OPTION_VALUE
        ? undefined
        : selectedAccountOption.value;

    const result = setWorkItemAccountingIds(selectedWorkItemIds, accountingIdToApply);
    if (result.status !== 'Success') {
      Alert.alert('Error', 'Unable to update cost item expense accounts.');
      return;
    }

    setSelectedWorkItemIds([]);
    Alert.alert('Success', 'Cost item expense accounts updated successfully.');
  }, [selectedAccountOption.value, selectedWorkItemIds, setWorkItemAccountingIds]);

  const actionButtonTitle = useMemo(() => {
    if (selectedWorkItemIds.length === 0) {
      return 'Set 0 Items to Selected Account';
    }

    return `Set ${selectedWorkItemIds.length} Items to Selected Account`;
  }, [selectedWorkItemIds.length]);

  return (
    <>
      <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Set Cost Item Expense Accounts',
            headerBackTitle: '',
            headerBackButtonDisplayMode: 'minimal',
          }}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={0}
        >
          <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.topSection}>
              <OptionPickerItem
                editable={false}
                label="Expense Account"
                optionLabel={selectedAccountOption.label}
                onPickerButtonPress={() => setIsAccountPickerVisible(true)}
                placeholder="Select Expense Account"
              />
            </View>

            <View style={styles.filterSection}>
              <Text txtSize="sub-title" style={styles.sectionTitle}>
                Cost Items
              </Text>
              <View style={[styles.filterRow, { borderColor: colors.border }]}>
                <View
                  style={[
                    styles.filterInputContainer,
                    { backgroundColor: colors.inputBackground, borderColor: colors.border },
                  ]}
                >
                  <TextInput
                    style={[styles.filterInput, { borderColor: 'transparent', color: colors.text }]}
                    placeholder="Filter cost items..."
                    placeholderTextColor={colors.textPlaceholder}
                    value={searchText}
                    onChangeText={setSearchText}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                <Pressable
                  onPress={() => setSearchText('')}
                  style={[styles.clearButton, { backgroundColor: colors.background }]}
                >
                  <MaterialIcons name="clear" size={24} color={colors.iconColor} />
                </Pressable>
              </View>
            </View>

            <View style={styles.listSection}>
              <FlatList
                data={filteredWorkItemEntries}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.listContentContainer}
                renderItem={({ item }) => {
                  const isSelected = selectedWorkItemIds.includes(item.id);
                  return (
                    <TouchableOpacity
                      style={[
                        styles.workItemRow,
                        {
                          borderColor: isSelected ? colors.iconColor : colors.border,
                        },
                      ]}
                      onPress={() => toggleWorkItemSelection(item.id)}
                    >
                      <View style={styles.workItemTextContainer}>
                        <Text numberOfLines={1} style={{ color: colors.text }}>
                          {item.label}
                        </Text>
                        <Text txtSize="xxs" style={{ color: item.accountNameColor, marginTop: 2 }}>
                          {item.accountName}
                        </Text>
                      </View>
                      {isSelected && <MaterialIcons name="check" size={24} color={colors.iconColor} />}
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={() => (
                  <View style={styles.emptyState}>
                    <Text txtSize="title">No Cost Items Found</Text>
                    <Text style={{ textAlign: 'center', marginTop: 8 }}>
                      Adjust the filter or add cost items in configuration first.
                    </Text>
                  </View>
                )}
              />
            </View>

            <View style={[styles.actionSection, { backgroundColor: colors.listBackground }]}>
              <ActionButton
                onPress={handleApplySelectedAccount}
                type={selectedWorkItemIds.length > 0 ? 'action' : 'disabled'}
                title={actionButtonTitle}
              />
            </View>
          </View>
        </KeyboardAvoidingView>

        <BottomSheetContainer
          isVisible={isAccountPickerVisible}
          onClose={() => setIsAccountPickerVisible(false)}
          modalHeight="70%"
          title="Select Expense Account"
        >
          <OptionList
            options={expenseAccounts}
            onSelect={handleAccountSelected}
            selectedOption={selectedAccountOption}
            showOkCancel={false}
            enableSearch={true}
            searchPlaceholder="Search expense accounts..."
          />
        </BottomSheetContainer>
      </SafeAreaView>
      {Platform.OS === 'ios' && <KeyboardToolbar offset={{ opened: IOS_KEYBOARD_TOOLBAR_OFFSET }} />}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
  },
  topSection: {
    marginBottom: 16,
  },
  filterSection: {
    marginBottom: 12,
  },
  sectionTitle: {
    marginBottom: 8,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
  },
  filterInputContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  filterInput: {
    height: 44,
  },
  clearButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listSection: {
    flex: 1,
  },
  listContentContainer: {
    paddingBottom: 8,
  },
  workItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 8,
  },
  workItemTextContainer: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  actionSection: {
    marginTop: 8,
    marginBottom: 8,
    paddingTop: 8,
  },
});

export default SetCostItemExpenseAccountsScreen;
