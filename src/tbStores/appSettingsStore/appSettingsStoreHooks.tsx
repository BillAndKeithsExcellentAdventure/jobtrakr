import { NoValuesSchema } from 'tinybase/with-schemas';
import { TABLES_SCHEMA, useStoreId } from './appSettingsStore';
import * as UiReact from 'tinybase/ui-react/with-schemas';
import { useCallback, useEffect, useRef, useState } from 'react';
import { randomUUID } from 'expo-crypto';
import { useAuth } from '@clerk/clerk-expo';
import { API_BASE_URL } from '@/src/constants/app-constants';
import {
  CrudResult,
  ENTITLEMENT,
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
const ENTITLEMENT_KEYS = new Set<string>(ENTITLEMENT);

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
    numBills: 10,
    numReceiptAiRequests: 5,
    numBillAiRequests: 5,
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
    numBills: 1000,
    numReceiptAiRequests: 100,
    numBillAiRequests: 100,
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
    numBills: -1,
    numReceiptAiRequests: -1,
    numBillAiRequests: -1,
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
  lastChecked: number;
  source: EntitlementsSource;
  numReceiptAiRequestsRemaining: number;
  numBillAiRequestsRemaining: number;
}

export type EntitlementsSource = 'server' | 'fallback' | 'override';

const isSameSubscriptionInformation = (
  left: SubscriptionInformationData,
  right: SubscriptionInformationData,
): boolean => {
  return (
    left.tier === right.tier &&
    left.lastChecked === right.lastChecked &&
    left.source === right.source &&
    left.numReceiptAiRequestsRemaining === right.numReceiptAiRequestsRemaining &&
    left.numBillAiRequestsRemaining === right.numBillAiRequestsRemaining
  );
};

const INITIAL_SUBSCRIPTION_INFORMATION: SubscriptionInformationData = {
  tier: DEFAULT_SUBSCRIPTION_TIER,
  lastChecked: 0,
  source: 'fallback',
  numReceiptAiRequestsRemaining: -1,
  numBillAiRequestsRemaining: -1,
};

const sanitizeEntitlementsPayload = (
  value: unknown,
  fallback: EntitlementsPayload = DEFAULT_FREE_TIER_ENTITLEMENTS,
): EntitlementsPayload => {
  const payload =
    typeof value === 'object' && value !== null
      ? (value as Partial<EntitlementsPayload> & {
          // Legacy field names accepted for backward compatibility with older backend responses
          numInvoices?: number;
          numReceiptApiRequests?: number;
          numInvoiceApiRequests?: number;
          // Boolean flags may arrive as numbers (1 = true, 0 = false) from older backend responses
          allowQuickBooksSync?: boolean | number;
          allowChangeOrderEmails?: boolean | number;
          allowPublishPhotosAndVideos?: boolean | number;
          allowVendorPaymentReview?: boolean | number;
        })
      : {};
  return {
    allowQuickBooksSync:
      typeof payload.allowQuickBooksSync === 'boolean'
        ? payload.allowQuickBooksSync
        : typeof payload.allowQuickBooksSync === 'number'
          ? payload.allowQuickBooksSync === 1
          : fallback.allowQuickBooksSync,
    allowChangeOrderEmails:
      typeof payload.allowChangeOrderEmails === 'boolean'
        ? payload.allowChangeOrderEmails
        : typeof payload.allowChangeOrderEmails === 'number'
          ? payload.allowChangeOrderEmails === 1
          : fallback.allowChangeOrderEmails,
    allowPublishPhotosAndVideos:
      typeof payload.allowPublishPhotosAndVideos === 'boolean'
        ? payload.allowPublishPhotosAndVideos
        : typeof payload.allowPublishPhotosAndVideos === 'number'
          ? payload.allowPublishPhotosAndVideos === 1
          : fallback.allowPublishPhotosAndVideos,
    allowVendorPaymentReview:
      typeof payload.allowVendorPaymentReview === 'boolean'
        ? payload.allowVendorPaymentReview
        : typeof payload.allowVendorPaymentReview === 'number'
          ? payload.allowVendorPaymentReview === 1
          : fallback.allowVendorPaymentReview,
    numProjects: typeof payload.numProjects === 'number' ? payload.numProjects : fallback.numProjects,
    numOfficeExpenseProjects:
      typeof payload.numOfficeExpenseProjects === 'number'
        ? payload.numOfficeExpenseProjects
        : fallback.numOfficeExpenseProjects,
    numProjectPhotos:
      typeof payload.numProjectPhotos === 'number' ? payload.numProjectPhotos : fallback.numProjectPhotos,
    numProjectVideos:
      typeof payload.numProjectVideos === 'number' ? payload.numProjectVideos : fallback.numProjectVideos,
    numReceipts: typeof payload.numReceipts === 'number' ? payload.numReceipts : fallback.numReceipts,
    numBills:
      typeof payload.numBills === 'number'
        ? payload.numBills
        : typeof payload.numInvoices === 'number'
          ? payload.numInvoices
          : fallback.numBills,
    numReceiptAiRequests:
      typeof payload.numReceiptAiRequests === 'number'
        ? payload.numReceiptAiRequests
        : typeof payload.numReceiptApiRequests === 'number'
          ? payload.numReceiptApiRequests
          : fallback.numReceiptAiRequests,
    numBillAiRequests:
      typeof payload.numBillAiRequests === 'number'
        ? payload.numBillAiRequests
        : typeof payload.numInvoiceApiRequests === 'number'
          ? payload.numInvoiceApiRequests
          : fallback.numBillAiRequests,
    numOrgUsers: typeof payload.numOrgUsers === 'number' ? payload.numOrgUsers : fallback.numOrgUsers,
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
    lastChecked: typeof row.lastChecked === 'number' ? row.lastChecked : 0,
    source:
      row.source === 'server' || row.source === 'fallback' || row.source === 'override'
        ? row.source
        : INITIAL_SUBSCRIPTION_INFORMATION.source,
    numReceiptAiRequestsRemaining:
      typeof row.numReceiptAiRequestsRemaining === 'number' ? row.numReceiptAiRequestsRemaining : -1,
    numBillAiRequestsRemaining:
      typeof row.numBillAiRequestsRemaining === 'number' ? row.numBillAiRequestsRemaining : -1,
  };
};

