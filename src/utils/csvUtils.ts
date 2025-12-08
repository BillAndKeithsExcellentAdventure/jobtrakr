import { VendorData, SupplierData } from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';

/**
 * Converts an array of vendors to CSV format (excluding id field)
 */
export function vendorsToCsv(vendors: VendorData[]): string {
  if (!vendors || vendors.length === 0) {
    return '';
  }

  // Define headers (excluding id)
  const headers = ['name', 'address', 'city', 'state', 'zip', 'mobilePhone', 'businessPhone', 'notes'];
  
  // Create CSV header row
  const headerRow = headers.join(',');
  
  // Create CSV data rows
  const dataRows = vendors.map((vendor) => {
    return headers
      .map((header) => {
        const value = vendor[header as keyof VendorData] || '';
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      })
      .join(',');
  });
  
  return [headerRow, ...dataRows].join('\n');
}

/**
 * Converts an array of suppliers to CSV format (excluding id field)
 */
export function suppliersToCsv(suppliers: SupplierData[]): string {
  if (!suppliers || suppliers.length === 0) {
    return '';
  }

  // Define headers (excluding id)
  const headers = ['name', 'address', 'city', 'state', 'zip', 'mobilePhone', 'businessPhone', 'notes'];
  
  // Create CSV header row
  const headerRow = headers.join(',');
  
  // Create CSV data rows
  const dataRows = suppliers.map((supplier) => {
    return headers
      .map((header) => {
        const value = supplier[header as keyof SupplierData] || '';
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      })
      .join(',');
  });
  
  return [headerRow, ...dataRows].join('\n');
}

/**
 * Parse CSV text and return array of vendor data objects
 */
export function csvToVendors(csvText: string): Omit<VendorData, 'id'>[] {
  if (!csvText || csvText.trim() === '') {
    return [];
  }

  const lines = csvText.split('\n').filter((line) => line.trim() !== '');
  if (lines.length < 2) {
    // Need at least header and one data row
    return [];
  }

  const headers = parseCsvLine(lines[0]);
  const vendors: Omit<VendorData, 'id'>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const vendor: any = {};

    for (let j = 0; j < headers.length; j++) {
      const header = headers[j].trim();
      const value = values[j] ? values[j].trim() : '';
      vendor[header] = value;
    }

    vendors.push(vendor as Omit<VendorData, 'id'>);
  }

  return vendors;
}

/**
 * Parse CSV text and return array of supplier data objects
 */
export function csvToSuppliers(csvText: string): Omit<SupplierData, 'id'>[] {
  if (!csvText || csvText.trim() === '') {
    return [];
  }

  const lines = csvText.split('\n').filter((line) => line.trim() !== '');
  if (lines.length < 2) {
    // Need at least header and one data row
    return [];
  }

  const headers = parseCsvLine(lines[0]);
  const suppliers: Omit<SupplierData, 'id'>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const supplier: any = {};

    for (let j = 0; j < headers.length; j++) {
      const header = headers[j].trim();
      const value = values[j] ? values[j].trim() : '';
      supplier[header] = value;
    }

    suppliers.push(supplier as Omit<SupplierData, 'id'>);
  }

  return suppliers;
}

/**
 * Parse a single CSV line, handling quoted fields
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  result.push(current);

  return result;
}
