import { describe, expect, it } from '@jest/globals';
import {
  DEV_ENTITLEMENTS_BY_TIER,
  isEntitlementLimitReached,
  parseEntitlementsPayload,
  resolveEntitlementsPayload,
} from '@/src/tbStores/appSettingsStore/appSettingsStoreHooks';

describe('app settings entitlements helpers', () => {
  it('parses a valid entitlements payload including office expense projects', () => {
    const parsed = parseEntitlementsPayload(
      JSON.stringify({
        allowQuickBooksSync: true,
        allowChangeOrderEmails: false,
        allowPublishPhotosAndVideos: true,
        allowVendorPaymentReview: false,
        numProjects: 10,
        numOfficeExpenseProjects: 2,
        numProjectPhotos: 200,
        numProjectVideos: 20,
        numReceipts: 500,
        numInvoices: 500,
        numPhotosApiRequests: 100,
        numInvoicesApiRequests: 100,
        numOrgUsers: 5,
      }),
    );

    expect(parsed).toEqual({
      allowQuickBooksSync: true,
      allowChangeOrderEmails: false,
      allowPublishPhotosAndVideos: true,
      allowVendorPaymentReview: false,
      numProjects: 10,
      numOfficeExpenseProjects: 2,
      numProjectPhotos: 200,
      numProjectVideos: 20,
      numReceipts: 500,
      numInvoices: 500,
      numPhotosApiRequests: 100,
      numInvoicesApiRequests: 100,
      numOrgUsers: 5,
    });
  });

  it('returns null for invalid entitlements json', () => {
    expect(parseEntitlementsPayload('{invalid-json')).toBeNull();
  });

  it('uses dev override entitlements when enabled in development', () => {
    const entitlements = resolveEntitlementsPayload(
      {
        useDevSubscriptionOverride: true,
        devSubscriptionTier: 'basic',
      },
      {
        isDevelopment: true,
        storedEntitlements: {
          allowQuickBooksSync: true,
          allowChangeOrderEmails: true,
          allowPublishPhotosAndVideos: true,
          allowVendorPaymentReview: true,
          numProjects: 999,
          numOfficeExpenseProjects: 999,
          numProjectPhotos: 999,
          numProjectVideos: 999,
          numReceipts: 999,
          numInvoices: 999,
          numPhotosApiRequests: 999,
          numInvoicesApiRequests: 999,
          numOrgUsers: 999,
        },
      },
    );

    expect(entitlements).toEqual(DEV_ENTITLEMENTS_BY_TIER.basic);
  });

  it('does not mark unlimited limits as reached', () => {
    expect(isEntitlementLimitReached(-1, 1000)).toBe(false);
  });

  it('marks exact numeric limits as reached at the boundary', () => {
    expect(isEntitlementLimitReached(10, 9)).toBe(false);
    expect(isEntitlementLimitReached(10, 10)).toBe(true);
    expect(isEntitlementLimitReached(10, 11)).toBe(true);
  });
});