const getEntitlementsSnapshot = (store: AppSettingsStoreType): EntitlementsPayload | null => {
  if (!store) {
    return null;
  }

  const table = store.getTable('entitlements');
  if (!table) {
    return null;
  }

  const entitlements: Partial<EntitlementsPayload> = {};
  let hasEntitlementRows = false;

  ENTITLEMENT.forEach((key) => {
    const row = store.getRow('entitlements', key);
    if (!row) {
      return;
    }

    hasEntitlementRows = true;
    if (ENTITLEMENT_LIMIT_KEYS.has(key)) {
      entitlements[key as EntitlementWithLimit] = toNumber(row.numberValue);
      return;
    }

    entitlements[key as EntitlementFlag] = toBoolean(row.booleanValue);
  });

  if (!hasEntitlementRows) {
    return null;
  }

  return sanitizeEntitlementsPayload(entitlements, DEFAULT_FREE_TIER_ENTITLEMENTS);
};

const writeSubscriptionData = (
  store: AppSettingsStoreType,
  orgId: string,
  tier: SubscriptionTier,
  entitlementsPayload: EntitlementsPayload,
  lastChecked: number,
  source: EntitlementsSource,
  numReceiptAiRequestsRemaining: number = -1,
  numBillAiRequestsRemaining: number = -1,
) => {
  if (!store) {
    return;
  }

  store.setRow('subscriptionInformation', orgId, {
    tier,
    lastChecked,
    source,
    numReceiptAiRequestsRemaining,
    numBillAiRequestsRemaining,
  });

  ENTITLEMENT.forEach((key) => {
    const value = entitlementsPayload[key];
    store.setRow('entitlements', key, {
      id: key,
      kind: ENTITLEMENT_LIMIT_KEYS.has(key) ? 'limit' : 'flag',
      numberValue: typeof value === 'number' ? value : 0,
      booleanValue: typeof value === 'boolean' ? value : false,
    });
  });

  const entitlementTable = store.getTable('entitlements');
  if (!entitlementTable) {
    return;
  }

  Object.keys(entitlementTable).forEach((rowId) => {
    if (!ENTITLEMENT_KEYS.has(rowId)) {
      store.delRow('entitlements', rowId);
    }
  });
};

export const resolveEntitlementsPayload = (
  settings: Pick<SettingsData, 'useDevSubscriptionOverride' | 'devSubscriptionTier'>,
  options?: { isDevelopment?: boolean; storedEntitlements?: EntitlementsPayload | null },
): EntitlementsPayload | null => {
  if (
    options?.isDevelopment &&
    settings.useDevSubscriptionOverride &&
    isSubscriptionTier(settings.devSubscriptionTier)
  ) {
    return DEV_ENTITLEMENTS_BY_TIER[settings.devSubscriptionTier];
  }

  return options?.storedEntitlements ?? null;
};

export const isEntitlementLimitReached = (limit: number | null, currentCount: number): boolean => {
  if (limit === null || limit < 0) {
    return false;
  }

  return currentCount >= limit;
};

