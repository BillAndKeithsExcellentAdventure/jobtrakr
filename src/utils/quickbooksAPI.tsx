import { createApiWithToken } from './apiWithToken';
import { API_BASE_URL } from '@/src/constants/app-constants';

interface ApiDefaultResponse {
  success: boolean;
  message?: string;
}

interface ApiDataResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

interface ApiConnectionResponse {
  success: boolean;
  authUrl: string;
  message?: string;
}

interface ApiIsConnectedResponse {
  success: boolean;
  isConnected: boolean;
  message?: string;
}

type ApiResponse<T> = ApiDataResponse<T> | ApiConnectionResponse;

export interface QBEmail {
  Address: string;
}

export interface QBAddress {
  City: string;
  CountrySubDivisionCode: string;
  Line1: string;
  Line2?: string;
  PostalCode: string;
}

export interface QBPhone {
  FreeFormNumber: string;
}

export interface QuickBooksVendor {
  DisplayName: string;
  CompanyName?: string;
  GivenName?: string;
  FamilyName?: string;
  PrimaryEmailAddr?: QBEmail;
  PrimaryPhone?: QBPhone;
  Mobile?: QBPhone;
  BillAddr?: QBAddress;
  Active?: boolean;
  Id: string;
}

export interface AddVendorRequest {
  DisplayName: string;
  CompanyName?: string;
  GivenName?: string;
  FamilyName?: string;
  PrimaryEmailAddr?: QBEmail;
  Phone?: string;
  BillAddr?: QBAddress;
  Active?: boolean;
  Id: string;
}

export async function connectToQuickBooks(
  orgId: string,
  userId: string,
  getToken: () => Promise<string | null>,
): Promise<{ authUrl: string }> {
  const apiFetch = createApiWithToken(getToken);

  const response = await apiFetch(`${API_BASE_URL}/auth/qbo/connect?orgId=${orgId}&userId=${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data: ApiConnectionResponse = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to connect to QuickBooks');
  }

  if (!data.authUrl) {
    throw new Error('No authorization URL returned from QuickBooks');
  }

  return data || { authUrl: '' };
}

export async function disconnectQuickBooks(
  orgId: string,
  userId: string,
  getToken: () => Promise<string | null>,
): Promise<void> {
  const apiFetch = createApiWithToken(getToken);

  const response = await apiFetch(`${API_BASE_URL}/auth/qbo/disconnect?orgId=${orgId}&userId=${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data: ApiResponse<unknown> = await response.json();
  if (!data.success) {
    throw new Error(data.message);
  }
}

export async function isQuickBooksConnected(
  orgId: string,
  userId: string,
  getToken: () => Promise<string | null>,
): Promise<boolean> {
  const apiFetch = createApiWithToken(getToken);

  const response = await apiFetch(`${API_BASE_URL}/qbo/isConnected?orgId=${orgId}&userId=${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data: ApiIsConnectedResponse = await response.json();
  if (!data.success) {
    throw new Error(data.message);
  }

  return data.isConnected || false;
}

export async function fetchVendors(
  orgId: string,
  userId: string,
  getToken: () => Promise<string | null>,
): Promise<QuickBooksVendor[]> {
  const apiFetch = createApiWithToken(getToken);

  const response = await apiFetch(`${API_BASE_URL}/qbo/fetchVendors?orgId=${orgId}&userId=${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data: ApiDataResponse<{ QueryResponse?: { Vendor: QuickBooksVendor[] } }> = await response.json();
  if (!data.success) {
    throw new Error(data.message);
  }

  return data.data?.QueryResponse?.Vendor || [];
}

export async function addVendor(
  orgId: string,
  userId: string,
  QuickBooksVendor: AddVendorRequest,
  getToken: () => Promise<string | null>,
): Promise<QuickBooksVendor> {
  const apiFetch = createApiWithToken(getToken);

  const response = await apiFetch(`${API_BASE_URL}/qbo/addVendor?orgId=${orgId}&userId=${userId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(QuickBooksVendor),
  });

  const data: ApiDataResponse<{ QueryResponse: QuickBooksVendor }> = await response.json();
  if (!data.success) {
    throw new Error(data.message);
  }

  return data.data?.QueryResponse || ({ Id: '', DisplayName: '' } as QuickBooksVendor);
}

export interface LineItem {
  amount: number;
  description: string;
  accountRef?: { value: string };
  itemRef?: { value: string };
  qty?: number;
  unitPrice?: number;
}

export interface AddBillRequest {
  vendorRef: { value: string };
  lineItems: LineItem[];
  txnDate?: string;
  dueDate?: string;
  docNumber?: string;
  privateNote?: string;
}

export interface Bill {
  Id: string;
  VendorRef: { value: string };
  TotalAmt: number;
}

export async function addBill(
  orgId: string,
  userId: string,
  bill: AddBillRequest,
  getToken: () => Promise<string | null>,
): Promise<Bill> {
  const apiFetch = createApiWithToken(getToken);

  const response = await apiFetch(`${API_BASE_URL}/qbo/addBill?orgId=${orgId}&userId=${userId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bill),
  });

  const data: ApiDataResponse<{ Bill: Bill }> = await response.json();
  if (!data.success) {
    throw new Error(data.message);
  }

  return data.data?.Bill || ({ Id: '', VendorRef: { value: '' }, TotalAmt: 0 } as Bill);
}

export interface PayBillLineItem {
  amount: number;
  billLineRef: { value: string };
}

export interface PayBillRequest {
  billRef: { value: string };
  paymentAccountRef: { value: string };
  totalAmt: number;
  paymentMethodRef?: { value: string };
  paymentDate?: string;
  privateNote?: string;
  checkPayment?: { checkNum: string };
  lineItems?: PayBillLineItem[];
}

export interface BillPayment {
  Id: string;
  TotalAmt: number;
  PaymentType?: string;
}

export async function payBill(
  orgId: string,
  userId: string,
  payment: PayBillRequest,
  getToken: () => Promise<string | null>,
): Promise<BillPayment> {
  const apiFetch = createApiWithToken(getToken);

  const response = await apiFetch(`${API_BASE_URL}/qbo/payBill?orgId=${orgId}&userId=${userId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payment),
  });

  const data: ApiResponse<{ BillPayment: BillPayment }> = await response.json();
  if (!data.success) {
    throw new Error(data.message);
  }

  return data.data?.BillPayment || ({ Id: '', TotalAmt: 0 } as BillPayment);
}
