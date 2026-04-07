import { NoValuesSchema } from 'tinybase/with-schemas';
import { TABLES_SCHEMA, useStoreId } from './appSettingsStore';
import * as UiReact from 'tinybase/ui-react/with-schemas';
import { useCallback, useEffect, useState } from 'react';
import { randomUUID } from 'expo-crypto';
import { useAuth } from '@clerk/clerk-expo';
import { API_BASE_URL } from '@/src/constants/app-constants';
import {
  CrudResult,
  ENTITLEMENT_WITH_LIMITS,
  EntitlementFlag,
  EntitlementWithLimit,
  EntitlementsPayload,
  GetOrgEntitlementsResponse,
  SubscriptionTier,
} from '@/src/models/types';
import { createApiWithToken } from '@/src/utils/apiWithToken';
import { isDevelopmentBuild } from '@/src/utils/environment';

const { useStore } = UiReact as UiReact.WithSchemas<[typeof TABLES_SCHEMA, NoValuesSchema]>;
type AppSettingsStoreType = ReturnType<typeof useStore>;

export type { SubscriptionTier } from '@/src/models/types';

export const DEFAULT_SUBSCRIPTION_TIER: SubscriptionTier = 'free';
export const SUBSCRIPTION_REFRESH_INTERVAL_MS = 60 * 60 * 1000;

const SUBSCRIPTION_TIERS: SubscriptionTier[] = ['free', 'basic', 'premium'];
const ENTITLEMENT_LIMIT_KEYS = new Set<string>(ENTITLEMENT_WITH_LIMITS);

export const DEV_ENTITLEMENTS_BY_TIER: Record<SubscriptionTier, EntitlementsPayload> = {
  free: {
    allowQuickBooksSync: true,
    allowChangeOrderEmails: true,
    allowPublishPhotosAndVideos: true,
    allowVendorPaymentReview: true,
    numProjects: 1,
    numOfficeExpenseProjects: 1,
    numProjectPhotos: 10,
    numProjectVideos: 2,
    numReceipts: 20,
    numInvoices: 10,
    numPhotosApiRequests: 5,
    numInvoicesApiRequests: 5,
    numOrgUsers: 2,
  },
  basic: {
    allowQuickBooksSync: false,
    allowChangeOrderEmails: false,
    allowPublishPhotosAndVideos: true,
    allowVendorPaymentReview: false,
    numProjects: -1,
    numOfficeExpenseProjects: 10,
    numProjectPhotos: 500,
    numProjectVideos: 20,
    numReceipts: 1000,
    numInvoices: 1000,
    numPhotosApiRequests: 100,
    numInvoicesApiRequests: 100,
    numOrgUsers: 3,
  },
  premium: {
    allowQuickBooksSync: true,
    allowChangeOrderEmails: true,
    allowPublishPhotosAndVideos: true,
    allowVendorPaymentReview: true,
    numProjects: -1,
    numOfficeExpenseProjects: 10,
    numProjectPhotos: 3000,
    numProjectVideos: -1,
    numReceipts: -1,
    numInvoices: -1,
    numPhotosApiRequests: -1,
    numInvoicesApiRequests: -1,
    numOrgUsers: -1,
  },
};

export const DEFAULT_FREE_TIER_ENTITLEMENTS: EntitlementsPayload = DEV_ENTITLEMENTS_BY_TIER.free;

const isSubscriptionTier = (tier: unknown): tier is SubscriptionTier => {
  return typeof tier === 'string' && SUBSCRIPTION_TIERS.includes(tier as SubscriptionTier);
};

const toBoolean = (value: unknown): boolean => value === true;
const toNumber = (value: unknown): number => (typeof value === 'number' ? value : 0);

export interface SubscriptionInformationData {
  tier: SubscriptionTier;
  entitlements: string;
  lastChecked: number;
  source: EntitlementsSource;
}

export type EntitlementsSource = 'server' | 'fallback' | 'override';

const isSameSubscriptionInformation = (
  left: SubscriptionInformationData,
  right: SubscriptionInformationData,
): boolean => {
  return (
    left.tier === right.tier &&
    left.entitlements === right.entitlements &&
    left.lastChecked === right.lastChecked &&
    left.source === right.source
  );
};

