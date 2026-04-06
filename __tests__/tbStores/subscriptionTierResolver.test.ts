import { describe, expect, it } from '@jest/globals';
import {
  DEFAULT_SUBSCRIPTION_TIER,
  resolveEffectiveSubscriptionTier,
} from '@/src/tbStores/appSettingsStore/appSettingsStoreHooks';

describe('resolveEffectiveSubscriptionTier', () => {
  it('uses the dev tier when running in development and override is enabled', () => {
    const tier = resolveEffectiveSubscriptionTier(
      {
        useDevSubscriptionOverride: true,
        devSubscriptionTier: 'premium',
      },
      {
        isDevelopment: true,
        backendTier: 'basic',
      },
    );

    expect(tier).toBe('premium');
  });

  it('uses backend tier when development override is disabled', () => {
    const tier = resolveEffectiveSubscriptionTier(
      {
        useDevSubscriptionOverride: false,
        devSubscriptionTier: 'premium',
      },
      {
        isDevelopment: true,
        backendTier: 'basic',
      },
    );

    expect(tier).toBe('basic');
  });

  it('uses backend tier when not in development', () => {
    const tier = resolveEffectiveSubscriptionTier(
      {
        useDevSubscriptionOverride: true,
        devSubscriptionTier: 'premium',
      },
      {
        isDevelopment: false,
        backendTier: 'basic',
      },
    );

    expect(tier).toBe('basic');
  });

  it('falls back to default tier when backend tier is not provided', () => {
    const tier = resolveEffectiveSubscriptionTier(
      {
        useDevSubscriptionOverride: false,
        devSubscriptionTier: 'free',
      },
      {
        isDevelopment: false,
      },
    );

    expect(tier).toBe(DEFAULT_SUBSCRIPTION_TIER);
  });

  it('falls back to default tier when backend tier is invalid', () => {
    const tier = resolveEffectiveSubscriptionTier(
      {
        useDevSubscriptionOverride: false,
        devSubscriptionTier: 'free',
      },
      {
        isDevelopment: false,
        backendTier: 'starter' as any,
      },
    );

    expect(tier).toBe(DEFAULT_SUBSCRIPTION_TIER);
  });
});