// Returns true when all AI processing requests for this billing period have been used.
// A value of -1 means unlimited — never exhausted.
export const isAiRequestsExhausted = (remaining: number): boolean => remaining === 0;

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
  const isDevelopment = isDevelopmentBuild();
  const [limit, setLimit] = useState<number | null>(() => {
    const storedEntitlements = getEntitlementsSnapshot(store);
    const fallbackEntitlements = resolveEntitlementsPayload(appSettings, {
      isDevelopment,
      storedEntitlements,
    });
    return fallbackEntitlements ? fallbackEntitlements[key] : null;
  });

  const fetchLimit = useCallback(() => {
    const storedEntitlements = getEntitlementsSnapshot(store);
    const entitlements = resolveEntitlementsPayload(appSettings, {
      isDevelopment,
      storedEntitlements,
    });

    if (entitlements) {
      return entitlements[key];
    }

    return null;
  }, [appSettings, isDevelopment, key, store]);

  useEffect(() => {
    setLimit(fetchLimit());
  }, [fetchLimit]);

  useEffect(() => {
    if (!store) {
      return;
    }

    const listenerId = store.addTableListener('entitlements', () => setLimit(fetchLimit()));
    return () => {
      store.delListener(listenerId);
    };
  }, [fetchLimit, store]);

  return limit;
};

export const useEntitlementFlag = (key: EntitlementFlag): boolean => {
  const store = useStore(useStoreId());
  const appSettings = useAppSettings();
  const isDevelopment = isDevelopmentBuild();

  const fetchFlag = useCallback(() => {
    const storedEntitlements = getEntitlementsSnapshot(store);
    const entitlements = resolveEntitlementsPayload(appSettings, {
      isDevelopment,
      storedEntitlements,
    });
    return entitlements ? entitlements[key] : false;
  }, [appSettings, isDevelopment, key, store]);

  const [flag, setFlag] = useState<boolean>(() => fetchFlag());

  useEffect(() => {
    setFlag(fetchFlag());
  }, [fetchFlag]);

  useEffect(() => {
    if (!store) {
      return;
    }

    const listenerId = store.addTableListener('entitlements', () => setFlag(fetchFlag()));
    return () => {
      store.delListener(listenerId);
    };
  }, [fetchFlag, store]);

  return flag;
};

export const useEntitlementsPayload = (): EntitlementsPayload | null => {
  const store = useStore(useStoreId());
  const appSettings = useAppSettings();
  const [storedEntitlements, setStoredEntitlements] = useState<EntitlementsPayload | null>(() =>
    getEntitlementsSnapshot(store),
  );

  useEffect(() => {
    setStoredEntitlements(getEntitlementsSnapshot(store));
  }, [store]);

  useEffect(() => {
    if (!store) {
      return;
    }

    const listenerId = store.addTableListener('entitlements', () => {
      setStoredEntitlements(getEntitlementsSnapshot(store));
    });

    return () => {
      store.delListener(listenerId);
    };
  }, [store]);

  return resolveEntitlementsPayload(appSettings, {
    isDevelopment: isDevelopmentBuild(),
    storedEntitlements,
  });
};

export const useIsAtEntitlementLimit = (key: EntitlementWithLimit, currentCount: number): boolean => {
  const limit = useEntitlementLimit(key);
  return isEntitlementLimitReached(limit, currentCount);
};

export const useEntitlementsSource = (): EntitlementsSource => {
  return useSubscriptionInformation().source;
};

export const useNumBillAiRequestsRemaining = (): number => {
  return useSubscriptionInformation().numBillAiRequestsRemaining;
};

export const useNumReceiptAiRequestsRemaining = (): number => {
  return useSubscriptionInformation().numReceiptAiRequestsRemaining;
};

