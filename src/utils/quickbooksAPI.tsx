import { VendorData } from '../tbStores/configurationStore/ConfigurationStoreHooks';
import { createApiWithToken } from './apiWithToken';
import { API_BASE_URL } from '@/src/constants/app-constants';

// ---------------------------------------------------------------------------
// Internal response primitives
// ---------------------------------------------------------------------------

interface ApiDefaultResponse {
  success: boolean;
  message?: string;
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

// ---------------------------------------------------------------------------
// Shared QB primitives
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Account types
// ---------------------------------------------------------------------------

/** A QuickBooks account as returned by /qbo/fetchAccounts. */
interface QBAccountData {
  id: string;
  name: string;
  classification?: string;
  accountType?: string;
  accountSubType?: string;
}

/** Company information returned by /qbo/fetchCompanyInfo. */
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

// ---------------------------------------------------------------------------
// Vendor / Customer types
// ---------------------------------------------------------------------------

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
  Id: string;
  DisplayName: string; // This could be person or company name.
  PrimaryEmailAddr?: QBEmail;
  PrimaryPhone?: QBPhone;
  BillAddr?: QBAddress;
  Active?: boolean;
  GivenName?: string;
  FamilyName?: string;
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

export interface AddCustomerRequest {
  displayName: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  address?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
}

export interface AddCustomerResponse {
  success: boolean;
  message: string;
  newQBId?: string;
}

// ---------------------------------------------------------------------------
// Bill (Invoice) types
// ---------------------------------------------------------------------------

export interface BillLineItem {
  amount: number;
  description: string;
  accountRef?: string;
}

export interface QBBillData {
  vendorRef: string;
  dueDate?: string;
  docNumber?: string;
  privateNote?: string;
  lineItems: BillLineItem[];
}

export interface AddBillRequest {
  projectId: string;
  projectAbbr: string;
  projectName: string;
  addAttachment: boolean;
  imageId: string;
  qbBillData?: QBBillData;
}

export interface AddBillResponse {
  success: boolean;
  message?: string;
  accountId?: string;
  data?: {
    Bill?: {
      Id: string; // billId
      DocNumber?: string; // accountingId
    };
  };
}

export interface UpdateBillRequest {
  projectId: string;
  projectAbbr: string;
  projectName: string;
  billId: string; // QuickBooks Bill Id. Required for updating an existing bill.
  addAttachment: boolean;
  imageId: string;
  qbBillData?: QBBillData;
}

export interface UpdateBillResponse {
  success: boolean;
  message?: string;
  data?: {
    Bill: {
      Id: string;
      DocNumber?: string;
    };
  };
}

interface DeleteBillRequest {
  orgId: string;
  userId: string;
  projectId: string;
  accountingId: string;
}

export interface DeleteBillResponse {
  Id: string;
  status?: string;
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

// ---------------------------------------------------------------------------
// Receipt (Purchase) types
// ---------------------------------------------------------------------------

/** A line item within a QuickBooks bill/receipt. `amount` is a formatted string (e.g. "12.50"). */
export interface QBBillLineItem {
  amount: string;
  description: string;
  accountRef: string; // expense account ref
  projectId?: string; // only set when line item belongs to a different project than the receipt
}

export interface QBReceiptLineItem {
  amount: string;
  description: string;
  accountRef: string; // expense account
  projectId?: string; // support receipts with line-items for multiple projects.
}

export interface QBReceiptData {
  vendorRef: string;
  dueDate?: string;
  docNumber?: string;
  privateNote?: string;
  lineItems: QBReceiptLineItem[];
}

export interface AddReceiptRequest {
  userId: string;
  orgId: string;
  projectId: string;
  projectAbbr: string;
  projectName: string;
  imageId: string;
  addAttachment: boolean;
  qbBillData?: QBReceiptData;
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
      DocNumber?: string; // accountingId
    };
  };
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

interface DeleteReceiptRequest {
  purchaseId: string; // QuickBooks Purchase Id. Required for deleting an existing purchase.
  orgId: string;
  userId: string;
  projectId: string;
}

// ---------------------------------------------------------------------------
// Project types
// ---------------------------------------------------------------------------

export interface AddProjectRequest {
  customerId: string;
  projectName: string;
  projectId: string;
}

export interface AddProjectResponse {
  success: boolean;
  message?: string;
  newQBId?: string;
}

export interface UpdateProjectResponse {
  success: boolean;
  message?: string;
  qbId?: string;
}

// ---------------------------------------------------------------------------
// Auth / connection functions
// ---------------------------------------------------------------------------

/**
 * Initiate OAuth connection to QuickBooks and return the authorization URL.
 *
 * @param orgId - The organization ID
 * @param userId - The user ID
 * @param getToken - Function to get the authentication token
 * @returns An object containing the QuickBooks authorization URL to open in a browser
 */
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

/**
 * Disconnect the current QuickBooks OAuth session for the organization.
 *
 * @param orgId - The organization ID
 * @param userId - The user ID
 * @param getToken - Function to get the authentication token
 */
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

/**
 * Check whether the organization currently has an active QuickBooks connection.
 *
 * @param orgId - The organization ID
 * @param userId - The user ID
 * @param getToken - Function to get the authentication token
 * @returns True if the organization is connected to QuickBooks
 */
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

// ---------------------------------------------------------------------------
// Vendor / Customer functions
// ---------------------------------------------------------------------------

/**
 * Fetch all vendors from QuickBooks for the organization.
 *
 * @param orgId - The organization ID
 * @param userId - The user ID
 * @param getToken - Function to get the authentication token
 * @returns Array of vendor data
 */
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

/**
 * Fetch all customers from QuickBooks for the organization.
 *
 * @param orgId - The organization ID
 * @param userId - The user ID
 * @param getToken - Function to get the authentication token
 * @returns Array of QuickBooks customer records
 */
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

