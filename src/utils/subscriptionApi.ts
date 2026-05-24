import { API_BASE_URL } from '@/src/constants/app-constants';
import { createApiWithToken } from './apiWithToken';

interface ApiDefaultResponse {
  success: boolean;
  message?: string;
}

interface CancelSubscriptionResponse extends ApiDefaultResponse {
  data?: {
    orgId: string;
    nmiSubscriptionStatus: string;
    customerPlanId: string;
    nmiCustomerVaultId?: string;
  };
}

interface UpgradeSubscriptionResponse extends ApiDefaultResponse {
  data?: {
    orgId: string;
    newPlanId: string;
    newPlanName: string;
    newAmount: number;
    currency: string;
    nextChargeDate: string;
  };
}

export interface UpdateCardResult {
  checkoutUrl: string;
}

function buildQueryParams(params: Record<string, string | undefined>): string {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value && value.length > 0) {
      query.set(key, value);
    }
  }

  return query.toString();
}

/**
 * This endpoint serves HTML and is typically opened in an in-app browser.
 */
export async function getSelectSubscriptionHTML(orgId: string, userId?: string): Promise<string> {
  const query = buildQueryParams({ orgId, userId });
  const response = await fetch(`${API_BASE_URL}/nmi/startSubscription?${query}`, {
    method: 'GET',
    headers: {
      Accept: 'text/html',
    },
  });

  if (!response.ok) {
    let message = `Failed to load subscription HTML (${response.status})`;
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      try {
        const body = (await response.json()) as ApiDefaultResponse;
        if (body?.message) {
          message = body.message;
        }
      } catch {
        // Keep default message if parsing fails.
      }
    }

    throw new Error(message);
  }

  return await response.text();
}

/**
 * This endpoint serves EULA HTML and does not require authentication.
 */
export async function getEULAHTML(): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/getEULA`, {
    method: 'GET',
    headers: {
      Accept: 'text/html',
    },
  });

  if (!response.ok) {
    let message = `Failed to load EULA HTML (${response.status})`;
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      try {
        const body = (await response.json()) as ApiDefaultResponse;
        if (body?.message) {
          message = body.message;
        }
      } catch {
        // Keep default message if parsing fails.
      }
    }

    throw new Error(message);
  }

  return await response.text();
}

/**
 * Cancel an organization's active subscription and downgrade to the free plan.
 */
export async function cancelSubscription(
  orgId: string,
  userId: string,
  getToken: () => Promise<string | null>,
): Promise<CancelSubscriptionResponse> {
  const apiFetch = createApiWithToken(getToken);
  const query = buildQueryParams({ orgId, userId });

  const response = await apiFetch(`${API_BASE_URL}/nmi/cancelSubscription?${query}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data: CancelSubscriptionResponse = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to cancel subscription');
  }

  return data;
}

/**
 * Create a hosted card-update checkout URL for an existing subscription.
 * The backend endpoint redirects to /nmi/collectCheckout.
 */
export async function updateCard(
  orgId: string,
  userId: string,
  getToken: () => Promise<string | null>,
  email?: string,
  firstName?: string,
  lastName?: string,
): Promise<UpdateCardResult> {
  const apiFetch = createApiWithToken(getToken);
  const query = buildQueryParams({ orgId, userId, email, firstName, lastName });

  const response = await apiFetch(`${API_BASE_URL}/nmi/updateCard?${query}`, {
    method: 'GET',
    headers: {
      Accept: 'text/html',
    },
  });

  if (!response.ok) {
    let message = 'Failed to start card update flow';
    try {
      const body = (await response.json()) as ApiDefaultResponse;
      if (body?.message) {
        message = body.message;
      }
    } catch {
      // Keep default message if the response is HTML or otherwise non-JSON.
    }

    throw new Error(message);
  }

  return { checkoutUrl: response.url };
}

/**
 * Upgrade an organization's subscription to a new billable plan.
 */
export async function upgradeSubscription(
  orgId: string,
  userId: string,
  planId: string,
  getToken: () => Promise<string | null>,
): Promise<UpgradeSubscriptionResponse> {
  const apiFetch = createApiWithToken(getToken);

  const response = await apiFetch(`${API_BASE_URL}/nmi/upgradeSubscription`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      orgId,
      planId,
    }),
  });

  const data: UpgradeSubscriptionResponse = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to upgrade subscription');
  }

  return data;
}
