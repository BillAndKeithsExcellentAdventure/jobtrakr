import { ActionButton } from '@/src/components/ActionButton';
import { Text, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import { useNetwork } from '@/src/context/NetworkContext';
import {
  SettingsData,
  useAppSettings,
  useSetAppSettingsCallback,
} from '@/src/tbStores/appSettingsStore/appSettingsStoreHooks';
import {
  useAllRows,
  useAddRowCallback,
  useDeleteRowCallback,
  useConfigurationStore,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { importAccountsFromQuickBooks } from '@/src/utils/quickbooksImports';
import { sanitizeQuickBooksAccountSettings } from '@/src/utils/quickbooksAccountSettings';
import { useAuth } from '@clerk/clerk-expo';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import Octicons from '@expo/vector-icons/Octicons';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  GestureResponderEvent,
  Modal,
  Platform,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import RightHeaderMenu from '@/src/components/RightHeaderMenu';
import { ActionButtonProps } from '@/src/components/ButtonBar';
import { SvgImage } from '@/src/components/SvgImage';
import { SafeAreaView } from 'react-native-safe-area-context';
import OptionList, { OptionEntry } from '@/src/components/OptionList';
import BottomSheetContainer from '@/src/components/BottomSheetContainer';

const QBAccountsScreen = () => {
  const colors = useColors();
  const router = useRouter();
  const { isQuickBooksAccessible } = useNetwork();
  const auth = useAuth();
  const appSettings = useAppSettings();
  const setAppSettings = useSetAppSettingsCallback();
  const storedAccounts = useAllRows('accounts');
  const allAccounts = useAllRows('accounts');
  const addAccount = useAddRowCallback('accounts');
  const deleteAccount = useDeleteRowCallback('accounts');
  const configStore = useConfigurationStore();

  const [isLoading] = useState(false);
  const [headerMenuModalVisible, setHeaderMenuModalVisible] = useState<boolean>(false);
  const [processingInfo, setProcessingInfo] = useState<{ isProcessing: boolean; label: string }>({
    isProcessing: false,
    label: '',
  });
  const isProcessingRef = useRef(false);
  const processingDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startProcessing = useCallback((label: string) => {
    isProcessingRef.current = true;
    if (processingDelayTimerRef.current) {
      clearTimeout(processingDelayTimerRef.current);
      processingDelayTimerRef.current = null;
    }
    processingDelayTimerRef.current = setTimeout(() => {
      processingDelayTimerRef.current = null;
      if (isProcessingRef.current) {
        setProcessingInfo({ isProcessing: true, label });
      }
    }, 500);
  }, []);

  const stopProcessing = useCallback(() => {
    isProcessingRef.current = false;
    if (processingDelayTimerRef.current) {
      clearTimeout(processingDelayTimerRef.current);
      processingDelayTimerRef.current = null;
    }
    setProcessingInfo({ isProcessing: false, label: '' });
  }, []);
  const [expenseAccounts, setExpenseAccounts] = useState<OptionEntry[]>([]);
  const [paymentAccounts, setPaymentAccounts] = useState<OptionEntry[]>([]);
  const [selectedExpenseAccountId, setSelectedExpenseAccountId] = useState<string>(
    appSettings.quickBooksExpenseAccountId || '',
  );
  const [selectedPaymentAccountIds, setSelectedPaymentAccountIds] = useState<string[]>([]);
  const [defaultPaymentAccountId, setDefaultPaymentAccountId] = useState<string>(
    appSettings.quickBooksDefaultPaymentAccountId || '',
  );

  // Bottom sheet states
  const [isExpenseAccountPickerVisible, setIsExpenseAccountPickerVisible] = useState(false);
  const [isPaymentAccountPickerVisible, setIsPaymentAccountPickerVisible] = useState(false);

  // Track if accounts have been fetched to prevent multiple API calls
  const hasAccountsFetched = useRef(false);

  const handleGetQBAccounts = useCallback(async () => {
    if (!auth.orgId || !auth.userId) {
      Alert.alert('Error', 'Unable to get accounts. Please sign in again.');
      return;
    }
    if (isProcessingRef.current) {
      return;
    }

    startProcessing('Importing Accounts from QuickBooks...');
    try {
      const { addedCount, accounts } = await importAccountsFromQuickBooks(
        auth.orgId,
        auth.userId,
        auth.getToken,
        allAccounts,
        addAccount,
        deleteAccount,
        configStore,
      );

      const sanitizedSettings = sanitizeQuickBooksAccountSettings(appSettings, accounts);
      setAppSettings(sanitizedSettings);
      hasAccountsFetched.current = false; // Allow the accounts list to reload
      Alert.alert(
        'QuickBooks Account Import Complete',
        `${addedCount} Accounts imported successfully from QuickBooks.`,
      );
    } catch (error) {
      console.error('Error importing QuickBooks accounts:', error);
      Alert.alert('Error', 'Failed to import QuickBooks accounts');
    } finally {
      stopProcessing();
    }
  }, [
    auth.orgId,
    auth.userId,
    auth.getToken,
    allAccounts,
    addAccount,
    deleteAccount,
    configStore,
    appSettings,
    setAppSettings,
    startProcessing,
    stopProcessing,
  ]);

  // Sync selected expense account from settings
  useEffect(() => {
    if (appSettings.quickBooksExpenseAccountId) {
      setSelectedExpenseAccountId(appSettings.quickBooksExpenseAccountId);
    }
  }, [appSettings.quickBooksExpenseAccountId]);

  // Parse selected payment accounts from settings
  useEffect(() => {
    if (appSettings.quickBooksPaymentAccounts) {
      const ids = appSettings.quickBooksPaymentAccounts.split(',').filter((id) => id.trim() !== '');
      setSelectedPaymentAccountIds(ids);
    } else {
      setSelectedPaymentAccountIds([]);
    }
  }, [appSettings.quickBooksPaymentAccounts]);

  // If no default is set, use the first selected payment account
  useEffect(() => {
    if (!defaultPaymentAccountId && selectedPaymentAccountIds.length > 0) {
      setDefaultPaymentAccountId(selectedPaymentAccountIds[0]);
    }
  }, [defaultPaymentAccountId, selectedPaymentAccountIds]);

  // Sync default payment account from settings
  useEffect(() => {
    if (appSettings.quickBooksDefaultPaymentAccountId) {
      setDefaultPaymentAccountId(appSettings.quickBooksDefaultPaymentAccountId);
    }
  }, [appSettings.quickBooksDefaultPaymentAccountId]);

  // Load accounts from ConfigurationStore
  useEffect(() => {
    if (hasAccountsFetched.current) {
      return; // Already loaded during this session
    }

    if (storedAccounts.length === 0) {
      // No accounts in store
      setExpenseAccounts([]);
      setPaymentAccounts([]);
      return;
    }

    // Filter expense accounts (accountType === 'Expense' or 'Cost of Goods Sold')
    const expenseList = storedAccounts
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

    setExpenseAccounts(expenseList);

    // Filter payment accounts (Bank, Credit Card, Other Current Asset)
    const paymentList = storedAccounts
      .filter((account) => account.accountSubType === 'Checking' || account.accountSubType === 'CreditCard')
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((account) => ({
        label: account.name,
        value: account.accountingId,
      }));
    setPaymentAccounts(paymentList);
    hasAccountsFetched.current = true; // Mark as loaded
  }, [storedAccounts]);

  // Get display name for an account
  const getAccountName = useCallback((accountId: string, accountsList: OptionEntry[]): string => {
    const account = accountsList.find((acc) => acc.value === accountId);
    return account ? account.label : 'Not Set';
  }, []);

  // Handle expense account selection
  const handleExpenseAccountSelect = useCallback((option: OptionEntry) => {
    setSelectedExpenseAccountId(option.value);
    setIsExpenseAccountPickerVisible(false);
  }, []);

  // Handle payment account selection (multi-select)
  const handlePaymentAccountSelect = useCallback((option: OptionEntry) => {
    setSelectedPaymentAccountIds((prev) => {
      if (prev.includes(option.value)) {
        // Remove if already selected
        return prev.filter((id) => id !== option.value);
      } else {
        // Add if not selected
        return [...prev, option.value];
      }
    });
  }, []);

  // Get selected payment accounts for display, with default at the top
  const selectedPaymentAccountsList = useMemo(() => {
    const filtered = paymentAccounts.filter((account) => selectedPaymentAccountIds.includes(account.value));
    // Sort so default account appears first
    return filtered.sort((a, b) => {
      if (a.value === defaultPaymentAccountId) return -1;
      if (b.value === defaultPaymentAccountId) return 1;
      return 0;
    });
  }, [paymentAccounts, selectedPaymentAccountIds, defaultPaymentAccountId]);

  // Save all changes
  const handleSave = useCallback(() => {
    const updatedSettings: Partial<SettingsData> = {
      ...appSettings,
      quickBooksExpenseAccountId: selectedExpenseAccountId,
      quickBooksPaymentAccounts: selectedPaymentAccountsList.map((account) => account.value).join(','),
      quickBooksDefaultPaymentAccountId: defaultPaymentAccountId,
    };

    setAppSettings(updatedSettings);
    Alert.alert('Success', 'QuickBooks account settings saved successfully.');
    router.back();
  }, [
    appSettings,
    selectedExpenseAccountId,
    selectedPaymentAccountsList,
    defaultPaymentAccountId,
    setAppSettings,
    router,
  ]);

  // Check if save is enabled
  const isSaveEnabled = useMemo(() => {
    // Check if any values have changed from the saved settings
    const hasChanges =
      selectedExpenseAccountId !== (appSettings.quickBooksExpenseAccountId || '') ||
      selectedPaymentAccountIds.join(',') !== (appSettings.quickBooksPaymentAccounts || '') ||
      defaultPaymentAccountId !== (appSettings.quickBooksDefaultPaymentAccountId || '');

    // Only enable save if there are changes AND all required fields are filled
    return (
      hasChanges &&
      selectedExpenseAccountId !== '' &&
      selectedPaymentAccountIds.length > 0 &&
      defaultPaymentAccountId !== ''
    );
  }, [selectedExpenseAccountId, selectedPaymentAccountIds, defaultPaymentAccountId, appSettings]);

  const rightHeaderMenuButtons: ActionButtonProps[] = useMemo(
    () =>
      isQuickBooksAccessible
        ? [
            {
              icon: <MaterialIcons name="account-balance" size={28} color={colors.iconColor} />,
              label: 'Get Accounts from QuickBooks',
              onPress: (_e: GestureResponderEvent) => {
                setHeaderMenuModalVisible(false);
                handleGetQBAccounts();
              },
            },
          ]
        : [],
    [colors.iconColor, isQuickBooksAccessible, handleGetQBAccounts],
  );

  const headerRightComponent = useMemo(() => {
    if (!isQuickBooksAccessible) return {};
    return {
      headerRight: () => (
        <View
          style={{
            minWidth: 30,
            minHeight: 30,
            gap: 10,
            alignItems: 'center',
            flexDirection: 'row',
            backgroundColor: 'transparent',
            marginRight: Platform.OS === 'android' ? 16 : 0,
          }}
        >
          <Pressable
            style={{ alignItems: 'center' }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={() => setHeaderMenuModalVisible(!headerMenuModalVisible)}
          >
            <Octicons name="kebab-horizontal" size={28} color={colors.iconColor} />
          </Pressable>
        </View>
      ),
    };
  }, [colors.iconColor, headerMenuModalVisible, isQuickBooksAccessible]);

  // Show message if no accounts are available (not connected and no stored accounts)
  if (!isQuickBooksAccessible && storedAccounts.length === 0) {
    return (
      <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'QuickBooks Accounts',
            headerBackTitle: '',
            headerBackButtonDisplayMode: 'minimal',
          }}
        />
        <View style={[styles.container, { backgroundColor: colors.listBackground }]}>
          <View style={styles.notConnectedContainer}>
            <MaterialCommunityIcons name="link-off" size={64} color={colors.iconColor} />
            <Text txtSize="title" style={{ marginTop: 20, textAlign: 'center' }}>
              No Accounts Available
            </Text>
            <Text style={{ marginTop: 10, textAlign: 'center', paddingHorizontal: 20 }}>
              Please connect to QuickBooks and import accounts from the home screen menu to continue.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'QuickBooks Accounts',
          headerBackTitle: '',
          headerBackButtonDisplayMode: 'minimal',
          ...headerRightComponent,
        }}
      />
      <View style={[styles.container, { backgroundColor: colors.listBackground }]}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.tint} />
            <Text style={{ marginTop: 10 }}>Loading QuickBooks accounts...</Text>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            {/* Expense Account Section */}
            <View style={styles.topSection}>
              <Text txtSize="title" style={{ marginBottom: 8 }}>
                Expense Accounts
              </Text>
              <Text txtSize="xs" style={{ marginBottom: 4, color: colors.neutral600 }}>
                You can select an expense account for specific cost items when adding bills and receipts. You
                can assign a default expense account to use when the cost item does not have a specific
                expense account assigned.
              </Text>
              <ActionButton
                style={styles.topSectionActionButton}
                onPress={() => router.push('/configuration/quickbooks/setCostItemExpenseAccounts')}
                type="action"
                title="Assign Expense Acct for Cost Items"
              />

              <Text txtSize="xs" style={{ marginTop: 16, marginBottom: 4, color: colors.neutral600 }}>
                Default Expense Account
              </Text>
              <TouchableOpacity
                style={[
                  styles.accountCard,
                  { backgroundColor: colors.background, borderColor: colors.border },
                ]}
                onPress={() => setIsExpenseAccountPickerVisible(true)}
              >
                <View style={{ flex: 1 }}>
                  <Text>{getAccountName(selectedExpenseAccountId, expenseAccounts)}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.iconColor} />
              </TouchableOpacity>
            </View>

            {/* Payment Accounts Section */}
            <View style={styles.section}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <Text txtSize="title">Payment Accounts</Text>
                <TouchableOpacity
                  style={[styles.addButton, { backgroundColor: colors.background }]}
                  onPress={() => setIsPaymentAccountPickerVisible(true)}
                >
                  <MaterialIcons name="add" size={24} color={colors.buttonBlue} />
                </TouchableOpacity>
              </View>
              <Text txtSize="xs" style={{ marginBottom: 10, color: colors.neutral600 }}>
                Add one or more payment accounts to be used when adding receipts. You can set a default
                payment account by tapping on it in the list below.
              </Text>

              {selectedPaymentAccountsList.length > 0 && (
                <View style={{ flex: 1 }}>
                  <FlatList
                    data={selectedPaymentAccountsList}
                    keyExtractor={(item) => item.value}
                    style={{ marginTop: 10 }}
                    scrollEnabled={true}
                    renderItem={({ item }) => {
                      const isDefault = item.value === defaultPaymentAccountId;
                      return (
                        <View
                          style={[
                            styles.paymentAccountItem,
                            { backgroundColor: colors.neutral200, borderColor: colors.border },
                          ]}
                        >
                          <TouchableOpacity
                            style={{ flex: 1 }}
                            onPress={() => setDefaultPaymentAccountId(item.value)}
                          >
                            <Text style={{ color: isDefault ? colors.profitFg : colors.text }}>
                              {item.label}
                              {isDefault && ' (Default)'}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() =>
                              setSelectedPaymentAccountIds((prev) => prev.filter((id) => id !== item.value))
                            }
                          >
                            <MaterialIcons name="close" size={24} color={colors.iconColor} />
                          </TouchableOpacity>
                        </View>
                      );
                    }}
                  />
                </View>
              )}
            </View>
            {/* Save Button */}
            <View style={styles.saveButtonContainer}>
              <ActionButton
                onPress={handleSave}
                type={isSaveEnabled ? 'action' : 'disabled'}
                title="Save Settings"
              />
            </View>
          </View>
        )}
      </View>

      {/* Expense Account Picker */}
      <BottomSheetContainer
        isVisible={isExpenseAccountPickerVisible}
        onClose={() => setIsExpenseAccountPickerVisible(false)}
        modalHeight={'70%'}
        title="Select Expense Account"
      >
        <OptionList
          options={expenseAccounts}
          onSelect={handleExpenseAccountSelect}
          selectedOption={expenseAccounts.find((acc) => acc.value === selectedExpenseAccountId)}
          showOkCancel={false}
          enableSearch={true}
          searchPlaceholder="Search expense accounts..."
        />
      </BottomSheetContainer>

      {/* Payment Account Picker */}
      <BottomSheetContainer
        isVisible={isPaymentAccountPickerVisible}
        onClose={() => setIsPaymentAccountPickerVisible(false)}
        title={`Payment Accounts (${selectedPaymentAccountIds.length} selected)`}
        modalHeight={'60%'}
      >
        <FlatList
          data={paymentAccounts}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.optionItem, { borderBottomColor: colors.border }]}
              onPress={() => handlePaymentAccountSelect(item)}
            >
              <Text style={{ flex: 1 }}>{item.label}</Text>
              {selectedPaymentAccountIds.includes(item.value) && (
                <MaterialIcons name="check" size={24} color={colors.iconColor} />
              )}
            </TouchableOpacity>
          )}
        />
      </BottomSheetContainer>
      <Modal transparent animationType="fade" visible={processingInfo.isProcessing}>
        <View style={styles.processingOverlay}>
          <View style={[styles.processingContainer, { backgroundColor: colors.background }]}>
            <ActivityIndicator size="large" color={colors.tint} />
            <Text style={styles.processingLabel}>{processingInfo.label}</Text>
          </View>
        </View>
      </Modal>
      {headerMenuModalVisible && (
        <RightHeaderMenu
          modalVisible={headerMenuModalVisible}
          setModalVisible={setHeaderMenuModalVisible}
          buttons={rightHeaderMenuButtons}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
  },
  notConnectedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topSection: {
    marginBottom: 24,
  },
  topSectionActionButton: {
    marginTop: 8,
  },
  section: {
    marginBottom: 24,
    flex: 1,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentAccountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  saveButtonContainer: {
    marginTop: 20,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  processingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingContainer: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 16,
    minWidth: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  processingLabel: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default QBAccountsScreen;