  const data: ApiDataResponse<{ QueryResponse: { Customer: QuickBooksCustomer[] } }> = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch customers');
  }

  const customers = data.data?.QueryResponse.Customer;
  // Ensure we always return an array
  if (!customers || !Array.isArray(customers)) {
    return [];
  }

  return customers;
}

/**
 * Add a new vendor to QuickBooks.
 *
 * @param orgId - The organization ID
 * @param userId - The user ID
 * @param QuickBooksVendor - The vendor data to create
 * @param getToken - Function to get the authentication token
 * @returns The newly created QuickBooks vendor record
 */
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

/**
 * Add a new customer to QuickBooks.
 *
 * @param orgId - The organization ID
 * @param userId - The user ID
 * @param customer - The customer data to create
 * @param getToken - Function to get the authentication token
 * @returns The response containing the new QB customer ID
 */
export async function addCustomer(
  orgId: string,
  userId: string,
  customer: AddCustomerRequest,
  getToken: () => Promise<string | null>,
): Promise<AddCustomerResponse> {
  const apiFetch = createApiWithToken(getToken);

  const response = await apiFetch(`${API_BASE_URL}/qbo/addCustomer?orgId=${orgId}&userId=${userId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(customer),
  });

  const data: AddCustomerResponse = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to add customer');
  }

  return data;
}

// ---------------------------------------------------------------------------
// Bill (Invoice) functions
// ---------------------------------------------------------------------------

/**
 * Create a new Bill in QuickBooks for an invoice.
 *
 * @param orgId - The organization ID
 * @param userId - The user ID
 * @param bill - The bill data to create, including line items and optional attachment
 * @param getToken - Function to get the authentication token
 * @returns The response containing the new bill ID and doc number
 */
export async function addBill(
  orgId: string,
  userId: string,
  bill: AddBillRequest,
  getToken: () => Promise<string | null>,
): Promise<AddBillResponse> {
  const apiFetch = createApiWithToken(getToken);

  const response = await apiFetch(`${API_BASE_URL}/qbo/addBill?orgId=${orgId}&userId=${userId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bill),
  });

  const data: AddBillResponse = await response.json();
  if (!data.success) {
    throw new Error(data.message);
  }

  return data;
}

/**
 * Update an existing Bill in QuickBooks for an invoice.
 *
 * @param orgId - The organization ID
 * @param userId - The user ID
 * @param bill - The bill data to update, including the billId and updated fields
 * @param getToken - Function to get the authentication token
 * @returns The response containing the updated bill ID and doc number
 */
