import { SettingsData } from '@/src/tbStores/appSettingsStore/appSettingsStoreHooks';
import { AccountData } from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';

/**
 * Sanitize QuickBooks account settings by ensuring that the selected expense and payment accounts still exist in the store.
 * If an account no longer exists, it will be cleared from the settings. For payment accounts, if the default payment account is removed, it will be set to the first available payment account.
 * @param settings - Current app settings containing QuickBooks account IDs
 * @param accounts - List of all accounts currently in the store
 * @returns Partial settings object with sanitized QuickBooks account IDs
 */
export function sanitizeQuickBooksAccountSettings(
  settings: SettingsData,
  accounts: AccountData[],
): Partial<SettingsData> {
  const accountIds = new Set(accounts.map((account) => account.accountingId));
  const nextExpenseAccountId = accountIds.has(settings.quickBooksExpenseAccountId)
    ? settings.quickBooksExpenseAccountId
    : '';

  const paymentAccountIds = (settings.quickBooksPaymentAccounts || '')
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id !== '' && accountIds.has(id));

  const nextPaymentAccounts = paymentAccountIds.join(',');
  let nextDefaultPaymentAccountId = settings.quickBooksDefaultPaymentAccountId;
  if (!accountIds.has(nextDefaultPaymentAccountId)) {
    nextDefaultPaymentAccountId = paymentAccountIds[0] || '';
  }

  return {
    quickBooksExpenseAccountId: nextExpenseAccountId,
    quickBooksPaymentAccounts: nextPaymentAccounts,
    quickBooksDefaultPaymentAccountId: nextDefaultPaymentAccountId,
  };
}
