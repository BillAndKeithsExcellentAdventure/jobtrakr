/**
 * Tests for CSV utility functions
 */
import { vendorsToCsv, csvToVendors } from '@/src/utils/csvUtils';
import { VendorData } from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';

describe('csvUtils', () => {
  describe('vendorsToCsv', () => {
    it('should convert vendors array to CSV format', () => {
      const vendors: VendorData[] = [
        {
          id: '1',
          accountingId: '',
          name: 'Vendor One',
          address: '123 Main St',
          city: 'Springfield',
          state: 'IL',
          zip: '62701',
          mobilePhone: '555-0101',
          businessPhone: '555-0102',
          notes: 'Test vendor',
          matchCompareString: '',
        },
        {
          id: '2',
          accountingId: '',
          name: 'Vendor Two',
          address: '456 Oak Ave',
          city: 'Chicago',
          state: 'IL',
          zip: '60601',
          mobilePhone: '555-0201',
          businessPhone: '555-0202',
          notes: 'Another vendor',
          matchCompareString: '',
        },
      ];

      const csv = vendorsToCsv(vendors);
      const lines = csv.split('\n');

      expect(lines).toHaveLength(3); // header + 2 data rows
      expect(lines[0]).toBe('name,address,city,state,zip,mobilePhone,businessPhone,email,notes');
      expect(lines[1]).toContain('Vendor One');
      expect(lines[2]).toContain('Vendor Two');
    });

    it('should escape values with commas', () => {
      const vendors: VendorData[] = [
        {
          id: '1',
          accountingId: '',
          name: 'Vendor, Inc',
          address: '123 Main St',
          city: 'Springfield',
          state: 'IL',
          zip: '62701',
          mobilePhone: '555-0101',
          businessPhone: '555-0102',
          notes: 'Test vendor',
          matchCompareString: '',
        },
      ];

      const csv = vendorsToCsv(vendors);
      expect(csv).toContain('"Vendor, Inc"');
    });

    it('should escape values with quotes', () => {
      const vendors: VendorData[] = [
        {
          id: '1',
          accountingId: '',
          name: 'Vendor "Best" Inc',
          address: '123 Main St',
          city: 'Springfield',
          state: 'IL',
          zip: '62701',
          mobilePhone: '555-0101',
          businessPhone: '555-0102',
          notes: 'Test vendor',
          matchCompareString: '',
        },
      ];

      const csv = vendorsToCsv(vendors);
      expect(csv).toContain('"Vendor ""Best"" Inc"');
    });

    it('should escape values with newlines', () => {
      const vendors: VendorData[] = [
        {
          id: '1',
          accountingId: '',
          name: 'Vendor One',
          address: '123 Main St',
          city: 'Springfield',
          state: 'IL',
          zip: '62701',
          mobilePhone: '555-0101',
          businessPhone: '555-0102',
          notes: 'Test\nvendor',
          matchCompareString: '',
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
          accountingId: '',
          name: 'Vendor One',
          address: '',
          city: '',
          state: '',
          zip: '',
          mobilePhone: '',
          businessPhone: '',
          notes: '',
          matchCompareString: '',
        },
      ];

      const csv = vendorsToCsv(vendors);
      const lines = csv.split('\n');

      expect(lines).toHaveLength(2); // header + 1 data row
      expect(lines[1]).toContain('Vendor One');
    });

    it('should not include id or accountingId fields in CSV', () => {
      const vendors: VendorData[] = [
        {
          id: 'should-not-appear',
          accountingId: 'also-should-not-appear',
          name: 'Vendor One',
          address: '123 Main St',
          city: 'Springfield',
          state: 'IL',
          zip: '62701',
          mobilePhone: '555-0101',
          businessPhone: '555-0102',
          notes: 'Test vendor',
          matchCompareString: '',
        },
      ];

      const csv = vendorsToCsv(vendors);
      expect(csv).not.toContain('should-not-appear');
      expect(csv).not.toContain('also-should-not-appear');
      expect(csv).not.toContain('id');
      expect(csv).not.toContain('accountingId');
    });
  });

  describe('csvToVendors', () => {
    it('should parse vendor email from CSV', () => {
      const csvText =
        'name,address,city,state,zip,mobilePhone,businessPhone,email,notes\n' +
        'Acme,123 Main,Seattle,WA,98101,555-1111,555-2222,orders@acme.com,Preferred';

      const result = csvToVendors(csvText);

      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('orders@acme.com');
      expect(result[0].name).toBe('Acme');
      expect(result[0].address).toBe('123 Main');
    });
  });
});
