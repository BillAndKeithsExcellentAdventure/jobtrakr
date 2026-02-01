import { ActionButton } from '@/src/components/ActionButton';
import { Text, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import { useNetwork } from '@/src/context/NetworkContext';
import {
  SettingsData,
  useAppSettings,
  useSetAppSettingsCallback,
} from '@/src/tbStores/appSettingsStore/appSettingsStoreHooks';
import { fetchAccounts } from '@/src/utils/quickbooksAPI';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OptionEntry } from '@/src/components/OptionList';
import BottomSheetContainer from '@/src/components/BottomSheetContainer';
import OptionList from '@/src/components/OptionList';

interface QBAccount {
  id: string;
  name: string;
  classification?: string;
  accountType?: string;
  accountSubType?: string;
}

const QBAccountsScreen = () => {
  const colors = useColors();
  const router = useRouter();
  const auth = useAuth();
  const { orgId, userId, getToken } = auth;
  const { isConnectedToQuickBooks } = useNetwork();
  const appSettings = useAppSettings();
  const setAppSettings = useSetAppSettingsCallback();

  const [isLoading, setIsLoading] = useState(false);
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

  // Parse selected payment accounts from settings
  useEffect(() => {
    if (appSettings.quickBooksPaymentAccounts) {
      const ids = appSettings.quickBooksPaymentAccounts.split(',').filter((id) => id.trim() !== '');
      setSelectedPaymentAccountIds(ids);
    } else {
      setSelectedPaymentAccountIds([]);
    }
  }, [appSettings.quickBooksPaymentAccounts]);

  // Fetch accounts from QuickBooks
  useEffect(() => {
    const fetchQBAccounts = async () => {
      if (hasAccountsFetched.current) {
        return; // Already fetched during this session
      }

      if (!isConnectedToQuickBooks || !orgId || !userId) {
        if (expenseAccounts.length > 0 || paymentAccounts.length > 0) {
          setExpenseAccounts([]);
          setPaymentAccounts([]);
        }
        return;
      }

      setIsLoading(true);
      try {
        const accounts = await fetchAccounts(orgId, userId, getToken);

        // Filter expense accounts
        const expenseList = accounts
          .filter((account) => account.classification === 'Expense')
          .map((account) => ({
            label: account.name,
            value: account.id,
          }));
        setExpenseAccounts(expenseList);

        // Filter payment accounts (Bank, Credit Card, etc.)
        const paymentList = accounts
          .filter(
            (account) =>
              account.accountType === 'Bank' ||
              account.accountType === 'Credit Card' ||
              account.accountType === 'Other Current Asset',
          )
          .map((account) => ({
            label: account.name,
            value: account.id,
          }));
        setPaymentAccounts(paymentList);
        hasAccountsFetched.current = true; // Mark as fetched
      } catch (error) {
        console.error('Error fetching QuickBooks accounts:', error);
        Alert.alert('Error', 'Failed to fetch QuickBooks accounts. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchQBAccounts();
  }, [isConnectedToQuickBooks, orgId, userId, getToken, expenseAccounts.length, paymentAccounts.length]);

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

  // Save all changes
  const handleSave = useCallback(() => {
    const updatedSettings: Partial<SettingsData> = {
      ...appSettings,
      quickBooksExpenseAccountId: selectedExpenseAccountId,
      quickBooksPaymentAccounts: selectedPaymentAccountIds.join(','),
      quickBooksDefaultPaymentAccountId: defaultPaymentAccountId,
    };

    setAppSettings(updatedSettings);
    Alert.alert('Success', 'QuickBooks account settings saved successfully.');
    router.back();
  }, [
    appSettings,
    selectedExpenseAccountId,
    selectedPaymentAccountIds,
    defaultPaymentAccountId,
    setAppSettings,
    router,
  ]);

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

  // Check if save is enabled
  const isSaveEnabled = useMemo(() => {
    return (
      selectedExpenseAccountId !== '' &&
      selectedPaymentAccountIds.length > 0 &&
      defaultPaymentAccountId !== ''
    );
  }, [selectedExpenseAccountId, selectedPaymentAccountIds, defaultPaymentAccountId]);

  if (!isConnectedToQuickBooks) {
    return (
      <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'QuickBooks Accounts',
          }}
        />
        <View style={[styles.container, { backgroundColor: colors.listBackground }]}>
          <View style={styles.notConnectedContainer}>
            <MaterialCommunityIcons name="link-off" size={64} color={colors.iconColor} />
            <Text txtSize="title" style={{ marginTop: 20, textAlign: 'center' }}>
              Not Connected to QuickBooks
            </Text>
            <Text style={{ marginTop: 10, textAlign: 'center', paddingHorizontal: 20 }}>
              Please connect to QuickBooks in the App Settings to configure accounts.
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
        }}
      />
      <View style={[styles.container, { backgroundColor: colors.listBackground }]}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.iconColor} />
            <Text style={{ marginTop: 10 }}>Loading QuickBooks accounts...</Text>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            {/* Expense Account Section */}
            <View style={styles.topSection}>
              <Text txtSize="title" style={{ marginBottom: 10 }}>
                Default Expense Account for Bills
              </Text>
              <TouchableOpacity
                style={[
                  styles.accountCard,
                  { backgroundColor: colors.neutral200, borderColor: colors.border },
                ]}
                onPress={() => setIsExpenseAccountPickerVisible(true)}
              >
                <View style={{ flex: 1 }}>
                  <Text txtSize="sub-title">{getAccountName(selectedExpenseAccountId, expenseAccounts)}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.iconColor} />
              </TouchableOpacity>
            </View>

            {/* Payment Accounts Section */}
            <View style={styles.section}>
              <Text txtSize="title" style={{ marginBottom: 10 }}>
                Payment Accounts
              </Text>
              <Text txtSize="xs" style={{ marginBottom: 10, color: colors.neutral600 }}>
                Select one or more payment accounts to be used when adding receipts
              </Text>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: colors.primary, borderColor: colors.border }]}
                onPress={() => setIsPaymentAccountPickerVisible(true)}
              >
                <MaterialIcons name="add" size={24} color="white" />
                <Text style={{ color: 'white', marginLeft: 8 }}>Add Payment Account</Text>
              </TouchableOpacity>

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
        title="Select Payment Accounts"
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
                <MaterialIcons name="check" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>
          )}
        />
      </BottomSheetContainer>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
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
  section: {
    marginBottom: 24,
    flex: 1,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  paymentAccountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
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
});

export default QBAccountsScreen;
