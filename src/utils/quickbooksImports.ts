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
 * @returns Object with counts of added and updated accounts
 */
export async function importAccountsFromQuickBooks(
  orgId: string,
  userId: string,
  getToken: () => Promise<string | null>,
  allAccounts: AccountData[],
  addAccount: (account: AccountData) => void,
  updateAccount: (id: string, account: Partial<AccountData>) => void,
): Promise<{ addedCount: number; updatedCount: number }> {
  const qbAccounts = await fetchAccounts(orgId, userId, getToken);
  let addedCount = 0;
  let updatedCount = 0;

  for (const qbAccount of qbAccounts) {
    // Find existing account with matching accountingId
    const existing = allAccounts.find((a) => a.accountingId === qbAccount.id);

    // Store classification if available (for expense accounts), otherwise accountType (for payment accounts)
    const accountType = qbAccount.accountType || qbAccount.classification || '';

    if (existing) {
      // Update existing account
      updateAccount(existing.id, {
        id: existing.id,
        accountingId: qbAccount.id,
        name: qbAccount.name,
        accountType,
      });
      updatedCount++;
    } else {
      // Add new account - the callback will generate a unique id
      addAccount({
        id: '', // Temporary placeholder, will be replaced with a UUID by useAddRowCallback
        accountingId: qbAccount.id,
        name: qbAccount.name,
        accountType,
      });
      addedCount++;
    }
  }

  return { addedCount, updatedCount };
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
    const existing = allVendors.find((v) => v.accountingId === qbVendor.id);

    const vendorData: VendorData = {
      id: existing ? existing.id : '', // empty id for new vendors
      accountingId: qbVendor.id,
      name: qbVendor.name,
      address: qbVendor.address || '',
      city: qbVendor.city || '',
      state: qbVendor.state || '',
      zip: qbVendor.zip || '',
      mobilePhone: qbVendor.mobilePhone || '',
      businessPhone: qbVendor.businessPhone || '',
      notes: qbVendor.notes || '',
    };

    if (existing) {
      // Update existing vendor
      updateVendor(existing.id, vendorData);
      updatedCount++;
    } else {
      // Add new vendor
      addVendor(vendorData);
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
 * @returns Object with counts of added and updated accounts and vendors
 */
export async function importAccountsAndVendorsFromQuickBooks(
  orgId: string,
  userId: string,
  getToken: () => Promise<string | null>,
  allAccounts: AccountData[],
  addAccount: (account: AccountData) => void,
  updateAccount: (id: string, account: Partial<AccountData>) => void,
  allVendors: VendorData[],
  addVendor: (vendor: VendorData) => void,
  updateVendor: (id: string, vendor: Partial<VendorData>) => void,
  showAlert: boolean = true,
): Promise<{
  accounts: { addedCount: number; updatedCount: number };
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
