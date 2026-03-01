/**
 * Tests for QuickBooks API utilities
 */
import {
  addReceiptToQuickBooks,
  AddReceiptRequest,
  doesProjectExistInQuickBooks,
  addProjectToQuickBooks,
  updateProjectInQuickBooks,
} from '@/src/utils/quickbooksAPI';
import { mockApiSuccess, mockApiError, resetApiMocks, createMockGetToken } from '@/__mocks__/apiMocks';

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
      imageId: 'img-001',
      addAttachment: true,
      qbBillData: {
        vendorRef: 'vendor-123',
        lineItems: [
          {
            amount: '100.0',
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
        }),
      );
      expect(result).toEqual(mockResponse);
    });

    it('should successfully add receipt with QuickBooks bill', async () => {
      const mockGetToken = createMockGetToken('test-token');
      const mockResponse = {
        success: true,
        message: 'Bill created successfully',
        data: {
          Purchase: {
            Id: '789',
            PaymentType: 'Check',
            TotalAmt: 100.0,
            TxnDate: '2024-02-15',
            DocNumber: 'RECEIPT-001',
          },
        },
      };

      mockApiSuccess(mockResponse);

      const result = await addReceiptToQuickBooks(mockReceiptData, mockGetToken);

      expect(result).toEqual(mockResponse);
      expect(result.data?.Purchase?.Id).toBe('789');
    });

    it('should throw error when API returns failure', async () => {
      const mockGetToken = createMockGetToken('test-token');
      const mockResponse = {
        success: false,
        message: 'Failed to add receipt',
      };

      mockApiSuccess(mockResponse);

      await expect(addReceiptToQuickBooks(mockReceiptData, mockGetToken)).rejects.toThrow(
        'Failed to add receipt',
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

  describe('doesProjectExistInQuickBooks', () => {
    it('should return true when project exists', async () => {
      const mockGetToken = createMockGetToken('test-token');
      mockApiSuccess({ success: true });

      const result = await doesProjectExistInQuickBooks('org-456', 'proj-789', 'user-123', mockGetToken);

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/qbo/doesProjectExist'),
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('should return false when project does not exist', async () => {
      const mockGetToken = createMockGetToken('test-token');
      mockApiSuccess({ success: false });

      const result = await doesProjectExistInQuickBooks('org-456', 'proj-789', 'user-123', mockGetToken);

      expect(result).toBe(false);
    });

    it('should include orgId, projectId, and userId in query params', async () => {
      const mockGetToken = createMockGetToken('test-token');
      mockApiSuccess({ success: true });

      await doesProjectExistInQuickBooks('org-456', 'proj-789', 'user-123', mockGetToken);

      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
      expect(callUrl).toContain('orgId=org-456');
      expect(callUrl).toContain('projectId=proj-789');
      expect(callUrl).toContain('userId=user-123');
    });

    it('should return false on API error', async () => {
      const mockGetToken = createMockGetToken('test-token');
      mockApiError(500, 'Internal Server Error');

      const result = await doesProjectExistInQuickBooks('org-456', 'proj-789', 'user-123', mockGetToken);

      expect(result).toBe(false);
    });
  });

  describe('addProjectToQuickBooks', () => {
    const mockProject = {
      customerId: 'customer-123',
      projectName: 'Test Project',
      projectId: 'proj-789',
    };

    it('should successfully add a project', async () => {
      const mockGetToken = createMockGetToken('test-token');
      const mockResponse = { success: true, message: 'Project created successfully', newQBId: 'qb-456' };
      mockApiSuccess(mockResponse);

      const result = await addProjectToQuickBooks('org-456', 'user-123', mockProject, mockGetToken);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/qbo/addProject'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockProject),
        }),
      );
    });

    it('should include orgId and userId in query params', async () => {
      const mockGetToken = createMockGetToken('test-token');
      mockApiSuccess({ success: true, newQBId: 'qb-456' });

      await addProjectToQuickBooks('org-456', 'user-123', mockProject, mockGetToken);

      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
      expect(callUrl).toContain('orgId=org-456');
      expect(callUrl).toContain('userId=user-123');
    });

    it('should throw error when API returns failure', async () => {
      const mockGetToken = createMockGetToken('test-token');
      mockApiSuccess({ success: false, message: 'Failed to add project' });

      await expect(addProjectToQuickBooks('org-456', 'user-123', mockProject, mockGetToken)).rejects.toThrow(
        'Failed to add project',
      );
    });

    it('should handle network errors', async () => {
      const mockGetToken = createMockGetToken('test-token');
      mockApiError(500, 'Internal Server Error');

      await expect(
        addProjectToQuickBooks('org-456', 'user-123', mockProject, mockGetToken),
      ).rejects.toThrow();
    });
  });

  describe('updateProjectInQuickBooks', () => {
    const mockProject = {
      customerId: 'customer-456',
      projectName: 'Updated Project',
      projectId: 'proj-789',
    };

    it('should successfully update a project', async () => {
      const mockGetToken = createMockGetToken('test-token');
      const mockResponse = { success: true, message: 'Project updated successfully', qbId: 'qb-456' };
      mockApiSuccess(mockResponse);

      const result = await updateProjectInQuickBooks('org-456', 'user-123', mockProject, mockGetToken);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/qbo/updateProject'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockProject),
        }),
      );
    });

    it('should include orgId and userId in query params', async () => {
      const mockGetToken = createMockGetToken('test-token');
      mockApiSuccess({ success: true, qbId: 'qb-456' });

      await updateProjectInQuickBooks('org-456', 'user-123', mockProject, mockGetToken);

      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
      expect(callUrl).toContain('orgId=org-456');
      expect(callUrl).toContain('userId=user-123');
    });

    it('should throw error when project not found', async () => {
      const mockGetToken = createMockGetToken('test-token');
      mockApiSuccess({
        success: false,
        message: 'Project not found in QuickBooks. Please create the project first.',
      });

      await expect(
        updateProjectInQuickBooks('org-456', 'user-123', mockProject, mockGetToken),
      ).rejects.toThrow('Project not found in QuickBooks. Please create the project first.');
    });

    it('should handle network errors', async () => {
      const mockGetToken = createMockGetToken('test-token');
      mockApiError(500, 'Internal Server Error');

      await expect(
        updateProjectInQuickBooks('org-456', 'user-123', mockProject, mockGetToken),
      ).rejects.toThrow();
    });
  });
});
