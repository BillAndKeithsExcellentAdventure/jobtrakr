/**
 * Tests for CSV utility functions
 */
import { vendorsToCsv, suppliersToCsv } from '@/src/utils/csvUtils';
import { VendorData, SupplierData } from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';

describe('csvUtils', () => {
  describe('vendorsToCsv', () => {
    it('should convert vendors array to CSV format', () => {
      const vendors: VendorData[] = [
        {
          id: '1',
          name: 'Vendor One',
          address: '123 Main St',
          city: 'Springfield',
          state: 'IL',
          zip: '62701',
          mobilePhone: '555-0101',
          businessPhone: '555-0102',
          notes: 'Test vendor',
        },
        {
          id: '2',
          name: 'Vendor Two',
          address: '456 Oak Ave',
          city: 'Chicago',
          state: 'IL',
          zip: '60601',
          mobilePhone: '555-0201',
          businessPhone: '555-0202',
          notes: 'Another vendor',
        },
      ];

      const csv = vendorsToCsv(vendors);
      const lines = csv.split('\n');
      
      expect(lines).toHaveLength(3); // header + 2 data rows
      expect(lines[0]).toBe('name,address,city,state,zip,mobilePhone,businessPhone,notes');
      expect(lines[1]).toContain('Vendor One');
      expect(lines[2]).toContain('Vendor Two');
    });

    it('should escape values with commas', () => {
      const vendors: VendorData[] = [
        {
          id: '1',
          name: 'Vendor, Inc',
          address: '123 Main St',
          city: 'Springfield',
          state: 'IL',
          zip: '62701',
          mobilePhone: '555-0101',
          businessPhone: '555-0102',
          notes: 'Test vendor',
        },
      ];

      const csv = vendorsToCsv(vendors);
      expect(csv).toContain('"Vendor, Inc"');
    });

    it('should escape values with quotes', () => {
      const vendors: VendorData[] = [
        {
          id: '1',
          name: 'Vendor "Best" Inc',
          address: '123 Main St',
          city: 'Springfield',
          state: 'IL',
          zip: '62701',
          mobilePhone: '555-0101',
          businessPhone: '555-0102',
          notes: 'Test vendor',
        },
      ];

      const csv = vendorsToCsv(vendors);
      expect(csv).toContain('"Vendor ""Best"" Inc"');
    });

    it('should escape values with newlines', () => {
      const vendors: VendorData[] = [
        {
          id: '1',
          name: 'Vendor One',
          address: '123 Main St',
          city: 'Springfield',
          state: 'IL',
          zip: '62701',
          mobilePhone: '555-0101',
          businessPhone: '555-0102',
          notes: 'Test\nvendor',
        },
      ];

      const csv = vendorsToCsv(vendors);
      expect(csv).toContain('"Test\nvendor"');
    });

    it('should handle empty vendors array', () => {
      const vendors: VendorData[] = [];
      const csv = vendorsToCsv(vendors);
      expect(csv).toBe('');
    });

    it('should handle vendors with missing fields', () => {
      const vendors: VendorData[] = [
        {
          id: '1',
          name: 'Vendor One',
          address: '',
          city: '',
          state: '',
          zip: '',
          mobilePhone: '',
          businessPhone: '',
          notes: '',
        },
      ];

      const csv = vendorsToCsv(vendors);
      const lines = csv.split('\n');
      
      expect(lines).toHaveLength(2); // header + 1 data row
      expect(lines[1]).toContain('Vendor One');
    });

    it('should not include id field in CSV', () => {
      const vendors: VendorData[] = [
        {
          id: 'should-not-appear',
          name: 'Vendor One',
          address: '123 Main St',
          city: 'Springfield',
          state: 'IL',
          zip: '62701',
          mobilePhone: '555-0101',
          businessPhone: '555-0102',
          notes: 'Test vendor',
        },
      ];

      const csv = vendorsToCsv(vendors);
      expect(csv).not.toContain('should-not-appear');
      expect(csv).not.toContain('id');
    });
  });

  describe('suppliersToCsv', () => {
    it('should convert suppliers array to CSV format', () => {
      const suppliers: SupplierData[] = [
        {
          id: '1',
          name: 'Supplier One',
          address: '789 Elm St',
          city: 'Portland',
          state: 'OR',
          zip: '97201',
          mobilePhone: '555-0301',
          businessPhone: '555-0302',
          notes: 'Test supplier',
        },
      ];

      const csv = suppliersToCsv(suppliers);
      const lines = csv.split('\n');
      
      expect(lines).toHaveLength(2); // header + 1 data row
      expect(lines[0]).toBe('name,address,city,state,zip,mobilePhone,businessPhone,notes');
      expect(lines[1]).toContain('Supplier One');
    });

    it('should handle empty suppliers array', () => {
      const suppliers: SupplierData[] = [];
      const csv = suppliersToCsv(suppliers);
      expect(csv).toBe('');
    });

    it('should escape special characters in supplier data', () => {
      const suppliers: SupplierData[] = [
        {
          id: '1',
          name: 'Supplier, "Best"',
          address: '789 Elm St',
          city: 'Portland',
          state: 'OR',
          zip: '97201',
          mobilePhone: '555-0301',
          businessPhone: '555-0302',
          notes: 'Top\nsupplier',
        },
      ];

      const csv = suppliersToCsv(suppliers);
      expect(csv).toContain('"Supplier, ""Best"""');
      expect(csv).toContain('"Top\nsupplier"');
    });

    it('should not include id field in CSV', () => {
      const suppliers: SupplierData[] = [
        {
          id: 'should-not-appear',
          name: 'Supplier One',
          address: '789 Elm St',
          city: 'Portland',
          state: 'OR',
          zip: '97201',
          mobilePhone: '555-0301',
          businessPhone: '555-0302',
          notes: 'Test supplier',
        },
      ];

      const csv = suppliersToCsv(suppliers);
      expect(csv).not.toContain('should-not-appear');
      expect(csv).not.toContain('id');
    });
  });
});
