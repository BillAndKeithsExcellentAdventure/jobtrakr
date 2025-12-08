# Work Item CSV Import

## Overview

ProjectHound supports importing work categories and work items from CSV files. This feature allows you to quickly set up your cost tracking structure by importing predefined categories and line items from a properly formatted CSV file.

## CSV File Format

### Structure

The CSV file uses a hierarchical structure where:

- **Category rows** contain both a category name and category code
- **Work item rows** contain only a work item name and work item code (category fields are empty)

### Column Headers

The CSV file must include the following header row:

```csv
Category Name,Category Code,Work Item Name,Work Item Code
```

### Column Descriptions

| Column         | Required           | Type   | Description                                                              |
| -------------- | ------------------ | ------ | ------------------------------------------------------------------------ |
| Category Name  | For category rows  | Text   | The name of the work category (e.g., "Sitework", "Foundation")           |
| Category Code  | For category rows  | Number | Numeric code for the category (e.g., 100, 200)                           |
| Work Item Name | For work item rows | Text   | The name of the specific work item (e.g., "Excavation", "Concrete Pour") |
| Work Item Code | For work item rows | Number | Numeric code for the work item (e.g., 101, 102)                          |

### Format Rules

1. **Category Rows**: Must have values in both "Category Name" and "Category Code" columns. Work item columns should be empty.
2. **Work Item Rows**: Must have values in both "Work Item Name" and "Work Item Code" columns. Category columns should be empty.
3. **Grouping**: Work items are automatically associated with the most recent category row above them.
4. **CSV Escaping**:
   - Fields containing commas, quotes, or newlines must be wrapped in double quotes
   - Double quotes within fields must be escaped by doubling them (`""`)
5. **Line Breaks**: Both `\n` and `\r\n` line endings are supported

## Example CSV File

```csv
Category Name,Category Code,Work Item Name,Work Item Code
"Sitework",10,,
,,"Site Preparation",10
,,"Excavation",15
,,"Grading",20
"Foundation",20,,
,,"Footings",10
,,"Foundation Walls",20
,,"Waterproofing",30
"Framing",30,,
,,"Floor Framing",10
,,"Wall Framing",20
,,"Roof Framing",30
```

## Data Processing

The import process:

1. Reads the CSV file using `parseWorkItemsCsvText()` from `src/utils/csvUtils.ts`
2. Parses each line, handling quoted fields and escaped characters
3. Creates category objects when both category name and code are present
4. Associates work items with the current category
5. Returns an array of `WorkCategoryDefinition` objects with nested work items

### Parsed Data Structure

```typescript
interface WorkCategoryDefinition {
  name: string;
  code: number;
  workItems: Array<{
    name: string;
    code: number;
  }>;
}
```

## Import Process

### Using the UI

1. Navigate to Configuration → Work Categories
2. Tap "Import from CSV"
3. Select your CSV file using the file picker
4. Preview the parsed categories and work items
5. Expand/collapse categories to review their work items
6. Tap "Save" to import all categories and work items

### What Happens During Import

For each category in the CSV:

1. A new work category is created in the configuration store
2. The category receives a unique ID
3. All associated work items are created
4. Each work item is linked to its parent category via `categoryId`
5. All items are set to `status: 'active'` by default

## Sample Data

A complete example CSV file is available at:

```
sample-data/residential-construction-cost-items.csv
```

This file contains a comprehensive list of residential construction categories and work items that can be used as a template or imported directly.

## Error Handling

### Common Issues

| Issue              | Cause                                       | Solution                                                |
| ------------------ | ------------------------------------------- | ------------------------------------------------------- |
| Empty import       | CSV has no data rows after header           | Ensure CSV contains at least one category and work item |
| Missing work items | Category row not followed by work item rows | Add work item rows after each category row              |
| Parse errors       | Improperly quoted fields                    | Ensure commas and quotes are properly escaped           |
| Import failure     | Database constraint violation               | Check for duplicate category/item codes                 |

### Validation

Before saving, the import preview shows:

- Total number of categories
- Number of work items per category
- Expand/collapse functionality to review all items

## Best Practices

1. **Consistent Numbering**: Use a logical numbering scheme (e.g., 10s for Sitework, 20s for Foundation)
2. **Descriptive Names**: Use clear, unambiguous names for categories and work items
3. **Hierarchical Codes**: Consider using hierarchical codes (e.g., 10, 30, 30 for parent and children - these codes are often display as costCategory.costItem ie. '10.15' for Sitework-Excavation )
4. **Preview Before Saving**: Always review the parsed data before committing the import
5. **Backup**: Export existing work items before importing new ones if you want to preserve current data

## Technical Details

### Parser Implementation

The `parseWorkItemsCsvText()` function:

- Splits the input text by line breaks (`\r?\n`)
- Skips the header row
- Uses `parseWorkItemCsvLine()` to handle quoted fields
- Maintains state to track the current category
- Returns a structured array of category definitions

### File Picker

Uses `expo-document-picker` with:

- Type filter: `text/csv`
- `copyToCacheDirectory: true` for secure file access
- Reads file content via fetch API

## Related Documentation

- [Configuration Store](./CONFIGURATION_STORE.md)
- [Work Items Overview](./WORK_ITEMS.md)
- [CSV Export](./CSV_EXPORT.md)
