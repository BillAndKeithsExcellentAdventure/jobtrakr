import {
  CustomerData,
  VendorData,
} from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { WorkCategoryDefinition } from '../models/types';

// Shared headers for vendor CSV format (excluding id and accountingId)
const ENTITY_CSV_HEADERS = [
  'name',
  'address',
  'city',
  'state',
  'zip',
  'mobilePhone',
  'businessPhone',
  'notes',
];

/**
 * Converts an array of vendors to CSV format (excluding id and accountingId fields)
 */
export function vendorsToCsv(vendors: VendorData[]): string {
  if (!vendors || vendors.length === 0) {
    return '';
  }

  // Create CSV header row
  const headerRow = ENTITY_CSV_HEADERS.join(',');

  // Create CSV data rows
  const dataRows = vendors.map((vendor) => {
    return ENTITY_CSV_HEADERS.map((header) => {
      const value = vendor[header as keyof VendorData] || '';
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',');
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
    const vendor: Record<string, string> = {};

    for (let j = 0; j < headers.length; j++) {
      const header = headers[j].trim();
      // Handle missing columns gracefully
      const value = j < values.length ? values[j].trim() : '';
      vendor[header] = value;
    }

    vendors.push(vendor as Omit<VendorData, 'id'>);
  }

  return vendors;
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

function parseWorkItemCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++; // skip next char
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result.map((s) => s.trim());
}

export function parseWorkItemsCsvText(csvText: string): WorkCategoryDefinition[] {
  // Split into lines and remove empty lines
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim() !== '');

  // Skip header
  const dataLines = lines.slice(1);

  const categories: WorkCategoryDefinition[] = [];
  let currentCategory: WorkCategoryDefinition | null = null;

  // Parse each line
  for (const line of dataLines) {
    const [categoryName, categoryCode, workItemName, workItemCode] = parseWorkItemCsvLine(line);

    // New category row
    if (categoryName && categoryCode) {
      currentCategory = {
        name: categoryName,
        code: Number(categoryCode),
        workItems: [],
      };
      categories.push(currentCategory);
    } else if (currentCategory && workItemName && workItemCode) {
      // Work item row
      currentCategory.workItems.push({
        name: workItemName,
        code: Number(workItemCode),
      });
    }
  }
  return categories;
}

// Shared headers for customer CSV format (excluding id and accountingId)
const CUSTOMER_CSV_HEADERS = ['name', 'contactName', 'email', 'phone', 'active'];

/**
 * Converts an array of customers to CSV format (excluding id and accountingId fields)
 */
export function customersToCsv(customers: CustomerData[]): string {
  if (!customers || customers.length === 0) {
    return '';
  }

  const headerRow = CUSTOMER_CSV_HEADERS.join(',');

  const dataRows = customers.map((customer) => {
    return CUSTOMER_CSV_HEADERS.map((header) => {
      const value = customer[header as keyof CustomerData];
      const stringValue = String(value ?? '');
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',');
  });

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Parse CSV text and return array of customer data objects (without id/accountingId)
 */
export function csvToCustomers(csvText: string): Omit<CustomerData, 'id' | 'accountingId'>[] {
  if (!csvText || csvText.trim() === '') {
    return [];
  }

  const lines = csvText.split('\n').filter((line) => line.trim() !== '');
  if (lines.length < 2) {
    return [];
  }

  const headers = parseCsvLine(lines[0]);
  const customers: Omit<CustomerData, 'id' | 'accountingId'>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const customer: Record<string, any> = {};

    for (let j = 0; j < headers.length; j++) {
      const header = headers[j].trim();
      const value = j < values.length ? values[j].trim() : '';
      if (header === 'active') {
        customer[header] = value.toLowerCase() !== 'false';
      } else {
        customer[header] = value;
      }
    }

    customers.push(customer as Omit<CustomerData, 'id' | 'accountingId'>);
  }

  return customers;
}
