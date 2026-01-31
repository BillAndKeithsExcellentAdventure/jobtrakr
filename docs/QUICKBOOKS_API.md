# ProjectHound Backend

A Cloudflare Workers-based backend API for managing construction project media, receipts, invoices, and change orders.

## Table of Contents

- [Overview](#overview)
  - [QuickBooks Online Integration](#quickbooks-online-integration)
- [Error Responses](#error-responses)
- [Development](#development)

## Overview

Project Hound Backend is a serverless API built on Cloudflare Workers that provides media management, document intelligence, and change order processing capabilities for construction projects.

### Key Features

- Media upload and retrieval (photos, receipts, invoices, videos)
- Multi-device image optimization (phone, tablet, desktop)
- AI-powered document intelligence for receipts and invoices
- Change order generation and approval workflow
- PDF generation and email distribution
- JWT-based authentication

### QuickBooks Online Integration

The API provides comprehensive integration with QuickBooks Online (QBO) for accounting operations including:

- **Authentication & Connection Management**: OAuth2-based connection flow with automatic token refresh
- **Data Retrieval**: Fetch vendors, chart of accounts, and company information
- **Vendor Management**: Create and manage vendor records
- **Bill Processing**: Create bills with optional image attachments and track payment status
- **Payment Processing**: Process bill payments and track payment records

**Key Features:**

- Automatic token refresh for expired access tokens
- Attachment support for bills (automatically uploads invoice/receipt images)
- Payment tracking integration with local database
- Normalized response formats for easier consumption

#### GET /auth/qbo/connect

Initiate QuickBooks OAuth2 connection flow.

**Authentication:** Required

**Query Parameters:**

- `orgId` (string): Organization identifier
- `userId` (string): User identifier

**Response:**

```json
{
  "success": true,
  "authUrl": "https://appcenter.intuit.com/connect/oauth2?client_id=..."
}
```

**Notes:**

- Returns the QuickBooks OAuth2 authorization URL
- User's browser should be redirected to this URL to authorize the connection
- After authorization, QuickBooks redirects to the callback endpoint

#### GET /auth/qbo/callback

Handle OAuth2 callback from QuickBooks after user authorization.

**Authentication:** Not required (OAuth2 callback)

**Query Parameters:**

- `code` (string): Authorization code from QuickBooks
- `realmId` (string): QuickBooks company ID
- `state` (string): Base64-encoded JSON containing orgId and userId

**Response:**

```json
{
  "success": true,
  "message": "QuickBooks connected successfully"
}
```

**Notes:**

- This endpoint is called by QuickBooks after user authorization
- Exchanges authorization code for access and refresh tokens
- Stores tokens in KV storage for future API calls

#### GET /auth/qbo/disconnect

Disconnect QuickBooks integration by removing stored tokens.

**Authentication:** Required

**Query Parameters:**

- `orgId` (string): Organization identifier
- `userId` (string): User identifier

**Response:**

```json
{
  "success": true
}
```

**Notes:**

- Removes QuickBooks tokens from storage
- User will need to reconnect to use QuickBooks features again

#### GET /qbo/isConnected

Check if QuickBooks is currently connected for an organization and user.

**Authentication:** Required

**Query Parameters:**

- `orgId` (string): Organization identifier
- `userId` (string): User identifier

**Response:**

```json
{
  "success": true,
  "isConnected": true
}
```

**Notes:**

- Returns boolean indicating connection status
- Validates stored tokens have required fields
- Uses eventual consistency check for KV storage

#### GET /qbo/fetchVendors

Retrieve all vendors from QuickBooks.

**Authentication:** Required

**Query Parameters:**

- `orgId` (string): Organization identifier
- `userId` (string): User identifier

**Response:**

```json
{
  "success": true,
  "data": {
    "QueryResponse": {
      "Vendor": [
        {
          "Id": "123",
          "DisplayName": "Vendor Name",
          "GivenName": "First",
          "FamilyName": "Last",
          "PrimaryPhone": {
            "FreeFormNumber": "555-1234"
          },
          "BillAddr": {
            "Line1": "123 Main St",
            "City": "Springfield",
            "CountrySubDivisionCode": "IL",
            "PostalCode": "62701"
          }
        }
      ]
    }
  }
}
```

**Error Response (401):**

```json
{
  "success": false,
  "message": "Token expired and refresh failed. Please reconnect QuickBooks."
}
```

**Notes:**

- Automatically refreshes expired tokens
- Returns 401 if token refresh fails (requires reconnection)

#### GET /qbo/fetchAccounts

Retrieve chart of accounts from QuickBooks.

**Authentication:** Required

**Query Parameters:**

- `orgId` (string): Organization identifier
- `userId` (string): User identifier

**Response:**

```json
{
  "success": true,
  "data": {
    "QueryResponse": {
      "Account": [
        {
          "Id": "35",
          "Name": "Advertising",
          "FullyQualifiedName": "Advertising",
          "Classification": "Expense",
          "AccountType": "Expense",
          "AccountSubType": "AdvertisingPromotional",
          "Active": true
        }
      ]
    }
  }
}
```

**Error Response (401):**

```json
{
  "success": false,
  "message": "Token expired and refresh failed. Please reconnect QuickBooks."
}
```

**Notes:**

- Automatically refreshes expired tokens
- Returns 401 if token refresh fails (requires reconnection)
- Returns all accounts including assets, liabilities, equity, income, and expense accounts

#### GET /qbo/fetchCompanyInfo

Retrieve company information from QuickBooks.

**Authentication:** Required

**Query Parameters:**

- `orgId` (string): Organization identifier
- `userId` (string): User identifier

**Response:**

```json
{
  "success": true,
  "data": {
    "companyName": "Acme Corporation",
    "ownerName": "Acme Corporation LLC",
    "address": "123 Business St",
    "address2": "Suite 100",
    "city": "San Francisco",
    "state": "CA",
    "zip": "94102",
    "email": "info@acmecorp.com",
    "phone": "415-555-1234"
  }
}
```

**Error Response (401):**

```json
{
  "success": false,
  "message": "Token expired and refresh failed. Please reconnect QuickBooks."
}
```

**Notes:**

- Automatically refreshes expired tokens
- Returns 401 if token refresh fails (requires reconnection)
- Response is normalized from QuickBooks CompanyInfo structure for easier consumption

#### POST /qbo/addVendor

Create a new vendor in QuickBooks.

**Authentication:** Required

**Query Parameters:**

- `orgId` (string): Organization identifier
- `userId` (string): User identifier

**Request Body:**

```json
{
  "name": "Acme Supplies Inc.",
  "mobilePhone": "555-1234",
  "address": "123 Main St",
  "city": "Springfield",
  "state": "IL",
  "zip": "62701",
  "notes": "Primary vendor for materials"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Vendor added successfully",
  "newQBId": "456"
}
```

**Notes:**

- Required fields: `name`
- Optional fields: `mobilePhone`, `address`, `city`, `state`, `zip`, `notes`
- Returns the QuickBooks-assigned vendor ID in `newQBId` field

#### POST /qbo/addBill

Create a new bill in QuickBooks with optional attachment support.

**Authentication:** Required

**Query Parameters:**

- `orgId` (string): Organization identifier
- `userId` (string): User identifier

**Request Body:**

```json
{
  "vendorRef": "123",
  "billType": "invoice",
  "lineItems": [
    {
      "amount": 100.0,
      "description": "Construction materials",
      "accountRef": "456"
    }
  ],
  "dueDate": "2024-02-15",
  "docNumber": "INV-2024-001",
  "privateNote": "Payment due net 30",
  "addAttachment": true,
  "projectId": "project123",
  "invoiceId": "inv789",
  "imageId": "img456",
  "attachmentFileName": "invoice-img456.jpg"
}
```

**Note:** `vendorRef` must be a valid QuickBooks vendor ID, and `accountRef` values must be valid QuickBooks account IDs from your chart of accounts.

**Response:**

```json
{
  "success": true,
  "message": "Bill created successfully",
  "data": {
    "Bill": {
      "Id": "789",
      "VendorRef": {
        "value": "123"
      },
      "TotalAmt": 100.0,
      "DueDate": "2024-02-15",
      "DocNumber": "INV-2024-001"
    }
  }
}
```

**Notes:**

- Required fields: `vendorRef`, `billType`, `lineItems`, `dueDate`, `docNumber`
- `billType` must be either `"invoice"` or `"receipt"`
- `vendorRef` must be a valid QuickBooks vendor ID (from `/qbo/fetchVendors` or `/qbo/addVendor`)
- Each line item must include:
  - `amount`: Line item amount
  - `description`: Line item description
  - `accountRef`: Valid QuickBooks account ID (from `/qbo/fetchAccounts`)
- Optional fields: `privateNote`
- Attachment support: Set `addAttachment: true` to attach the source image to the bill
  - When `addAttachment` is `true`, also required: `projectId`, `imageId`
  - Required when `billType` is `"invoice"`: `invoiceId`
  - Required when `billType` is `"receipt"`: `receiptId` (use the same field name as `invoiceId` in the implementation)
  - Optional: `attachmentFileName` (defaults to `{billType}-{imageId}.jpg`)
  - The system automatically fetches the original image from storage and uploads it to QuickBooks
  - Attachment upload failures are logged but don't fail the bill creation
- The bill creation automatically creates a payment tracking record in the local database

#### POST /qbo/payBill

Create a bill payment in QuickBooks.

**Authentication:** Required

**Query Parameters:**

- `orgId` (string): Organization identifier
- `userId` (string): User identifier

**Request Body:**

```json
{
  "billRef": {
    "value": "789"
  },
  "paymentAccountRef": {
    "value": "101"
  },
  "totalAmt": 100.0,
  "paymentMethodRef": {
    "value": "1"
  },
  "paymentDate": "2024-01-20",
  "privateNote": "string",
  "checkPayment": {
    "checkNum": "1001"
  },
  "lineItems": [
    {
      "amount": 100.0,
      "billLineRef": {
        "value": "1"
      }
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Bill payment processed successfully",
  "data": {
    "BillPayment": {
      "Id": "890",
      "TotalAmt": 100.0,
      "PaymentType": "Check"
    }
  }
}
```

**Notes:**

- Required fields: `billRef`, `paymentAccountRef`, `totalAmt`
- Optional fields: `paymentMethodRef`, `paymentDate`, `privateNote`, `checkPayment`, `lineItems`
- `totalAmt` must be a positive number
- `paymentDate` defaults to current date if not provided

---

## Error Responses

All endpoints return error responses in the following format:

```json
{
  "success": false,
  "message": "Error description"
}
```

### Common Error Codes

- `400 Bad Request`: Invalid request body or parameters
- `403 Forbidden`: Invalid or expired authentication token
- `404 Not Found`: Resource not found
- `405 Method Not Allowed`: HTTP method not supported for endpoint
