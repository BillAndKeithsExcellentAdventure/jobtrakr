import { describe, expect, it } from '@jest/globals';
import {
  DEV_ENTITLEMENTS_BY_TIER,
  isAiRequestsExhausted,
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
        numInvoices: 500, // legacy name — tests backward compat
        numReceiptApiRequests: 100, // legacy name — tests backward compat
        numInvoiceApiRequests: 100, // legacy name — tests backward compat
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
      numBills: 500,
      numReceiptAiRequests: 100,
      numBillAiRequests: 100,
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
          numBills: 999,
          numReceiptAiRequests: 999,
          numBillAiRequests: 999,
          numOrgUsers: 999,
        },
      },
    );

    expect(entitlements).toEqual(DEV_ENTITLEMENTS_BY_TIER.basic);
  });

  it('does not mark unlimited limits as reached', () => {
    // -1 is the canonical "unlimited" sentinel
    expect(isEntitlementLimitReached(-1, 0)).toBe(false);
    expect(isEntitlementLimitReached(-1, 1000)).toBe(false);
    // Any other negative value is also treated as unlimited
    expect(isEntitlementLimitReached(-2, 1000)).toBe(false);
    expect(isEntitlementLimitReached(-100, 9999)).toBe(false);
  });

  it('does not mark limit as reached when the store has not yet loaded (null)', () => {
    // null means the entitlements table is not yet populated — fail open
    expect(isEntitlementLimitReached(null, 0)).toBe(false);
    expect(isEntitlementLimitReached(null, 1000)).toBe(false);
  });

  it('marks a zero limit as always reached', () => {
    // limit of 0 means the feature is completely locked for this tier
    expect(isEntitlementLimitReached(0, 0)).toBe(true);
    expect(isEntitlementLimitReached(0, 1)).toBe(true);
  });

  it('marks exact numeric limits as reached at the boundary', () => {
    expect(isEntitlementLimitReached(10, 9)).toBe(false);
    expect(isEntitlementLimitReached(10, 10)).toBe(true);
    expect(isEntitlementLimitReached(10, 11)).toBe(true);
  });
});

describe('isAiRequestsExhausted', () => {
  it('returns false for -1 (unlimited sentinel)', () => {
    // -1 means the server has placed no cap on AI requests for this tier
    expect(isAiRequestsExhausted(-1)).toBe(false);
  });

  it('returns false for any other negative value', () => {
    expect(isAiRequestsExhausted(-2)).toBe(false);
    expect(isAiRequestsExhausted(-100)).toBe(false);
  });

  it('returns true when remaining count is 0 (exhausted)', () => {
    expect(isAiRequestsExhausted(0)).toBe(true);
  });

  it('returns false when requests are still remaining', () => {
    expect(isAiRequestsExhausted(1)).toBe(false);
    expect(isAiRequestsExhausted(50)).toBe(false);
  });
});
