/**
 * Utility functions for receipt API calls, specifically for the /addReceipt endpoint
 * which handles QuickBooks integration and accounting ID generation.
 */

import { API_BASE_URL } from '@/src/constants/app-constants';
import { createApiWithToken } from './apiWithToken';

/**
 * QuickBooks bill line item data structure
 */
export interface QBBillLineItem {
  amount: number;
  description: string;
  accountRef: string;
}

/**
 * QuickBooks bill data structure
 */
export interface QBBillData {
  vendorRef: string;
  dueDate?: string;
  docNumber?: string;
  privateNote?: string;
  lineItems: QBBillLineItem[];
}

/**
 * Request payload for /addReceipt endpoint
 */
export interface AddReceiptRequest {
  userId: string;
  orgId: string;
  projectId: string;
  projectAbbr: string;
  projectName: string;
  invoiceId: string; // Receipt ID in our system
  imageId: string;
  addAttachment: boolean;
  qbBillData?: QBBillData;
}

/**
 * Response from /addReceipt endpoint
 */
export interface AddReceiptResponse {
  success: boolean;
  accountId?: string; // The accounting ID (e.g., "RECEIPT-PROJ-001") - named accountId in API response
  message?: string;
  data?: any; // QuickBooks bill data if created
}

/**
 * Calls the /addReceipt endpoint to generate an accounting ID and optionally create a QuickBooks bill.
 * This should be called after the receipt image has been uploaded via /addReceiptImage.
 *
 * @param request - The receipt data including project info and optional QuickBooks data
 * @param getToken - Function to get the authentication token from Clerk
 * @returns Promise resolving to the response containing the accounting ID
 * @throws Error if the API call fails
 */
export async function addReceipt(
  request: AddReceiptRequest,
  getToken: () => Promise<string | null>,
): Promise<AddReceiptResponse> {
  const apiFetch = createApiWithToken(getToken);
  const url = `${API_BASE_URL}/addReceipt`;

  try {
    const response = await apiFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to add receipt:', response.status, errorText);
      throw new Error(`Failed to add receipt: ${response.status} - ${errorText}`);
    }

    const data: AddReceiptResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error calling /addReceipt:', error);
    throw error;
  }
}
