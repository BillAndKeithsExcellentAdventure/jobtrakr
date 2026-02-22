import {
  AccountData,
  CustomerData,
  VendorData,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { Alert } from 'react-native';
import { fetchAccounts, fetchCustomers, fetchVendors } from './quickbooksAPI';

/**
 * Import accounts from QuickBooks
 * @param orgId - Organization ID
 * @param userId - User ID
 * @param getToken - Function to get auth token
 * @param allAccounts - Existing accounts in the store
 * @param addAccount - Callback to add a new account to the store
 * @param deleteAccount - Callback to delete an existing account in the store
 * @returns Object with counts of added and updated accounts and imported accounts list
 */
export async function importAccountsFromQuickBooks(
  orgId: string,
  userId: string,
  getToken: () => Promise<string | null>,
  _allAccounts: AccountData[],
  addAccount: (account: AccountData) => void,
  deleteAccount: (id: string, force?: boolean) => void,
): Promise<{ addedCount: number; accounts: AccountData[] }> {
  const qbAccounts = await fetchAccounts(orgId, userId, getToken);
  if (qbAccounts.length > 0) {
    // Remove existing accounts before importing new ones
    for (const account of _allAccounts) {
      deleteAccount(account.id, true);
    }
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
 * @param deleteVendor - Callback to delete a vendor from the store
 * @returns Object with counts of added vendors
 */
export async function importVendorsFromQuickBooks(
  orgId: string,
  userId: string,
  getToken: () => Promise<string | null>,
  allVendors: VendorData[],
  addVendor: (vendor: VendorData) => void,
  deleteVendor: (id: string) => void,
): Promise<{ addedCount: number }> {
  const qbVendors = await fetchVendors(orgId, userId, getToken);
  let addedCount = 0;

  if (qbVendors.length > 0) {
    // Remove existing vendors before importing new ones
    for (const vendor of allVendors) {
      deleteVendor(vendor.id);
    }
  }

  for (const qbVendor of qbVendors) {
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

  return { addedCount };
}

/**
 * Import customers from QuickBooks
 * If a customer with the same accountingId already exists, update it (preserving contactName).
 * Otherwise, add a new customer.
 * @param orgId - Organization ID
 * @param userId - User ID
 * @param getToken - Function to get auth token
 * @param allCustomers - Existing customers in the store
 * @param addCustomer - Callback to add a new customer to the store
 * @param updateCustomer - Callback to update an existing customer in the store
 * @returns Object with counts of added and updated customers
 */
export async function importCustomersFromQuickBooks(
  orgId: string,
  userId: string,
  getToken: () => Promise<string | null>,
  allCustomers: CustomerData[],
  addCustomer: (customer: CustomerData) => void,
  updateCustomer: (id: string, updates: Partial<CustomerData>) => void,
): Promise<{ addedCount: number; updatedCount: number }> {
  const qbCustomers = await fetchCustomers(orgId, userId, getToken);

  if (qbCustomers.length === 0) {
    Alert.alert('No Customers Found', 'No customers were found in QuickBooks to import.');
    return { addedCount: 0, updatedCount: 0 };
  }

  let addedCount = 0;
  let updatedCount = 0;

  for (const qbCustomer of qbCustomers) {
    const existing = allCustomers.find((c) => c.accountingId === qbCustomer.Id);

    // Use QuickBooks contact name if available, otherwise preserve existing contact name, or default to empty string
    const contactName =
      [qbCustomer.GivenName, qbCustomer.FamilyName].filter(Boolean).join(' ').trim() ||
      existing?.contactName ||
      '';

    if (existing) {
      // Update existing customer, preserving contactName
      updateCustomer(existing.id, {
        name: qbCustomer.DisplayName,
        email: qbCustomer.PrimaryEmailAddr?.Address || '',
        phone: qbCustomer.PrimaryPhone?.FreeFormNumber || '',
        active: qbCustomer.Active ?? true,
        contactName,
      });
      updatedCount++;
    } else {
      // Add new customer
      addCustomer({
        id: '', // empty id for new customers, replaced with UUID by the add callback
        accountingId: qbCustomer.Id,
        name: qbCustomer.DisplayName,
        email: qbCustomer.PrimaryEmailAddr?.Address || '',
        phone: qbCustomer.PrimaryPhone?.FreeFormNumber || '',
        active: qbCustomer.Active ?? true,
        contactName,
      });
      addedCount++;
    }
  }

  return { addedCount, updatedCount };
}