const INITIAL_SUBSCRIPTION_INFORMATION: SubscriptionInformationData = {
  tier: DEFAULT_SUBSCRIPTION_TIER,
  entitlements: JSON.stringify(DEFAULT_FREE_TIER_ENTITLEMENTS),
  lastChecked: 0,
  source: 'fallback',
};

const sanitizeEntitlementsPayload = (value: unknown): EntitlementsPayload => {
  const payload = typeof value === 'object' && value !== null ? (value as Partial<EntitlementsPayload>) : {};
  return {
    allowQuickBooksSync: toBoolean(payload.allowQuickBooksSync),
    allowChangeOrderEmails: toBoolean(payload.allowChangeOrderEmails),
    allowPublishPhotosAndVideos: toBoolean(payload.allowPublishPhotosAndVideos),
    allowVendorPaymentReview: toBoolean(payload.allowVendorPaymentReview),
    numProjects: toNumber(payload.numProjects),
    numOfficeExpenseProjects: toNumber(payload.numOfficeExpenseProjects),
    numProjectPhotos: toNumber(payload.numProjectPhotos),
    numProjectVideos: toNumber(payload.numProjectVideos),
    numReceipts: toNumber(payload.numReceipts),
    numInvoices: toNumber(payload.numInvoices),
    numPhotosApiRequests: toNumber(payload.numPhotosApiRequests),
    numInvoicesApiRequests: toNumber(payload.numInvoicesApiRequests),
    numOrgUsers: toNumber(payload.numOrgUsers),
  };
};

export const parseEntitlementsPayload = (value?: string | null): EntitlementsPayload | null => {
  if (!value) {
    return null;
  }

  try {
    return sanitizeEntitlementsPayload(JSON.parse(value));
  } catch (error) {
    console.warn('Unable to parse entitlements payload', error);
    return null;
  }
};

const getSettingsSnapshot = (store: AppSettingsStoreType): SettingsData => {
  if (!store) {
    return INITIAL_SETTINGS;
  }

  const table = store.getTable('settings');
  const firstEntry = table ? Object.entries(table)[0] : undefined;
  if (!firstEntry) {
    return INITIAL_SETTINGS;
  }

  const [id, row] = firstEntry;
  return { ...INITIAL_SETTINGS, ...row, id } as SettingsData;
};

const getSubscriptionInformationSnapshot = (
  store: AppSettingsStoreType,
  orgId?: string | null,
): SubscriptionInformationData => {
  if (!store || !orgId) {
    return INITIAL_SUBSCRIPTION_INFORMATION;
  }

  const row = store.getRow('subscriptionInformation', orgId);
  if (!row) {
    return INITIAL_SUBSCRIPTION_INFORMATION;
  }

  return {
    tier: isSubscriptionTier(row.tier) ? row.tier : DEFAULT_SUBSCRIPTION_TIER,
    entitlements:
      typeof row.entitlements === 'string' ? row.entitlements : INITIAL_SUBSCRIPTION_INFORMATION.entitlements,
    lastChecked: typeof row.lastChecked === 'number' ? row.lastChecked : 0,
    source:
      row.source === 'server' || row.source === 'fallback' || row.source === 'override'
        ? row.source
        : INITIAL_SUBSCRIPTION_INFORMATION.source,
  };
};

const writeSubscriptionData = (
  store: AppSettingsStoreType,
  orgId: string,
  tier: SubscriptionTier,
  entitlementsPayload: EntitlementsPayload,
  lastChecked: number,
  source: EntitlementsSource,
) => {
  if (!store) {
    return;
  }

  store.setRow('subscriptionInformation', orgId, {
    tier,
    entitlements: JSON.stringify(entitlementsPayload),
    lastChecked,
    source,
  });

  ENTITLEMENT_WITH_LIMITS.forEach((key) => {
    store.setRow('entitlementCount', key, {
      id: key,
      count: entitlementsPayload[key],
    });
  });

  const entitlementTable = store.getTable('entitlementCount');
  if (!entitlementTable) {
    return;
  }

  Object.keys(entitlementTable).forEach((rowId) => {
    if (!ENTITLEMENT_LIMIT_KEYS.has(rowId)) {
      store.delRow('entitlementCount', rowId);
    }
  });
};

