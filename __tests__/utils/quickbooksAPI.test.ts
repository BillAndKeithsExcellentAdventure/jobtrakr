/**
 * Tests for QuickBooks API utilities
 */
import { addReceiptToQuickBooks, AddReceiptRequest } from '@/src/utils/quickbooksAPI';
import {
  mockApiSuccess,
  mockApiError,
  resetApiMocks,
  createMockGetToken,
} from '@/__mocks__/apiMocks';

describe('quickbooksAPI', () => {
  beforeEach(() => {
    resetApiMocks();
    jest.clearAllMocks();
  });

  afterEach(() => {
    resetApiMocks();
  });

  describe('addReceiptToQuickBooks', () => {
    const mockReceiptData: AddReceiptRequest = {
      userId: 'user-123',
      orgId: 'org-456',
      projectId: 'proj-789',
      projectAbbr: 'TEST',
      projectName: 'Test Project',
      invoiceId: 'receipt-001',
      imageId: 'img-001',
      addAttachment: true,
      qbBillData: {
        vendorRef: 'vendor-123',
        lineItems: [
          {
            amount: 100.0,
            description: 'Test line item',
            accountRef: 'account-456',
          },
        ],
        docNumber: 'RECEIPT-001',
        privateNote: 'Test note',
        dueDate: '2024-02-15',
      },
    };

    it('should successfully add receipt without QuickBooks bill', async () => {
      const mockGetToken = createMockGetToken('test-token');
      const mockResponse = {
        success: true,
        accountId: 'RECEIPT-TEST-001',
      };

      mockApiSuccess(mockResponse);

      const result = await addReceiptToQuickBooks(mockReceiptData, mockGetToken);

      expect(mockGetToken).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/addReceipt'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          }),
          body: JSON.stringify(mockReceiptData),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should successfully add receipt with QuickBooks bill', async () => {
      const mockGetToken = createMockGetToken('test-token');
      const mockResponse = {
        success: true,
        message: 'Bill created successfully',
        data: {
          Bill: {
            Id: '789',
            VendorRef: { value: '123' },
            TotalAmt: 100.0,
            DueDate: '2024-02-15',
            DocNumber: 'RECEIPT-001',
          },
        },
      };

      mockApiSuccess(mockResponse);

      const result = await addReceiptToQuickBooks(mockReceiptData, mockGetToken);

      expect(result).toEqual(mockResponse);
      expect(result.data?.Bill?.Id).toBe('789');
    });

    it('should throw error when API returns failure', async () => {
      const mockGetToken = createMockGetToken('test-token');
      const mockResponse = {
        success: false,
        message: 'Failed to add receipt',
      };

      mockApiSuccess(mockResponse);

      await expect(addReceiptToQuickBooks(mockReceiptData, mockGetToken)).rejects.toThrow(
        'Failed to add receipt'
      );
    });

    it('should handle network errors', async () => {
      const mockGetToken = createMockGetToken('test-token');

      mockApiError(500, 'Internal Server Error');

      await expect(addReceiptToQuickBooks(mockReceiptData, mockGetToken)).rejects.toThrow();
    });

    it('should include all required fields in request', async () => {
      const mockGetToken = createMockGetToken('test-token');
      mockApiSuccess({ success: true, accountId: 'RECEIPT-TEST-001' });

      await addReceiptToQuickBooks(mockReceiptData, mockGetToken);

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody).toMatchObject({
        userId: 'user-123',
        orgId: 'org-456',
        projectId: 'proj-789',
        projectAbbr: 'TEST',
        projectName: 'Test Project',
        invoiceId: 'receipt-001',
        imageId: 'img-001',
        addAttachment: true,
      });
    });

    it('should handle receipt without qbBillData', async () => {
      const mockGetToken = createMockGetToken('test-token');
      const receiptWithoutQB = {
        ...mockReceiptData,
        qbBillData: undefined,
      };

      mockApiSuccess({ success: true, accountId: 'RECEIPT-TEST-001' });

      const result = await addReceiptToQuickBooks(receiptWithoutQB, mockGetToken);

      expect(result.success).toBe(true);
      expect(result.accountId).toBe('RECEIPT-TEST-001');
    });
  });
});
