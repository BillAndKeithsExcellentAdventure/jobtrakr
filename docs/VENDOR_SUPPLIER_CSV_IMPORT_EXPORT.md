# Vendor and Supplier CSV Import/Export

## Overview

The vendor and supplier CSV import/export feature allows users to export their vendor and supplier data to CSV files for backup or sharing, and import CSV files to add or update vendor and supplier records in bulk.

## How It Works

### Accessing the Feature

The import/export functionality is available from the Configuration home screen:

1. Navigate to **Configuration** from the main menu
2. Tap the **menu icon** (three dots) in the top-right corner
3. Select one of the following options:
   - **Import Vendors** - Always available
   - **Export Vendors** - Only appears when vendor data exists
   - **Import Suppliers** - Always available
   - **Export Suppliers** - Only appears when supplier data exists

### Exporting Data

**To export vendors or suppliers:**

1. From the Configuration screen, tap the menu icon
2. Select **"Export Vendors"** or **"Export Suppliers"**
3. Confirm the export in the dialog that appears
4. The system creates a CSV file and opens the share dialog
5. Choose where to save or share the file (email, cloud storage, etc.)

**What gets exported:**
- All vendor or supplier records in the database
- All fields except the internal `id` field
- Fields included: `name`, `address`, `city`, `state`, `zip`, `mobilePhone`, `businessPhone`, `notes`

**File naming:**
- Vendors are exported to: `vendors.csv`
- Suppliers are exported to: `suppliers.csv`

### Importing Data

**To import vendors or suppliers:**

1. From the Configuration screen, tap the menu icon
2. Select **"Import Vendors"** or **"Import Suppliers"**
3. Confirm the import in the dialog that appears
4. The document picker opens - select your CSV file
5. The system processes the file and shows a summary:
   - Number of records added (new entries)
   - Number of records updated (existing entries)

**Import behavior:**
- **Matching logic**: Records are matched by comparing both `name` AND `address` fields
- **Update existing**: If a match is found, the existing record is updated with the new data
- **Add new**: If no match is found, a new record is created
- **Empty fields**: Both name and address must have values for matching to occur

## CSV Format

### Structure

The CSV file uses a standard comma-separated format with the following columns:

```csv
name,address,city,state,zip,mobilePhone,businessPhone,notes
```

### Example

```csv
name,address,city,state,zip,mobilePhone,businessPhone,notes
"Acme Hardware","123 Main St","Seattle","WA","98101","555-1234","555-5678","Preferred supplier for hardware"
"Bob's Lumber","456 Oak Ave","Portland","OR","97201","555-8765","555-4321","Good prices on lumber"
"City Electric","789 Pine Rd","Tacoma","WA","98402","555-2468","","Fast delivery"
```

### Field Descriptions

| Field | Description | Required | Notes |
|-------|-------------|----------|-------|
| `name` | Vendor/Supplier name | Yes* | Used for matching during import |
| `address` | Street address | Yes* | Used for matching during import |
| `city` | City name | No | Optional field |
| `state` | State abbreviation | No | Optional field (e.g., WA, CA, OR) |
| `zip` | ZIP/Postal code | No | Optional field |
| `mobilePhone` | Mobile phone number | No | Optional field |
| `businessPhone` | Business phone number | No | Optional field |
| `notes` | Additional notes | No | Optional field |

*Both `name` and `address` are required for matching during import. Records without these values will be added as new entries.

### Special Characters

The CSV format properly handles special characters:

- **Commas**: Fields containing commas are automatically wrapped in double quotes
- **Quotes**: Double quotes within fields are escaped as two double quotes (`""`)
- **Newlines**: Fields containing line breaks are wrapped in quotes

**Example with special characters:**
```csv
name,address,city,state,zip,mobilePhone,businessPhone,notes
"Johnson's ""Quality"" Supplies","123 Main St, Suite 200","Seattle","WA","98101","555-1234","555-5678","Note: 
Special pricing available"
```

## Import Matching Logic

When importing data, the system uses the following logic to determine whether to update an existing record or create a new one:

```
For each record in the CSV:
  1. Check if a vendor/supplier exists with:
     - Matching name (non-empty)
     - AND matching address (non-empty)
  
  2. If match found:
     - Update the existing record with all fields from CSV
  
  3. If no match found:
     - Create a new record with data from CSV
```

**Important notes:**
- Both name and address must be present and match exactly for an update to occur
- Matching is case-sensitive
- If either name or address is empty/missing, the record will always be added as new
- The internal database ID is never modified or included in exports

## Best Practices

### Creating CSV Files

1. **Use a spreadsheet program**: Excel, Google Sheets, or Numbers work well
2. **Include headers**: The first row should contain the column names
3. **Use quotes for complex data**: Wrap fields in quotes if they contain commas or special characters
4. **Save as CSV**: Export from your spreadsheet program as CSV format
5. **UTF-8 encoding**: Ensure the file is saved with UTF-8 encoding for special characters

### Data Integrity

1. **Backup before import**: Always export your current data before importing to have a backup
2. **Test with small batches**: Test your CSV file with a few records first
3. **Verify matching**: Ensure name and address are accurate for records you want to update
4. **Clean data**: Remove duplicate entries and validate phone numbers/addresses before import

### Common Use Cases

**Initial setup:**
- Create a spreadsheet with all your vendors/suppliers
- Export to CSV
- Import into the app

**Bulk updates:**
- Export current data
- Open in spreadsheet program
- Make changes (update addresses, phone numbers, etc.)
- Save and re-import

**Data migration:**
- Export from another system as CSV
- Ensure column headers match the expected format
- Import into the app

**Sharing across devices:**
- Export from one device
- Share the CSV file (email, cloud storage)
- Import on another device

## Troubleshooting

### Import Issues

**"Failed to import vendors/suppliers"**
- Ensure the CSV file has the correct headers
- Check that the file is not corrupted
- Verify the file is in CSV format (not Excel .xlsx)

**Records not matching as expected**
- Verify that name and address match exactly (case-sensitive)
- Check for extra spaces or special characters
- Ensure both fields have values

**Some fields not importing**
- Verify column headers match exactly: `name`, `address`, `city`, `state`, `zip`, `mobilePhone`, `businessPhone`, `notes`
- Check for typos in header names

### Export Issues

**"No export option available"**
- The export option only appears when you have data to export
- Add at least one vendor or supplier first

**File not appearing in share dialog**
- Ensure you have granted storage permissions to the app
- Try restarting the app and exporting again

## Technical Details

### File Location
- Temporary CSV files are created in the app's document directory
- Files are named: `vendors.csv` or `suppliers.csv`

### CSV Parser
- Custom CSV parser handles quoted fields and escaped characters
- Supports standard RFC 4180 CSV format
- Gracefully handles malformed files with error reporting

### Data Validation
- Basic validation ensures required fields are present
- Type checking ensures data integrity
- Invalid rows are skipped with error logging

### Security
- No sensitive data is logged
- Files are stored in app-sandboxed storage
- Standard platform sharing mechanisms are used
