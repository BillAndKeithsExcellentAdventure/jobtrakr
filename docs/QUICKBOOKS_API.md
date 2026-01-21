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

The API provides integration with QuickBooks Online (QBO) for accounting operations including vendor management, bill creation, and payment processing.

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
          "FamilyName": "Last"
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

#### POST /qbo/addVendor

Create a new vendor in QuickBooks.

**Authentication:** Required

**Query Parameters:**

- `orgId` (string): Organization identifier
- `userId` (string): User identifier

**Request Body:**

```json
{
  "displayName": "string",
  "givenName": "string",
  "familyName": "string",
  "companyName": "string",
  "email": "string",
  "phone": "string",
  "website": "string",
  "billingAddress": "object",
  "notes": "string",
  "active": "boolean"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Vendor added successfully",
  "data": {
    "Vendor": {
      "Id": "456",
      "DisplayName": "New Vendor",
      "Active": true
    }
  }
}
```

**Notes:**

- Required fields: `displayName`
- Optional fields: `givenName`, `familyName`, `companyName`, `email`, `phone`, `website`, `billingAddress`, `notes`, `active`
- `active` defaults to `true` if not specified
- Returns the created vendor object with QuickBooks-assigned ID

#### POST /qbo/addBill

Create a new bill in QuickBooks.

**Authentication:** Required

**Query Parameters:**

- `orgId` (string): Organization identifier
- `userId` (string): User identifier

**Request Body:**

```json
{
  "vendorRef": {
    "value": "123"
  },
  "lineItems": [
    {
      "amount": 100.0,
      "description": "Item description",
      "accountRef": {
        "value": "456"
      },
      "qty": 1,
      "unitPrice": 100.0
    }
  ],
  "txnDate": "2024-01-15T00:00:00Z",
  "dueDate": "2024-02-15T00:00:00Z",
  "docNumber": "string",
  "privateNote": "string"
}
```

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
      "TotalAmt": 100.0
    }
  }
}
```

**Notes:**

- Required fields: `vendorRef`, `lineItems`
- Each line item must include: `amount`, `description`
- Optional line item fields: `itemRef`, `accountRef`, `qty`, `unitPrice`
- Optional bill fields: `txnDate`, `dueDate`, `docNumber`, `privateNote`

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