export const resolveEntitlementsPayload = (
  settings: Pick<SettingsData, 'useDevSubscriptionOverride' | 'devSubscriptionTier'>,
  options?: { isDevelopment?: boolean; entitlementsJson?: string | null },
): EntitlementsPayload | null => {
  if (
    options?.isDevelopment &&
    settings.useDevSubscriptionOverride &&
    isSubscriptionTier(settings.devSubscriptionTier)
  ) {
    return DEV_ENTITLEMENTS_BY_TIER[settings.devSubscriptionTier];
  }

  return parseEntitlementsPayload(options?.entitlementsJson ?? undefined);
};

export const isEntitlementLimitReached = (limit: number | null, currentCount: number): boolean => {
  if (limit === null || limit < 0) {
    return false;
  }

  return currentCount >= limit;
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
      ? (Object.entries(table).map(([id, settingsRow]) => ({
          ...settingsRow,
          id,
        })) as SettingsData[])
      : [];
    if (array.length > 1) {
      array.slice(1).forEach((settingsRow) => store.delRow('settings', settingsRow.id));
    }
    return getSettingsSnapshot(store);
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

export const useSubscriptionInformation = (): SubscriptionInformationData => {
  const store = useStore(useStoreId());
  const { orgId } = useAuth();
  const [subscriptionInformation, setSubscriptionInformation] = useState<SubscriptionInformationData>(
    INITIAL_SUBSCRIPTION_INFORMATION,
  );

  const fetchSubscriptionInformation = useCallback(() => {
    return getSubscriptionInformationSnapshot(store, orgId);
  }, [orgId, store]);

  useEffect(() => {
    const nextSubscriptionInformation = fetchSubscriptionInformation();
    setSubscriptionInformation((currentSubscriptionInformation) =>
      isSameSubscriptionInformation(currentSubscriptionInformation, nextSubscriptionInformation)
        ? currentSubscriptionInformation
        : nextSubscriptionInformation,
    );
  }, [fetchSubscriptionInformation]);

  useEffect(() => {
    if (!store) {
      return;
    }

    const listenerId = store.addTableListener('subscriptionInformation', () => {
      const nextSubscriptionInformation = fetchSubscriptionInformation();
      setSubscriptionInformation((currentSubscriptionInformation) =>
        isSameSubscriptionInformation(currentSubscriptionInformation, nextSubscriptionInformation)
          ? currentSubscriptionInformation
          : nextSubscriptionInformation,
      );
    });

    return () => {
      store.delListener(listenerId);
    };
  }, [fetchSubscriptionInformation, store]);

  return subscriptionInformation;
};

interface ResolveEffectiveSubscriptionTierOptions {
  isDevelopment?: boolean;
  backendTier?: SubscriptionTier | null;
  subscriptionTier?: SubscriptionTier | null;
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

  const resolvedTier = options?.subscriptionTier ?? options?.backendTier;
  if (isSubscriptionTier(resolvedTier)) {
    return resolvedTier;
  }

  return DEFAULT_SUBSCRIPTION_TIER;
};

export const useEffectiveSubscriptionTier = (): SubscriptionTier => {
  const appSettings = useAppSettings();
  const subscriptionInformation = useSubscriptionInformation();
  return resolveEffectiveSubscriptionTier(appSettings, {
    subscriptionTier: subscriptionInformation.tier,
    isDevelopment: isDevelopmentBuild(),
  });
};

export const useEntitlementLimit = (key: EntitlementWithLimit): number | null => {
  const store = useStore(useStoreId());
  const appSettings = useAppSettings();
  const subscriptionInformation = useSubscriptionInformation();
  const isDevelopment = isDevelopmentBuild();
  const [limit, setLimit] = useState<number | null>(() => {
    const fallbackEntitlements = resolveEntitlementsPayload(appSettings, {
      isDevelopment,
      entitlementsJson: subscriptionInformation.entitlements,
    });
    return fallbackEntitlements ? fallbackEntitlements[key] : null;
  });

  const fetchLimit = useCallback(() => {
    const entitlements = resolveEntitlementsPayload(appSettings, {
      isDevelopment,
      entitlementsJson: subscriptionInformation.entitlements,
    });

    if (entitlements) {
      return entitlements[key];
    }

    if (!store) {
      return null;
    }

    const row = store.getRow('entitlementCount', key);
    return typeof row?.count === 'number' ? row.count : null;
  }, [appSettings, isDevelopment, key, store, subscriptionInformation.entitlements]);

  useEffect(() => {
    setLimit(fetchLimit());
  }, [fetchLimit]);

  useEffect(() => {
    if (!store) {
      return;
    }

    const listenerId = store.addTableListener('entitlementCount', () => setLimit(fetchLimit()));
    return () => {
      store.delListener(listenerId);
    };
  }, [fetchLimit, store]);

  return limit;
};

export const useEntitlementFlag = (key: EntitlementFlag): boolean => {
  const appSettings = useAppSettings();
  const subscriptionInformation = useSubscriptionInformation();
  const entitlements = resolveEntitlementsPayload(appSettings, {
    isDevelopment: isDevelopmentBuild(),
    entitlementsJson: subscriptionInformation.entitlements,
  });

  return entitlements ? entitlements[key] : false;
};

export const useEntitlementsPayload = (): EntitlementsPayload | null => {
  const appSettings = useAppSettings();
  const subscriptionInformation = useSubscriptionInformation();

  return resolveEntitlementsPayload(appSettings, {
    isDevelopment: isDevelopmentBuild(),
    entitlementsJson: subscriptionInformation.entitlements,
  });
};

export const useIsAtEntitlementLimit = (key: EntitlementWithLimit, currentCount: number): boolean => {
  const limit = useEntitlementLimit(key);
  return isEntitlementLimitReached(limit, currentCount);
};

export const useEntitlementsSource = (): EntitlementsSource => {
  return useSubscriptionInformation().source;
};

export function useRefreshSubscription(): () => Promise<void> {
  const store = useStore(useStoreId());
  const { orgId, userId, getToken } = useAuth();

  return useCallback(async () => {
    if (!store || !orgId || !userId) {
      return;
    }

    const settings = getSettingsSnapshot(store);
    const checkedAt = Date.now();

    if (isDevelopmentBuild() && settings.useDevSubscriptionOverride) {
      const devTier = isSubscriptionTier(settings.devSubscriptionTier)
        ? settings.devSubscriptionTier
        : DEFAULT_SUBSCRIPTION_TIER;
      writeSubscriptionData(store, orgId, devTier, DEV_ENTITLEMENTS_BY_TIER[devTier], checkedAt, 'override');
      return;
    }

    try {
      const params = new URLSearchParams({
        orgId,
        userId,
      }).toString();
      const apiFetch = createApiWithToken(getToken);
      const response = await apiFetch(`${API_BASE_URL}/getOrgEntitlements?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch entitlements: ${response.status}`);
      }

      const data = (await response.json()) as GetOrgEntitlementsResponse;
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch entitlements');
      }

      const tier = isSubscriptionTier(data.tier) ? data.tier : DEFAULT_SUBSCRIPTION_TIER;
      const entitlements = sanitizeEntitlementsPayload(data.entitlements);
      writeSubscriptionData(store, orgId, tier, entitlements, checkedAt, 'server');
    } catch (error) {
      const cachedSubscriptionInformation = getSubscriptionInformationSnapshot(store, orgId);
      const cachedEntitlements = parseEntitlementsPayload(cachedSubscriptionInformation.entitlements);
      const fallbackTier = cachedEntitlements
        ? cachedSubscriptionInformation.tier
        : DEFAULT_SUBSCRIPTION_TIER;
      const fallbackEntitlements = cachedEntitlements ?? DEFAULT_FREE_TIER_ENTITLEMENTS;
      const fallbackSubscriptionInformation: SubscriptionInformationData = {
        tier: fallbackTier,
        entitlements: JSON.stringify(fallbackEntitlements),
        lastChecked: cachedSubscriptionInformation.lastChecked,
        source: 'fallback',
      };

      const hasStoredSubscriptionInformation = Boolean(store.getRow('subscriptionInformation', orgId));
      if (
        !hasStoredSubscriptionInformation ||
        !isSameSubscriptionInformation(cachedSubscriptionInformation, fallbackSubscriptionInformation)
      ) {
        writeSubscriptionData(
          store,
          orgId,
          fallbackTier,
          fallbackEntitlements,
          fallbackSubscriptionInformation.lastChecked,
          fallbackSubscriptionInformation.source,
        );
      }

      console.warn('Failed to fetch entitlements, using cached or free-tier defaults instead.', error);
    }
  }, [getToken, orgId, store, userId]);
}
