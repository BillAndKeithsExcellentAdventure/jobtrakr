import { Alert } from 'react-native';
import { fetchAccounts, fetchVendors } from './quickbooksAPI';
import { AccountData, VendorData } from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';

/**
 * Import accounts from QuickBooks
 * @param orgId - Organization ID
 * @param userId - User ID
 * @param getToken - Function to get auth token
 * @param allAccounts - Existing accounts in the store
 * @param addAccount - Callback to add a new account to the store
 * @param updateAccount - Callback to update an existing account in the store
 * @returns Object with counts of added and updated accounts and imported accounts list
 */
export async function importAccountsFromQuickBooks(
  orgId: string,
  userId: string,
  getToken: () => Promise<string | null>,
  _allAccounts: AccountData[],
  addAccount: (account: AccountData) => void,
  _updateAccount: (id: string, account: Partial<AccountData>) => void,
  deleteAllAccounts: () => void,
): Promise<{ addedCount: number; accounts: AccountData[] }> {
  const qbAccounts = await fetchAccounts(orgId, userId, getToken);
  if (qbAccounts.length > 0) {
    deleteAllAccounts();
  } else {
    Alert.alert('No Accounts Found', 'No accounts were found in QuickBooks to import.');
    return { addedCount: 0, accounts: [] };
  }

  const accounts: AccountData[] = [];

  for (const qbAccount of qbAccounts) {
    // Store classification if available (for expense accounts), otherwise accountType (for payment accounts)
    const accountType = qbAccount.accountType || qbAccount.classification || '';
    const account: AccountData = {
      id: '', // Temporary placeholder, replaced with UUID by the add callback
      accountingId: qbAccount.id,
      name: qbAccount.name,
      accountType,
      accountSubType: qbAccount.accountSubType || '',
    };

    addAccount(account);
    accounts.push(account);
  }

  return { addedCount: accounts.length, accounts };
}

/**
 * Import vendors from QuickBooks
 * @param orgId - Organization ID
 * @param userId - User ID
 * @param getToken - Function to get auth token
 * @param allVendors - Existing vendors in the store
 * @param addVendor - Callback to add a new vendor to the store
 * @param updateVendor - Callback to update an existing vendor in the store
 * @returns Object with counts of added and updated vendors
 */
export async function importVendorsFromQuickBooks(
  orgId: string,
  userId: string,
  getToken: () => Promise<string | null>,
  allVendors: VendorData[],
  addVendor: (vendor: VendorData) => void,
  updateVendor: (id: string, vendor: Partial<VendorData>) => void,
): Promise<{ addedCount: number; updatedCount: number }> {
  const qbVendors = await fetchVendors(orgId, userId, getToken);
  let addedCount = 0;
  let updatedCount = 0;

  for (const qbVendor of qbVendors) {
    // Find existing vendor with matching accountingId
    const existing = allVendors.find((v) => v.accountingId === qbVendor.accountingId);

    if (existing) {
      // Update existing vendor
      updateVendor(existing.id, {
        id: existing.id,
        accountingId: qbVendor.accountingId,
        name: qbVendor.name,
        address: qbVendor.address || '',
        city: qbVendor.city || '',
        state: qbVendor.state || '',
        zip: qbVendor.zip || '',
        mobilePhone: qbVendor.mobilePhone || '',
        businessPhone: qbVendor.businessPhone || '',
        notes: qbVendor.notes || '',
      });
      updatedCount++;
    } else {
      // Add new vendor
      addVendor({
        id: '', // empty id for new vendors, replaced with UUID by the add callback
        accountingId: qbVendor.accountingId,
        name: qbVendor.name,
        address: qbVendor.address || '',
        city: qbVendor.city || '',
        state: qbVendor.state || '',
        zip: qbVendor.zip || '',
        mobilePhone: qbVendor.mobilePhone || '',
        businessPhone: qbVendor.businessPhone || '',
        notes: qbVendor.notes || '',
      });
      addedCount++;
    }
  }

  return { addedCount, updatedCount };
}

/**
 * Import both accounts and vendors from QuickBooks
 * @param orgId - Organization ID
 * @param userId - User ID
 * @param getToken - Function to get auth token
 * @param allAccounts - Existing accounts in the store
 * @param addAccount - Callback to add a new account to the store
 * @param updateAccount - Callback to update an existing account in the store
 * @param allVendors - Existing vendors in the store
 * @param addVendor - Callback to add a new vendor to the store
 * @param updateVendor - Callback to update an existing vendor in the store
 * @param showAlert - Whether to show alert dialogs (default: true)
 * @returns Object with counts of added and updated accounts and vendors, plus imported accounts list
 */
export async function importAccountsAndVendorsFromQuickBooks(
  orgId: string,
  userId: string,
  getToken: () => Promise<string | null>,
  allAccounts: AccountData[],
  addAccount: (account: AccountData) => void,
  updateAccount: (id: string, account: Partial<AccountData>) => void,
  deleteAllAccounts: () => void,
  allVendors: VendorData[],
  addVendor: (vendor: VendorData) => void,
  updateVendor: (id: string, vendor: Partial<VendorData>) => void,
  showAlert: boolean = true,
): Promise<{
  accounts: { addedCount: number; updatedCount: number; accounts: AccountData[] };
  vendors: { addedCount: number; updatedCount: number };
}> {
  try {
    const accountResults = await importAccountsFromQuickBooks(
      orgId,
      userId,
      getToken,
      allAccounts,
      addAccount,
      updateAccount,
      deleteAllAccounts,
    );

    const vendorResults = await importVendorsFromQuickBooks(
      orgId,
      userId,
      getToken,
      allVendors,
      addVendor,
      updateVendor,
    );

    if (showAlert) {
      Alert.alert(
        'QuickBooks Import Complete',
        `Import from QuickBooks completed successfully.\n\n` +
          `Accounts - Added: ${accountResults.addedCount}, Updated: ${accountResults.updatedCount}\n` +
          `Vendors - Added: ${vendorResults.addedCount}, Updated: ${vendorResults.updatedCount}`,
      );
    }

    return {
      accounts: accountResults,
      vendors: vendorResults,
    };
  } catch (error) {
    console.error('Error importing from QuickBooks:', error);
    if (showAlert) {
      Alert.alert('Error', 'Failed to import from QuickBooks');
    }
    throw error;
  }
}