export async function updateBill(
  orgId: string,
  userId: string,
  bill: AddBillRequest,
  getToken: () => Promise<string | null>,
): Promise<UpdateBillResponse> {
  const apiFetch = createApiWithToken(getToken);

  const response = await apiFetch(`${API_BASE_URL}/qbo/editBill?orgId=${orgId}&userId=${userId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bill),
  });

  const data: UpdateBillResponse = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to edit bill');
  }

  return data;
}

/**
 * Delete a Bill from QuickBooks by its accounting ID.
 *
 * @param orgId - The organization ID
 * @param userId - The user ID
 * @param projectId - The project ID the bill belongs to
 * @param accountingId - The QuickBooks Bill DocNumber / accounting ID
 * @param getToken - Function to get the authentication token
 * @returns The deleted bill reference
 */
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

/**
 * Record a bill payment in QuickBooks.
 *
 * @param orgId - The organization ID
 * @param userId - The user ID
 * @param payment - The payment data including bill reference, account, and amount
 * @param getToken - Function to get the authentication token
 * @returns The created BillPayment record
 */
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

// ---------------------------------------------------------------------------
// Company / Account functions
// ---------------------------------------------------------------------------

/**
 * Fetch the QuickBooks company profile information for the organization.
 *
 * @param orgId - The organization ID
 * @param userId - The user ID
 * @param getToken - Function to get the authentication token
 * @returns Company information including name, address, and contact details
 */
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

/**
 * Fetch all chart-of-accounts entries from QuickBooks for the organization.
 *
 * @param orgId - The organization ID
 * @param userId - The user ID
 * @param getToken - Function to get the authentication token
 * @returns Array of account data including type and sub-type classification
 */
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

// ---------------------------------------------------------------------------
// Receipt (Purchase) functions
// ---------------------------------------------------------------------------

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

  const response = await apiFetch(`${API_BASE_URL}/qbo/addReceipt`, {
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

// ---------------------------------------------------------------------------
// Project functions
// ---------------------------------------------------------------------------

/**
 * Check if a project exists in QuickBooks.
 *
 * @param orgId - The organization ID
 * @param projectId - The project ID to check
 * @param userId - The user ID
 * @param getToken - Function to get the authentication token
 * @returns True if the project exists, false otherwise
 */
export async function doesProjectExistInQuickBooks(
  orgId: string,
  projectId: string,
  userId: string,
  getToken: () => Promise<string | null>,
): Promise<boolean> {
  const apiFetch = createApiWithToken(getToken);

  console.log('[QB] doesProjectExistInQuickBooks - Checking if project exists:', {
    orgId,
    projectId,
    userId,
  });

  const response = await apiFetch(
    `${API_BASE_URL}/qbo/doesProjectExist?orgId=${orgId}&projectId=${projectId}&userId=${userId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

  const data: ApiDefaultResponse = await response.json();
  console.log('[QB] doesProjectExistInQuickBooks - Response:', {
    projectId,
    exists: data.success === true,
  });

  return data.success === true;
}

/**
 * Add a project to QuickBooks as a sub-customer.
 *
 * @param orgId - The organization ID
 * @param userId - The user ID
 * @param project - The project data to add
 * @param getToken - Function to get the authentication token
 * @returns The response containing the new QB ID
 */
export async function addProjectToQuickBooks(
  orgId: string,
  userId: string,
  project: AddProjectRequest,
  getToken: () => Promise<string | null>,
): Promise<AddProjectResponse> {
  const apiFetch = createApiWithToken(getToken);

  const requestBody = JSON.stringify(project);
  console.log('[QB] addProjectToQuickBooks - Request body:', requestBody);

  const response = await apiFetch(`${API_BASE_URL}/qbo/addProject?orgId=${orgId}&userId=${userId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: requestBody,
  });

  const data: AddProjectResponse = await response.json();

  if (!data.success) {
    console.error('[QB] addProjectToQuickBooks - API returned success: false', {
      message: data.message,
      data,
    });
    throw new Error(data.message || 'Failed to add project to QuickBooks');
  }

  return data;
}

/**
 * Update an existing project in QuickBooks.
 *
 * @param orgId - The organization ID
 * @param userId - The user ID
 * @param project - The project data to update
 * @param getToken - Function to get the authentication token
 * @returns The response containing the QB ID
 */
export async function updateProjectInQuickBooks(
  orgId: string,
  userId: string,
  project: AddProjectRequest,
  getToken: () => Promise<string | null>,
): Promise<UpdateProjectResponse> {
  const apiFetch = createApiWithToken(getToken);

  console.log('[QB] updateProjectInQuickBooks - Input parameters:', {
    orgId,
    userId,
    projectId: project.projectId,
    projectName: project.projectName,
    customerId: project.customerId,
    customerIdType: typeof project.customerId,
  });

  const requestBody = JSON.stringify(project);
  console.log('[QB] updateProjectInQuickBooks - Request body:', requestBody);

  const response = await apiFetch(`${API_BASE_URL}/qbo/updateProject?orgId=${orgId}&userId=${userId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: requestBody,
  });

  console.log('[QB] updateProjectInQuickBooks - Response status:', response.status);

  const data: UpdateProjectResponse = await response.json();
  console.log('[QB] updateProjectInQuickBooks - Response data:', data);

  if (!data.success) {
    console.error('[QB] updateProjectInQuickBooks - API returned success: false', {
      message: data.message,
      data,
    });
    throw new Error(data.message || 'Failed to update project in QuickBooks');
  }

  console.log('[QB] updateProjectInQuickBooks - Successfully updated project with QB ID:', data.qbId);
  return data;
}

// ---------------------------------------------------------------------------
// Receipt delete
// ---------------------------------------------------------------------------

/**
 * Delete a Purchase (receipt) from QuickBooks.
 *
 * @param orgId - The organization ID
 * @param userId - The user ID
 * @param projectId - The project ID the receipt belongs to
 * @param purchaseId - The QuickBooks Purchase ID to delete
 * @param getToken - Function to get the authentication token
 * @returns The API default response indicating success or failure
 */
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
