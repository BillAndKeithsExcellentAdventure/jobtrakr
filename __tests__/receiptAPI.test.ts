/**
 * Tests for receipt API utility functions
 */

import { addReceipt, AddReceiptRequest, AddReceiptResponse } from '@/src/utils/receiptAPI';
import { mockApiSuccess, mockApiError, resetApiMocks, createMockGetToken } from '@/__mocks__/apiMocks';

// Mock the constants module
jest.mock('@/src/constants/app-constants', () => ({
  API_BASE_URL: 'https://test-api.example.com',
}));

describe('receiptAPI', () => {
  beforeEach(() => {
    resetApiMocks();
    jest.clearAllMocks();
  });

  afterEach(() => {
    resetApiMocks();
  });

  describe('addReceipt', () => {
    it('should successfully call the /addReceipt endpoint and return accounting ID', async () => {
      const mockGetToken = createMockGetToken('test-token');
      const mockResponse: AddReceiptResponse = {
        success: true,
        accountId: 'RECEIPT-PROJ-001',
      };

      mockApiSuccess(mockResponse);

      const request: AddReceiptRequest = {
        userId: 'user123',
        orgId: 'org456',
        projectId: 'proj789',
        projectAbbr: 'PROJ',
        projectName: 'Test Project',
        invoiceId: 'receipt123',
        imageId: 'image456',
        addAttachment: false,
      };

      const result = await addReceipt(request, mockGetToken);

      expect(result.success).toBe(true);
      expect(result.accountId).toBe('RECEIPT-PROJ-001');
      expect(mockGetToken).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        'https://test-api.example.com/addReceipt',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          }),
          body: JSON.stringify(request),
        }),
      );
    });

    it('should handle API errors gracefully', async () => {
      const mockGetToken = createMockGetToken('test-token');
      mockApiError(500, 'Internal Server Error');

      const request: AddReceiptRequest = {
        userId: 'user123',
        orgId: 'org456',
        projectId: 'proj789',
        projectAbbr: 'PROJ',
        projectName: 'Test Project',
        invoiceId: 'receipt123',
        imageId: 'image456',
        addAttachment: false,
      };

      await expect(addReceipt(request, mockGetToken)).rejects.toThrow();
    });

    it('should include QuickBooks data when provided', async () => {
      const mockGetToken = createMockGetToken('test-token');
      const mockResponse: AddReceiptResponse = {
        success: true,
        accountId: 'RECEIPT-PROJ-002',
        message: 'Bill created successfully',
        data: {
          Bill: {
            Id: '789',
            VendorRef: { value: '123' },
            TotalAmt: 100.0,
          },
        },
      };

      mockApiSuccess(mockResponse);

      const request: AddReceiptRequest = {
        userId: 'user123',
        orgId: 'org456',
        projectId: 'proj789',
        projectAbbr: 'PROJ',
        projectName: 'Test Project',
        invoiceId: 'receipt123',
        imageId: 'image456',
        addAttachment: true,
        qbBillData: {
          vendorRef: '123',
          lineItems: [
            {
              amount: 100,
              description: 'Test item',
              accountRef: '45',
            },
          ],
        },
      };

      const result = await addReceipt(request, mockGetToken);

      expect(result.success).toBe(true);
      expect(result.accountId).toBe('RECEIPT-PROJ-002');
      expect(result.message).toBe('Bill created successfully');
      expect(mockGetToken).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        'https://test-api.example.com/addReceipt',
        expect.objectContaining({
          body: JSON.stringify(request),
        }),
      );
    });

    it('should handle 404 errors', async () => {
      const mockGetToken = createMockGetToken('test-token');
      mockApiError(404, 'Not Found');

      const request: AddReceiptRequest = {
        userId: 'user123',
        orgId: 'org456',
        projectId: 'proj789',
        projectAbbr: 'PROJ',
        projectName: 'Test Project',
        invoiceId: 'receipt123',
        imageId: 'image456',
        addAttachment: false,
      };

      await expect(addReceipt(request, mockGetToken)).rejects.toThrow(
        'Failed to add receipt: 404',
      );
    });
  });
});
