import { AccountData, WorkItemData } from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import {
  getQuickBooksAccountName,
  resolveQuickBooksExpenseAccountIdForWorkItem,
  USE_DEFAULT_EXPENSE_ACCOUNT_LABEL,
} from '@/src/utils/quickbooksWorkItemAccounts';

describe('quickbooksWorkItemAccounts', () => {
  const accounts: AccountData[] = [
    {
      id: 'account-1',
      accountingId: 'qb-expense-default',
      name: 'Default Expense',
      accountType: 'Expense',
      accountSubType: 'SuppliesMaterialsCogs',
    },
    {
      id: 'account-2',
      accountingId: 'qb-expense-custom',
      name: 'Custom Expense',
      accountType: 'Expense',
      accountSubType: 'JobExpenses',
    },
  ];

  const workItems: WorkItemData[] = [
    {
      id: 'work-item-1',
      categoryId: 'category-1',
      code: '100',
      name: 'Demo Cost Item',
      accountingId: 'qb-expense-custom',
      status: 'active',
    },
    {
      id: 'work-item-2',
      categoryId: 'category-1',
      code: '200',
      name: 'Default Cost Item',
      status: 'active',
    },
    {
      id: 'work-item-3',
      categoryId: 'category-1',
      code: '300',
      name: 'Invalid Mapping Cost Item',
      accountingId: 'missing-account',
      status: 'active',
    },
  ];

  describe('resolveQuickBooksExpenseAccountIdForWorkItem', () => {
    it('prefers the work item mapping when it matches a valid QuickBooks account', () => {
      const result = resolveQuickBooksExpenseAccountIdForWorkItem({
        workItemId: 'work-item-1',
        workItems,
        accounts,
        defaultExpenseAccountId: 'qb-expense-default',
      });

      expect(result).toBe('qb-expense-custom');
    });

    it('falls back to the default expense account when the work item has no mapping', () => {
      const result = resolveQuickBooksExpenseAccountIdForWorkItem({
        workItemId: 'work-item-2',
        workItems,
        accounts,
        defaultExpenseAccountId: 'qb-expense-default',
      });

      expect(result).toBe('qb-expense-default');
    });

    it('falls back to the default expense account when the work item mapping is stale', () => {
      const result = resolveQuickBooksExpenseAccountIdForWorkItem({
        workItemId: 'work-item-3',
        workItems,
        accounts,
        defaultExpenseAccountId: 'qb-expense-default',
      });

      expect(result).toBe('qb-expense-default');
    });

    it('returns an empty string when neither a work item mapping nor the default account is valid', () => {
      const result = resolveQuickBooksExpenseAccountIdForWorkItem({
        workItemId: 'work-item-2',
        workItems,
        accounts,
        defaultExpenseAccountId: 'missing-default-account',
      });

      expect(result).toBe('');
    });
  });

  describe('getQuickBooksAccountName', () => {
    it('returns the mapped account name when a QuickBooks account exists', () => {
      expect(getQuickBooksAccountName('qb-expense-custom', accounts)).toBe('Custom Expense');
    });

    it('returns the default label when the work item has no mapped account', () => {
      expect(getQuickBooksAccountName(undefined, accounts)).toBe(USE_DEFAULT_EXPENSE_ACCOUNT_LABEL);
    });

    it('returns the default label when the mapped account no longer exists', () => {
      expect(getQuickBooksAccountName('missing-account', accounts)).toBe(USE_DEFAULT_EXPENSE_ACCOUNT_LABEL);
    });
  });
});
