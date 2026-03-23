import { AccountData, WorkItemData } from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';

export const USE_DEFAULT_EXPENSE_ACCOUNT_OPTION_VALUE = '__use_default_expense_account__';
export const USE_DEFAULT_EXPENSE_ACCOUNT_LABEL = 'Use Default Expense Account';

type ResolveExpenseAccountIdArgs = {
  workItemId?: string;
  workItems: WorkItemData[];
  accounts: AccountData[];
  defaultExpenseAccountId: string;
};

export function resolveQuickBooksExpenseAccountIdForWorkItem({
  workItemId,
  workItems,
  accounts,
  defaultExpenseAccountId,
}: ResolveExpenseAccountIdArgs): string {
  const validAccountIds = new Set(accounts.map((account) => account.accountingId));
  const workItemAccountId = workItems.find((workItem) => workItem.id === workItemId)?.accountingId;

  if (workItemAccountId && validAccountIds.has(workItemAccountId)) {
    return workItemAccountId;
  }

  return validAccountIds.has(defaultExpenseAccountId) ? defaultExpenseAccountId : '';
}

export function getQuickBooksAccountName(accountId: string | undefined, accounts: AccountData[]): string {
  if (!accountId) {
    return USE_DEFAULT_EXPENSE_ACCOUNT_LABEL;
  }

  return (
    accounts.find((account) => account.accountingId === accountId)?.name ?? USE_DEFAULT_EXPENSE_ACCOUNT_LABEL
  );
}
