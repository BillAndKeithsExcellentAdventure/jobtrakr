import { VendorData } from '../tbStores/configurationStore/ConfigurationStoreHooks';
import { createApiWithToken } from './apiWithToken';
import { API_BASE_URL } from '@/src/constants/app-constants';

interface ApiDefaultResponse {
  success: boolean;
  message?: string;
}

interface QBAccountData {
  id: string;
  name: string;
  classification?: string;
  accountType?: string;
  accountSubType?: string;
}

interface ApiDataResponse<T> extends ApiDefaultResponse {
  data?: T;
}

interface ApiConnectionResponse extends ApiDefaultResponse {
  authUrl: string;
}

interface ApiIsConnectedResponse extends ApiDefaultResponse {
  isConnected: boolean;
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

export interface QuickBooksCustomer {
  id: string;
  displayName: string; // This could be person or company name.
  email?: string;
  phone?: string;
  active?: boolean;
  contactName?: string; // Optional field for contact name, not in QuickBooks
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
): Promise<VendorData[]> {
  const apiFetch = createApiWithToken(getToken);

  const response = await apiFetch(`${API_BASE_URL}/qbo/fetchVendors?orgId=${orgId}&userId=${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data: ApiDataResponse<VendorData[]> = await response.json();
  if (!data.success) {
    throw new Error(data.message);
  }

  return data.data || [];
}

export async function fetchCustomers(
  orgId: string,
  userId: string,
  getToken: () => Promise<string | null>,
): Promise<QuickBooksCustomer[]> {
  const apiFetch = createApiWithToken(getToken);

  const response = await apiFetch(`${API_BASE_URL}/qbo/fetchCustomers?orgId=${orgId}&userId=${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data: ApiDataResponse<{ QueryResponse: QuickBooksCustomer[] }> = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch customers');
  }

  return data.data?.QueryResponse || [];
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

interface DeleteReceiptRequest {
  purchaseId: string; // QuickBooks Purchase Id. Required for deleting an existing purchase.
  orgId: string;
  userId: string;
  projectId: string;
}

export interface DeleteBillRequest {
  orgId: string;
  userId: string;
  projectId: string;
  accountingId: string;
}

export interface DeleteBillResponse {
  Id: string;
  status?: string;
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

export async function deleteBillFromQuickBooks(
  orgId: string,
  userId: string,
  projectId: string,
  accountingId: string,
  getToken: () => Promise<string | null>,
): Promise<DeleteBillResponse> {
  const apiFetch = createApiWithToken(getToken);

  const response = await apiFetch(`${API_BASE_URL}/qbo/deleteBill?orgId=${orgId}&userId=${userId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ orgId, userId, projectId, accountingId } as DeleteBillRequest),
  });

  const data: ApiDataResponse<{ Bill: DeleteBillResponse }> = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to delete bill');
  }

  return data.data?.Bill || ({ Id: '', status: 'Deleted' } as DeleteBillResponse);
}

export interface QBCompanyInfo {
  companyName: string;
  address: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  email: string;
  phone: string;
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

  const data: ApiDataResponse<{ BillPayment: BillPayment }> = await response.json();
  if (!data.success) {
    throw new Error(data.message);
  }

  return data.data?.BillPayment || ({ Id: '', TotalAmt: 0 } as BillPayment);
}

export async function fetchCompanyInfo(
  orgId: string,
  userId: string,
  getToken: () => Promise<string | null>,
): Promise<QBCompanyInfo> {
  const apiFetch = createApiWithToken(getToken);

  const response = await apiFetch(`${API_BASE_URL}/qbo/fetchCompanyInfo?orgId=${orgId}&userId=${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data: ApiDataResponse<QBCompanyInfo> = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch company information');
  }

  if (!data.data) {
    throw new Error('No company information returned');
  }

  return data.data;
}

export async function fetchAccounts(
  orgId: string,
  userId: string,
  getToken: () => Promise<string | null>,
): Promise<QBAccountData[]> {
  const apiFetch = createApiWithToken(getToken);

  const response = await apiFetch(`${API_BASE_URL}/qbo/fetchAccounts?orgId=${orgId}&userId=${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data: ApiDataResponse<QBAccountData[]> = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch accounts');
  }

  return data.data || [];
}

export interface QBBillLineItem {
  amount: string;
  description: string;
  accountRef: string; // expense account
  projectId?: string; // support receipts with line-items for multiple projects.
}

interface QBAccountData {
  paymentAccountRef?: string;
  paymentType?: 'Checking' | 'CreditCard'; // accountSubType from QuickBooks
  checkNumber?: string;
}

export interface QBBillData {
  vendorRef: string;
  dueDate?: string;
  docNumber?: string;
  privateNote?: string;
  lineItems: QBBillLineItem[];
}

export interface AddReceiptRequest {
  userId: string;
  orgId: string;
  projectId: string;
  projectAbbr: string;
  projectName: string;
  imageId: string;
  addAttachment: boolean;
  qbBillData?: QBBillData;
}

export interface AddReceiptResponse {
  success: boolean;
  message?: string;
  accountId?: string;
  data?: {
    Purchase?: {
      Id: string; // purchaseId
      PaymentType: string;
      TotalAmt: number;
      TxnDate?: string;
      DocNumber?: string; //accountingId
    };
  };
}

/**
 * Add a receipt to the backend and optionally create a QuickBooks bill.
 *
 * @param receiptData - The receipt data to send to the backend
 * @param getToken - Function to get the authentication token
 * @returns The response containing accountingId and optionally billId
 */
export async function addReceiptToQuickBooks(
  receiptData: AddReceiptRequest,
  getToken: () => Promise<string | null>,
): Promise<AddReceiptResponse> {
  const apiFetch = createApiWithToken(getToken);

  const response = await apiFetch(`${API_BASE_URL}/addReceipt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(receiptData),
  });

  const data: AddReceiptResponse = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to add receipt');
  }

  return data;
}

export interface EditReceiptRequest {
  orgId: string;
  userId: string;
  projectId: string;
  projectName: string;
  accountingId: string;
  purchaseId: string;
  projectAbbr?: string;
  imageId?: string;
  addAttachment: boolean;
  qbPurchaseData: {
    vendorRef: string;
    txnDate: string;
    docNumber?: string;
    privateNote?: string;
    paymentAccount?: {
      paymentAccountRef: string;
      paymentType?: string;
      checkNumber?: string;
    };
    lineItems: QBBillLineItem[];
  };
}

/**
 * Update an existing receipt (purchase) in QuickBooks.
 *
 * @param receiptData - The receipt data to update in QuickBooks
 * @param getToken - Function to get the authentication token
 * @returns The response containing the updated purchase information
 */
export async function editReceiptInQuickBooks(
  receiptData: EditReceiptRequest,
  getToken: () => Promise<string | null>,
): Promise<AddReceiptResponse> {
  const apiFetch = createApiWithToken(getToken);

  const response = await apiFetch(
    `${API_BASE_URL}/qbo/editReceipt?orgId=${receiptData.orgId}&userId=${receiptData.userId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(receiptData),
    },
  );

  const data: AddReceiptResponse = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to edit receipt');
  }

  return data;
}

export async function deleteReceiptFromQuickBooks(
  orgId: string,
  userId: string,
  projectId: string,
  purchaseId: string,
  getToken: () => Promise<string | null>,
): Promise<ApiDefaultResponse> {
  const apiFetch = createApiWithToken(getToken);

  const deletePayload: DeleteReceiptRequest = {
    purchaseId,
    orgId,
    userId,
    projectId,
  };

  const response = await apiFetch(`${API_BASE_URL}/qbo/deleteReceipt?orgId=${orgId}&userId=${userId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(deletePayload),
  });

  const data: ApiDefaultResponse = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to delete receipt');
  }

  return data;
}
