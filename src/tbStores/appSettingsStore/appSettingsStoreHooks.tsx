import { NoValuesSchema } from 'tinybase/with-schemas';
import { TABLES_SCHEMA, useStoreId } from './appSettingsStore';
import * as UiReact from 'tinybase/ui-react/with-schemas';
import { useCallback, useEffect, useState } from 'react';
import { randomUUID } from 'expo-crypto';
import { CrudResult } from '@/src/models/types';
import { isDevelopmentBuild } from '@/src/utils/environment';

const { useStore } = UiReact as UiReact.WithSchemas<[typeof TABLES_SCHEMA, NoValuesSchema]>;

export type SubscriptionTier = 'free' | 'basic' | 'premium';
export const DEFAULT_SUBSCRIPTION_TIER: SubscriptionTier = 'free';
export const PHOTO_LIMIT_PER_PROJECT_BY_TIER: Record<SubscriptionTier, number> = {
  free: 10,
  basic: 200,
  premium: 3000,
};

const SUBSCRIPTION_TIERS: SubscriptionTier[] = ['free', 'basic', 'premium'];

const isSubscriptionTier = (tier: unknown): tier is SubscriptionTier => {
  return typeof tier === 'string' && SUBSCRIPTION_TIERS.includes(tier as SubscriptionTier);
};

export interface SettingsData {
  id: string;
  companyName: string;
  ownerName: string;
  address: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  email: string;
  phone: string;
  companyLogo: string;
  changeOrderTemplateFileName: string;
  syncWithQuickBooks: boolean;
  noQuickBooksInterest: boolean;
  debugForceOffline: boolean;
  useDevSubscriptionOverride: boolean;
  devSubscriptionTier: SubscriptionTier;
  quickBooksExpenseAccountId: string;
  quickBooksPaymentAccounts: string; // Comma-separated list of account IDs
  quickBooksDefaultPaymentAccountId: string;
}

const INITIAL_SETTINGS: SettingsData = {
  id: '',
  companyName: '',
  ownerName: '',
  address: '',
  address2: '',
  city: '',
  state: '',
  zip: '',
  email: '',
  phone: '',
  companyLogo: '',
  changeOrderTemplateFileName: '',
  syncWithQuickBooks: false,
  noQuickBooksInterest: false,
  debugForceOffline: false,
  useDevSubscriptionOverride: false,
  devSubscriptionTier: 'free',
  quickBooksExpenseAccountId: '',
  quickBooksPaymentAccounts: '',
  quickBooksDefaultPaymentAccountId: '',
};

// --- READ App Settings ---
export const useAppSettings = (): SettingsData => {
  const store = useStore(useStoreId());
  const [row, setRow] = useState<SettingsData>(INITIAL_SETTINGS);

  const fetchRow = useCallback(() => {
    if (!store) return INITIAL_SETTINGS;
    const table = store.getTable('settings');
    const array = table
      ? (Object.entries(table).map(([id, row]) => ({
          ...row,
          id: id,
        })) as SettingsData[])
      : [];
    if (array.length > 1) {
      array.slice(1).forEach((row) => store.delRow('settings', row.id));
    }
    return array.length > 0 ? ({ ...INITIAL_SETTINGS, ...array[0] } as SettingsData) : INITIAL_SETTINGS;
  }, [store]);

  useEffect(() => {
    setRow(fetchRow());
  }, [fetchRow]);

  useEffect(() => {
    if (!store) return;
    const listenerId = store.addTableListener('settings', () => setRow(fetchRow()));
    return () => {
      store.delListener(listenerId);
    };
  }, [store, fetchRow]);

  return row;
};

// --- UPDATE or ADD ROW ---
export function useSetAppSettingsCallback() {
  const store = useStore(useStoreId());
  return useCallback(
    (settings: Partial<SettingsData>): CrudResult => {
      if (!store) return { status: 'Error', id: '0', msg: 'Store not found' };
      let existing = INITIAL_SETTINGS;
      let id = randomUUID();
      const table = store.getTable('settings');
      const firstEntry = table ? Object.entries(table)[0] : undefined;
      if (firstEntry) {
        const [existingId, existingRow] = firstEntry;
        existing = { id: existingId, ...existingRow } as SettingsData;
        id = existingId;
      }

      const success = store.setRow('settings', id, { ...existing, ...settings });
      return success
        ? { status: 'Success', id, msg: '' }
        : { status: 'Error', id: '0', msg: 'Failed to store settings' };
    },
    [store],
  );
}

interface ResolveEffectiveSubscriptionTierOptions {
  isDevelopment?: boolean;
  backendTier?: SubscriptionTier | null;
}

export const resolveEffectiveSubscriptionTier = (
  settings: Pick<SettingsData, 'useDevSubscriptionOverride' | 'devSubscriptionTier'>,
  options?: ResolveEffectiveSubscriptionTierOptions,
): SubscriptionTier => {
  if (
    options?.isDevelopment &&
    settings.useDevSubscriptionOverride &&
    isSubscriptionTier(settings.devSubscriptionTier)
  ) {
    return settings.devSubscriptionTier;
  }

  if (isSubscriptionTier(options?.backendTier)) {
    return options.backendTier;
  }

  return DEFAULT_SUBSCRIPTION_TIER;
};

export const useEffectiveSubscriptionTier = (backendTier?: SubscriptionTier | null): SubscriptionTier => {
  const appSettings = useAppSettings();
  return resolveEffectiveSubscriptionTier(appSettings, {
    backendTier,
    isDevelopment: isDevelopmentBuild(),
  });
};