export function useRefreshSubscription(): () => Promise<void> {
  const store = useStore(useStoreId());
  const { orgId, userId, getToken } = useAuth();

  // Use a ref for getToken so the callback identity stays stable.
  // getToken changes identity on every render, but the callback only
  // needs to change when orgId, userId, or store changes.
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  // Track whether the settings table has been hydrated from SQLite.
  // `store` becomes non-null before persistence finishes loading, so we
  // must not read settings until at least one row exists. When this flips
  // to `true`, `useCallback` gets a new identity and the startup effect in
  // _layout.tsx re-fires with the now-ready callback.
  const [settingsReady, setSettingsReady] = useState(() => (store?.getRowIds('settings')?.length ?? 0) > 0);

  useEffect(() => {
    setSettingsReady((store?.getRowIds('settings')?.length ?? 0) > 0);
  }, [store]);

  useEffect(() => {
    if (!store) return;
    const listenerId = store.addTableListener('settings', () => {
      setSettingsReady((store.getRowIds('settings')?.length ?? 0) > 0);
    });
    return () => {
      store.delListener(listenerId);
    };
  }, [store]);

  return useCallback(async () => {
    if (!store || !orgId || !userId) {
      return;
    }

    // Settings table not yet hydrated from SQLite — bail out.
    // The callback will get a new identity once settingsReady becomes true
    // and the startup effect will re-fire automatically.
    if (!settingsReady) {
      return;
    }

    const settings = getSettingsSnapshot(store);
    const checkedAt = Date.now();

    if (isDevelopmentBuild() && settings.useDevSubscriptionOverride) {
      const devTier = isSubscriptionTier(settings.devSubscriptionTier)
        ? settings.devSubscriptionTier
        : DEFAULT_SUBSCRIPTION_TIER;
      writeSubscriptionData(store, orgId, devTier, DEV_ENTITLEMENTS_BY_TIER[devTier], checkedAt, 'override');
      console.log('Using development subscription override with tier', devTier);
      return;
    }

    try {
      const params = new URLSearchParams({
        orgId,
        userId,
      }).toString();
      const apiFetch = createApiWithToken(getTokenRef.current);
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

      // console.log('[GetOrgEntitlementsResponse]Successfully fetched entitlements data from server:', data);

      const tier = isSubscriptionTier(data.tier) ? data.tier : DEFAULT_SUBSCRIPTION_TIER;
      const entitlements = sanitizeEntitlementsPayload(data.entitlements, DEFAULT_FREE_TIER_ENTITLEMENTS);
      const receiptRemaining =
        typeof data.numReceiptAiRequestsRemaining === 'number'
          ? data.numReceiptAiRequestsRemaining
          : typeof data.numReceiptApiRequestsRemaining === 'number'
            ? data.numReceiptApiRequestsRemaining
            : -1;
      const invoiceRemaining =
        typeof data.numBillAiRequestsRemaining === 'number'
          ? data.numBillAiRequestsRemaining
          : typeof data.numInvoiceApiRequestsRemaining === 'number'
            ? data.numInvoiceApiRequestsRemaining
            : -1;
      console.log('Fetched entitlements from server:', {
        tier,
        entitlements,
        receiptRemaining,
        invoiceRemaining,
      });
      console.log('Storing subscription data to local store with source "server".');
      writeSubscriptionData(
        store,
        orgId,
        tier,
        entitlements,
        checkedAt,
        'server',
        receiptRemaining,
        invoiceRemaining,
      );
    } catch (error) {
      const cachedSubscriptionInformation = getSubscriptionInformationSnapshot(store, orgId);
      const cachedEntitlements = getEntitlementsSnapshot(store);
      const fallbackTier = cachedEntitlements
        ? cachedSubscriptionInformation.tier
        : DEFAULT_SUBSCRIPTION_TIER;
      const fallbackEntitlements = cachedEntitlements ?? DEFAULT_FREE_TIER_ENTITLEMENTS;
      const fallbackSubscriptionInformation: SubscriptionInformationData = {
        tier: fallbackTier,
        lastChecked: cachedSubscriptionInformation.lastChecked,
        source: 'fallback',
        numReceiptAiRequestsRemaining: cachedSubscriptionInformation.numReceiptAiRequestsRemaining,
        numBillAiRequestsRemaining: cachedSubscriptionInformation.numBillAiRequestsRemaining,
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
  }, [orgId, settingsReady, store, userId]);
}

export function useUpdateApiRequestsRemainingCallback(): (updates: {
  numReceiptAiRequestsRemaining?: number;
  numBillAiRequestsRemaining?: number;
}) => void {
  const store = useStore(useStoreId());
  const { orgId } = useAuth();

  return useCallback(
    (updates) => {
      if (!store || !orgId) {
        return;
      }

      const current = store.getRow('subscriptionInformation', orgId);
      if (!current) {
        return;
      }

      const patch: Partial<typeof current> = {};
      if (typeof updates.numReceiptAiRequestsRemaining === 'number') {
        patch.numReceiptAiRequestsRemaining = updates.numReceiptAiRequestsRemaining;
      }
      if (typeof updates.numBillAiRequestsRemaining === 'number') {
        patch.numBillAiRequestsRemaining = updates.numBillAiRequestsRemaining;
      }

      if (Object.keys(patch).length > 0) {
        store.setRow('subscriptionInformation', orgId, { ...current, ...patch });
      }
    },
    [orgId, store],
  );
}

export function useUpdateNumReceiptAiRequestsRemainingCallback(): (remaining: number) => void {
  const updateApiRequestsRemaining = useUpdateApiRequestsRemainingCallback();

  return useCallback(
    (remaining: number) => {
      updateApiRequestsRemaining({ numReceiptAiRequestsRemaining: remaining });
    },
    [updateApiRequestsRemaining],
  );
}

export function useUpdateNumBillAiRequestsRemainingCallback(): (remaining: number) => void {
  const updateApiRequestsRemaining = useUpdateApiRequestsRemainingCallback();

  return useCallback(
    (remaining: number) => {
      updateApiRequestsRemaining({ numBillAiRequestsRemaining: remaining });
    },
    [updateApiRequestsRemaining],
  );
}
