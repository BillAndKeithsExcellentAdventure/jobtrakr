# Project Hound Backend

A Cloudflare Workers-based backend API for managing construction project media, receipts, invoices, and change orders.

## Table of Contents

- [Overview](#overview)
- [Setup](#setup)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
  - [Organization Management](#organization-management)
  - [Receipt Management](#receipt-management)
  - [Invoice Management](#invoice-management)
  - [Photo Management](#photo-management)
    - [Public Photo Access Management](#public-photo-access-management)
  - [Video Management](#video-management)
  - [Media Management](#media-management)
  - [Intelligence Services](#intelligence-services)
  - [Change Order Management](#change-order-management)
  - [Vendor Access Management](#vendor-access-management)
  - [QuickBooks Online Integration](#quickbooks-online-integration)
  - [Notification Management](#notification-management)
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

## Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Cloudflare account with Workers enabled
- Wrangler CLI

### Installation

```bash
npm install
```

### Configuration

The application uses Cloudflare Workers bindings configured in `wrangler.jsonc`:

- R2 buckets for image storage
- D1 database for metadata
- Service bindings
- Environment variables

### Development

```bash
# Start development server
npm run dev

# Deploy to production
npm run deploy

# Run tests
npm test
```

## Authentication

Most endpoints require JWT bearer token authentication in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

The JWT token must:

- Be properly formatted with 3 parts (header.payload.signature)
- Contain `sub` (user ID) and `exp` (expiration timestamp) claims
- Match the `userId` in the request
- Not be expired

## API Endpoints

### Organization Management

#### POST /addOrganization

Create a new organization.

**Authentication:** Required

**Request Body:**

```json
{
  "userId": "string",
  "name": "string",
  "slug": "string",
  "isDev": boolean
}
```

**Response:**

```json
{
  "success": true,
  "message": "Organization added successfully",
  "id": 123
}
```

---

### Receipt Management

#### POST /addReceipt

Create a receipt with metadata and auto-generated accounting ID. Optionally creates a QuickBooks purchase and can attach the receipt image.

**Authentication:** Required

**Content-Type:** `application/json`

**Request Body:**

```json
{
  "userId": "string",
  "orgId": "string",
  "projectId": "string",
  "projectAbbr": "string",
  "projectName": "string",
  "imageId": "string",
  "addAttachment": false,
  "qbPurchaseData": {
    "vendorRef": "123",
    "txnDate": "2024-02-15",
    "docNumber": "RECEIPT-001",
    "privateNote": "Optional note",
    "paymentAccount": {
      "paymentAccountRef": "98",
      "paymentType": "Checking",
      "checkNumber": "1001"
    },
    "lineItems": [
      {
        "amount": 100.0,
        "description": "Line item description",
        "accountRef": "45"
      }
    ]
  }
}
```

**Response (without QuickBooks):**

```json
{
  "success": true,
  "accountId": "RECEIPT-PROJ-001"
}
```

**Response (with QuickBooks):**

```json
{
  "success": true,
  "message": "Purchase created successfully",
  "data": {
    "Purchase": {
      "Id": "789",
      "PaymentType": "Check",
      "TotalAmt": 100.0,
      "TxnDate": "2024-02-15",
      "DocNumber": "RECEIPT-001"
    }
  }
}
```

**Notes:**

- Auto-generates accounting ID in format: `RECEIPT-{projectAbbr}-{sequentialNumber}`
- Required fields: `userId`, `orgId`, `projectId`, `projectAbbr`, `projectName`, `imageId`, `addAttachment`
- `qbPurchaseData` is optional - when provided, creates a purchase in QuickBooks Online
- When `qbPurchaseData` is provided:
  - `vendorRef` must be a valid QuickBooks vendor ID
  - `txnDate` is required and is stored as the QuickBooks purchase date
  - `paymentAccount` is required and must include `paymentAccountRef`
  - `lineItems` array is required with amount, description, and accountRef for each line
  - Optional fields: `docNumber`, `privateNote`, `paymentType`, `checkNumber`
  - If `addAttachment` is true, the system will attach the receipt image to the QuickBooks purchase
- If `docNumber` is not provided, it defaults to the generated accounting ID
- Use `/addReceiptImage` to upload the actual receipt image file

#### POST /addReceiptImage

Upload a receipt image with metadata.

**Authentication:** Required

**Content-Type:** `multipart/form-data`

**Form Fields:**

- `id` (string): Unique receipt identifier
- `createdAt` (string): ISO timestamp
- `userId` (string): User identifier
- `organizationId` (string): Organization identifier
- `projectId` (string): Project identifier
- `latitude` (number): GPS latitude
- `longitude` (number): GPS longitude
- `image` (File): Image file (JPEG, PNG, or HEIC, max 10MB)
- `deviceTypes` (string): Comma-separated device types for optimization

**Response:**

```json
{
  "success": true,
  "message": "Receipt added successfully",
  "data": { ... }
}
```

#### GET /fetchProjectReceipts

Retrieve all receipts for a project.

**Authentication:** Required

**Request Body:**

```json
{
  "userId": "string",
  "organizationId": "string",
  "projectId": "string"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Receipts retrieved successfully",
  "data": "[...]"
}
```

#### GET /fetchReceipt

Retrieve a specific receipt image.

**Authentication:** Required

**Query Parameters:**

- `organizationId` (string)
- `projectId` (string)
- `imageId` (string)
- `userId` (string)
- `deviceType` (string): "phone", "tablet", "desktop", or "original"

**Response:** Image file (JPEG)

#### GET /getReceiptForProcessing

Retrieve a receipt for processing (internal use).

**Authentication:** Not required

**Query Parameters:**

- `key` (string): Format: "organizationId/projectId/receiptId"

**Response:** Image file (JPEG)

#### POST /duplicateReceiptImage

Duplicate a receipt image from one project to another. Copies the receipt image across all device optimizations (original, phone, tablet, desktop).

**Authentication:** Required

**Content-Type:** `application/json`

**Request Body:**

```json
{
  "userId": "string",
  "orgId": "string",
  "fromProjectId": "string",
  "toProjectId": "string",
  "imageId": "string"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Receipt image duplicated successfully",
  "copiedBuckets": ["OriginalReceipts", "PhoneReceipts", "TabletReceipts", "DesktopReceipts"]
}
```

**Error Response (404 - Image not found):**

```json
{
  "success": false,
  "message": "Receipt image not found in source project."
}
```

**Notes:**

- Required fields: `userId`, `orgId`, `fromProjectId`, `toProjectId`, `imageId`
- Copies the image to all device-optimized buckets
- Returns the list of buckets where the image was successfully copied
- If source and target are the same, returns success with empty copied buckets list
- Returns 404 if the source image does not exist

---

### Invoice Management

#### POST /addBill

Create a bill/invoice with metadata and auto-generated accounting ID. Optionally creates a QuickBooks bill.

**Authentication:** Required

**Content-Type:** `application/json`

**Request Body:**

```json
{
  "userId": "string",
  "orgId": "string",
  "projectId": "string",
  "projectAbbr": "string",
  "projectName": "string",
  "invoiceId": "string",
  "imageId": "string",
  "addAttachment": false,
  "qbBillData": {
    "vendorRef": "123",
    "dueDate": "2024-02-15",
    "docNumber": "INV-2024-001",
    "privateNote": "Optional note",
    "lineItems": [
      {
        "amount": 100.0,
        "description": "Line item description",
        "accountRef": "45"
      }
    ]
  }
}
```

**Response (without QuickBooks):**

```json
{
  "success": true,
  "accountId": "BILL-PROJ-001"
}
```

**Response (with QuickBooks):**

```json
{
  "success": true,
  "message": "Bill created successfully",
  "data": {
    "Bill": {
      "Id": "789",
      "VendorRef": { "value": "123" },
      "TotalAmt": 100.0,
      "DueDate": "2024-02-15",
      "DocNumber": "INV-2024-001"
    }
  }
}
```

**Notes:**

- Auto-generates accounting ID in format: `BILL-{projectAbbr}-{sequentialNumber}`
- Required fields: `userId`, `orgId`, `projectId`, `projectAbbr`, `projectName`, `invoiceId`, `imageId`, `addAttachment`
- `qbBillData` is optional - when provided, creates a bill in QuickBooks Online
- When `qbBillData` is provided:
  - `vendorRef` must be a valid QuickBooks vendor ID
  - `lineItems` array is required with amount, description, and accountRef for each line
  - Optional fields: `dueDate`, `docNumber`, `privateNote`
  - If `addAttachment` is true, the system will attach the image to the QuickBooks bill
- Use `/addInvoiceImage` to upload the actual invoice image file

#### POST /addInvoiceImage

Upload an invoice image with metadata.

**Authentication:** Required

**Content-Type:** `multipart/form-data`

**Form Fields:** Same as `/addReceiptImage`

**Response:**

```json
{
  "success": true,
  "message": "Invoice added successfully",
  "data": { ... }
}
```

#### GET /fetchProjectInvoiceImages

Retrieve all invoice images for a project.

**Authentication:** Required

**Request Body:**

```json
{
  "userId": "string",
  "organizationId": "string",
  "projectId": "string"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Invoice images retrieved successfully",
  "data": "[...]"
}
```

#### GET /fetchInvoiceImage

Retrieve a specific invoice image.

**Authentication:** Required

**Query Parameters:** Same as `/fetchReceipt`

**Response:** Image file (JPEG)

#### GET /getInvoiceForProcessing

Retrieve an invoice for processing (internal use).

**Authentication:** Not required

**Query Parameters:** Same as `/getReceiptForProcessing`

**Response:** Image file (JPEG)

---

### Photo Management

#### POST /addPhoto

Upload a photo with metadata.

**Authentication:** Required

**Content-Type:** `multipart/form-data`

**Form Fields:** Same as `/addReceipt`

**Response:**

```json
{
  "success": true,
  "message": "Photo added successfully",
  "data": { ... }
}
```

#### GET /fetchProjectPhotos

Retrieve all photos for a project.

**Authentication:** Required

**Request Body:**

```json
{
  "userId": "string",
  "organizationId": "string",
  "projectId": "string"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Photos retrieved successfully",
  "data": "[...]"
}
```

#### GET /fetchPhoto

Retrieve a specific photo image.

**Authentication:** Required

**Query Parameters:** Same as `/fetchReceipt`

**Response:** Image file (JPEG)

#### Public Photo Access Management

The following endpoints enable managing public access to photos without requiring full project authentication. This allows sharing photos with external users who can register and view specific project photos.

**Typical Workflow:**

1. **Project Owner:** Upload photos using `/addPhoto`
2. **Project Owner:** Mark selected photos as public using `/makePhotosPublic`
3. **Project Owner:** Grant access to external users via `/grantPhotoAccess` (creates access record with email)
4. **External User:** Check registration status via `/isRegisteredForPhotos`
5. **External User:** Complete registration by setting password via `/registerForPublicPhotos` (receives access token and refresh token)
6. **External User:** List accessible projects via `/getGrantedProjectIds` (requires access token)
7. **External User:** Retrieve public photos via `/fetchProjectPublicPhotos` and `/fetchPublicPhoto`
8. **External User:** Refresh expired access token via `/refreshToken` using refresh token

##### POST /makePhotosPublic

Mark specific photos as public within a project.

**Authentication:** Required (⚠️ Note: Currently bypassed in code for testing - should be enabled in production)

**Request Body:**

```json
{
  "userId": "string",
  "projectId": "string",
  "imageIds": ["string"]
}
```

**Response:**

```json
{
  "success": true,
  "message": "All photos made public successfully",
  "inserted": ["imageId1", "imageId2"],
  "alreadyExists": [],
  "failed": []
}
```

##### POST /grantPhotoAccess

Grant a user access to view public photos in a specific project.

**Authentication:** Required (⚠️ Note: Currently bypassed in code for testing - should be enabled in production)

**Request Body:**

```json
{
  "userId": "string",
  "emailId": "string",
  "projectId": "string",
  "projectName": "string",
  "orgId": "string"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Photo access granted successfully",
  "data": {
    "email_id": "user@example.com",
    "project_id": "project123",
    "project_name": "My Project",
    "org_id": "org456"
  }
}
```

##### POST /revokePhotoAccess

Revoke all users' access to public photos in a specific project.

**Authentication:** Required (⚠️ Note: Currently bypassed in code for testing - should be enabled in production)

**Request Body:**

```json
{
  "userId": "string",
  "projectId": "string"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Photo access revoked successfully for 2 user(s)",
  "rowsDeleted": 2
}
```

##### GET /fetchEmailsWithPhotoAccess

Retrieve a list of email addresses that have been granted access to public photos for a specific project.

**Authentication:** Not required

**Query Parameters:**

- `projectId` (string): Project identifier

**Response:**

```json
{
  "success": true,
  "message": "Emails retrieved successfully",
  "data": ["user1@example.com", "user2@example.com", "user3@example.com"]
}
```

**Error Responses:**

- `400 Bad Request` - Missing or invalid projectId:

```json
{
  "success": false,
  "message": "Missing required field: projectId"
}
```

- `405 Method Not Allowed` - Non-GET request:

```
Method not allowed
```

**Notes:**

- Returns email addresses in alphabetical order
- Queries the `public_photos_access` table
- Useful for displaying who has access to a project's photos

##### GET /fetchProjectPublicImageIds

Retrieve a list of public image IDs for a specific project.

**Authentication:** Not required

**Query Parameters:**

- `projectId` (string): Project identifier

**Response:**

```json
{
  "success": true,
  "message": "Image IDs retrieved successfully",
  "data": ["img-001", "img-002", "img-003"]
}
```

**Error Responses:**

- `400 Bad Request` - Missing or invalid projectId:

```json
{
  "success": false,
  "message": "Missing required field: projectId"
}
```

- `405 Method Not Allowed` - Non-GET request:

```
Method not allowed
```

**Notes:**

- Returns image IDs in alphabetical order
- Queries the `public_photos` table
- Returns an empty array if no public images are found for the project
- Useful for retrieving the list of public images available for a project

##### GET /isRegisteredForPhotos

Check if an email address is registered for public photo access and their registration status.

**Authentication:** Not required

**Query Parameters:**

- `email` (string): Email address to check

**Response (Not Found):**

```json
{
  "success": true,
  "registered": false,
  "message": "User not found in photo access records",
  "status": "NOT_FOUND"
}
```

**Response (Needs Password):**

```json
{
  "success": true,
  "registered": true,
  "requiresNewPassword": true,
  "message": "User needs to complete registration by setting a password",
  "status": "NEEDS_PASSWORD"
}
```

**Response (Fully Registered):**

```json
{
  "success": true,
  "registered": true,
  "requiresNewPassword": false,
  "message": "User is fully registered for public photo access",
  "status": "REGISTERED"
}
```

**CORS Headers:** Allowed origin: `*`

##### POST /loginForPublicPhotos

Authenticate a public photo user and receive access tokens.

**Authentication:** Not required

**Request Body:**

```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "email": "user@example.com",
    "registered": true,
    "accessToken": "jwt_access_token",
    "accessExpiresIn": 900,
    "refreshToken": "refresh_token_string",
    "refreshExpiresIn": 5184000
  }
}
```

**Notes:**

- Returns 404 if email not found
- Returns 409 if password is not set (registration required)
- Returns 401 if password is invalid

**CORS Headers:** Allowed origin: `*`

##### POST /registerForPublicPhotos

Complete registration for public photo access by setting a password. This must be called after an email has been granted access via `/grantPhotoAccess`.

**Authentication:** Not required

**Request Body:**

```json
{
  "email": "string",
  "newPassword": "string"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Registration completed successfully",
  "data": {
    "email": "user@example.com",
    "registered": true,
    "accessToken": "jwt_access_token",
    "accessExpiresIn": 900,
    "refreshToken": "refresh_token_string",
    "refreshExpiresIn": 2592000
  }
}
```

**Notes:**

- Password must be at least 6 characters long
- Returns JWT access token (expires in 15 minutes) and refresh token (expires in 30 days)
- Access token is used for authenticating requests to public photo endpoints

**CORS Headers:** Allowed origin: `*`

##### POST /refreshToken

Refresh an expired access token using a valid refresh token.

**Authentication:** Not required (uses refresh token)

**Request Body:**

```json
{
  "email": "string",
  "refreshToken": "string",
  "accessToken": "string"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Access token refreshed successfully",
  "data": {
    "email": "user@example.com",
    "accessToken": "new_jwt_access_token",
    "expiresIn": 900
  }
}
```

**CORS Headers:** Allowed origin: `*`

##### POST /getGrantedProjectIds

Get the list of projects that a user has been granted access to view public photos.

**Authentication:** Required (JWT access token in Authorization header)

**Request Body:**

```json
{
  "email": "string"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Granted project IDs retrieved successfully",
  "data": [
    {
      "projectId": "project123",
      "projectName": "My Project"
    },
    {
      "projectId": "project456",
      "projectName": "Another Project"
    }
  ]
}
```

**CORS Headers:** Allowed origin: `*`

**Notes:**

- Requires valid JWT access token obtained from `/registerForPublicPhotos` or `/refreshToken`
- Returns 401 if token is valid but expired
- Returns 403 if token signature is invalid

##### GET /fetchProjectPublicPhotos

Retrieve all public photos for a specific project that the user has access to.

**Authentication:** Required (JWT access token in Authorization header)

**Query Parameters:**

- `emailId` (string): User's email address
- `projectId` (string): Project identifier
- `deviceType` (string, optional): Device type (defaults to "desktop")

**Response:**

```json
{
  "success": true,
  "message": "Photos retrieved successfully",
  "data": "[{\"orgId\":\"org456\",\"projectId\":\"project123\",\"imageId\":\"img789\",\"objects\":[{\"key\":\"org456/project123/img789\",\"size\":12345,\"long\":\"-122.4194\",\"lat\":\"37.7749\"}]}]"
}
```

**CORS Headers:** Allowed origin: `*`

**Notes:**

- Requires valid JWT access token obtained from `/registerForPublicPhotos` or `/refreshToken`
- Only returns photos that have been marked as public via `/makePhotosPublic`
- Only returns photos from projects the user has been granted access to via `/grantPhotoAccess`

##### GET /fetchPublicPhoto

Retrieve a specific public photo image file.

**Authentication:** Not required

**Query Parameters:**

- `organizationId` (string): Organization identifier
- `projectId` (string): Project identifier
- `imageId` (string): Image identifier
- `deviceType` (string, optional): "phone", "tablet", "desktop", or "original" (defaults to "desktop")

**Response:** Image file (JPEG)

**Headers:**

- `Content-Type: image/jpeg`
- `Cache-Control: public, max-age=86400` (24 hour cache)
- `ETag`: Image identifier-based ETag for caching

**CORS Headers:** Allowed origin: `*`

**Notes:**

- Supports ETag-based caching (returns 304 Not Modified if `If-None-Match` header matches)
- This endpoint does not require authentication but only serves photos marked as public

---

### Video Management

#### POST /addVideo

Upload a video with metadata.

**Authentication:** Required

**Content-Type:** `multipart/form-data`

**Form Fields:**

- `id` (string): Unique video identifier
- `createdAt` (string): ISO timestamp
- `userId` (string): User identifier
- `organizationId` (string): Organization identifier
- `projectId` (string): Project identifier
- `latitude` (number): GPS latitude
- `longitude` (number): GPS longitude
- `image` (File): Video file (MP4, max 100MB)
- `deviceTypes` (string): Device types

**Response:**

```json
{
  "success": true,
  "message": "Video added successfully",
  "data": { ... }
}
```

---

### Media Management

#### POST /deleteMedia

Delete one or more media items.

**Authentication:** Required

**Request Body:**

```json
{
  "userId": "string",
  "organizationId": "string",
  "projectId": "string",
  "imageIds": ["string"],
  "imageType": "string"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Media deleted successfully"
}
```

---

### Intelligence Services

#### POST /getReceiptIntelligence

Extract structured data from a receipt using AI.

**Authentication:** Required

**Request Body:**

```json
{
  "userId": "string",
  "organizationId": "string",
  "projectId": "string",
  "imageId": "string"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "merchantName": "string",
    "total": "number",
    "date": "string",
    "items": [...]
  }
}
```

#### POST /getInvoiceIntelligence

Extract structured data from an invoice using AI.

**Authentication:** Required

**Request Body:** Same as `/getReceiptIntelligence`

**Response:**

```json
{
  "success": true,
  "data": {
    "vendorName": "string",
    "invoiceNumber": "string",
    "total": "number",
    "items": [...]
  }
}
```

#### POST /transformChangeOrder

Generate a professional change order description using AI.

**Authentication:** Required (⚠️ Note: Currently bypassed in code for testing - should be enabled in production)

**Request Body:**

```json
{
  "userId": "string",
  "userPrompt": "string"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "description": "string",
    "items": [
      {
        "code": "string",
        "description": "string",
        "unitcost": "number"
      }
    ]
  }
}
```

---

### Change Order Management

#### POST /generatePdf

Generate a PDF from HTML content (deprecated - use `/sendChangeOrderEmail`).

**Authentication:** Required (⚠️ Note: Currently bypassed in code - should be enabled in production)

**Request Body:**

```json
{
  "userId": "string",
  "html": "string"
}
```

**Response:**

```json
{
  "status": "success"
}
```

#### POST /sendChangeOrderEmail

Generate a change order PDF and send it via email.

**Authentication:** Required (⚠️ Note: Currently bypassed in code for testing - should be enabled in production)

**Request Body:**

```json
{
  "userId": "string",
  "htmlPdf": "string",
  "htmlBody": "string",
  "toEmail": "string",
  "fromEmail": "string",
  "fromName": "string",
  "subject": "string",
  "changeOrderId": "string",
  "projectId": "string",
  "expirationDate": "string",
  "ownerEmail": "string"
}
```

**Response:**

```json
{
  "status": "success"
}
```

**Notes:**

- The `htmlBody` can contain `<[AcceptURL]>` placeholder which will be replaced with the acceptance URL
- An acceptance link is generated with hash-based verification

#### GET /AcceptChangeOrder

Accept a change order via email link.

**Authentication:** Not required (hash-based verification)

**Query Parameters:**

- `projectId` (string)
- `changeOrderId` (string)
- `email` (string): Acceptor's email
- `hash` (string): Verification hash
- `expirationDate` (string): Custom timestamp in seconds since January 1, 2000 00:00:00 UTC (not standard Unix epoch)

**Response:**

```json
{
  "success": true,
  "message": "Change order accepted.",
  "data": { ... }
}
```

**CORS Headers:** Allowed origin: `https://projecthoundinfo.pages.dev`

#### GET /IsChangeOrderAccepted

Check if a change order has been accepted.

**Authentication:** Not required

**Query Parameters:**

- `StoreId` (string)
- `ChangeId` (string)

**Response:**

```json
{
  "success": true,
  "message": "Change order is accepted.",
  "data": { ... }
}
```

#### GET /ChangeOrderProcessed

Mark a change order as processed.

**Authentication:** Not required

**Query Parameters:**

- `StoreId` (string)
- `ChangeId` (string)

**Response:**

```json
{
  "success": true,
  "message": "Change order set as processed.",
  "data": { ... }
}
```

#### POST /getChangeOrderStatuses

Get all change order statuses for a project.

**Authentication:** Not required

**Request Body:**

```json
{
  "projectId": "string"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Change order statuses retrieved.",
  "data": [...]
}
```

#### GET /getNextChangeOrderNumber

Get the next available change order number for a project.

**Authentication:** Required

**Query Parameters:**

- `userId` (string): User identifier
- `projectId` (string): Project identifier

**Response:**

```json
{
  "success": true,
  "newNumber": 42
}
```

---

### Vendor Access Management

The Vendor Access Management system provides a secure portal for vendors to access their invoices and payment information. Vendors can register, login, and view organizations they have access to.

**Key Features:**

- Vendor registration and authentication
- JWT-based access tokens with refresh token support
- Organization-based access control
- Secure password hashing with salted SHA-256
- Invoice retrieval by vendor

#### POST /loginForVendorAccess

Authenticate a vendor and receive access tokens.

**Authentication:** Not required (public endpoint)

**Request Body:**

```json
{
  "email": "vendor@example.com",
  "password": "string"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "email": "vendor@example.com",
    "registered": true,
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "accessExpiresIn": 900,
    "refreshToken": "a1b2c3d4...",
    "refreshExpiresIn": 5184000,
    "organizations": [
      {
        "org_id": "org123",
        "organization_name": "Acme Construction",
        "vendor_id": "vendor456"
      }
    ]
  }
}
```

**Notes:**

- Access token expires in 15 minutes (900 seconds)
- Refresh token expires in 60 days (5,184,000 seconds)
- Returns list of organizations the vendor has access to
- Returns 404 if email not found
- Returns 409 if password not set (needs registration)
- Returns 401 if invalid credentials

#### POST /registerForVendorAccess

Complete vendor registration by setting a password.

**Authentication:** Not required (public endpoint)

**Request Body:**

```json
{
  "email": "vendor@example.com",
  "password": "string"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Registration completed successfully",
  "data": {
    "email": "vendor@example.com",
    "registered": true,
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "accessExpiresIn": 900,
    "refreshToken": "a1b2c3d4...",
    "refreshExpiresIn": 5184000
  }
}
```

**Notes:**

- Password must be at least 6 characters long
- Vendor must be pre-authorized by an organization administrator
- Returns 404 if email not found in vendor access records
- Automatically generates and returns access and refresh tokens

#### GET /isRegisteredForVendorAccess

Check if a vendor email is registered and their registration status.

**Authentication:** Not required (public endpoint)

**Query Parameters:**

- `email` (string): Vendor email address

**Response (Not Found):**

```json
{
  "success": true,
  "registered": false,
  "message": "User not found in vendor access records",
  "status": "NOT_FOUND"
}
```

**Response (Needs Password):**

```json
{
  "success": true,
  "registered": true,
  "requiresNewPassword": true,
  "message": "User needs to complete registration by setting a password",
  "status": "NEEDS_PASSWORD"
}
```

**Response (Fully Registered):**

```json
{
  "success": true,
  "registered": true,
  "requiresNewPassword": false,
  "message": "User is fully registered for vendor access",
  "status": "REGISTERED"
}
```

#### POST /grantVendorAccess

Grant a vendor access to an organization.

**Authentication:** Required

**Request Body:**

```json
{
  "userId": "string",
  "vendorEmail": "vendor@example.com",
  "vendorId": "vendor456",
  "vendorName": "ABC Supplies",
  "organizationName": "Acme Construction",
  "orgId": "org123",
  "fromEmail": "admin@acme.com",
  "fromName": "Admin Name"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Vendor access granted successfully",
  "data": {
    "vendor_email": "vendor@example.com",
    "vendor_id": "vendor456",
    "vendor_name": "ABC Supplies",
    "organization_name": "Acme Construction",
    "org_id": "org123"
  }
}
```

**Notes:**

- Sends an email notification to the vendor
- Uses INSERT OR REPLACE to handle duplicate entries
- Validates email format
- All fields are required

#### POST /getGrantedVendorOrganizations

Get list of organizations a vendor has access to.

**Authentication:** Required (Vendor JWT)

**Request Body:**

```json
{
  "email": "vendor@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Granted vendor organizations retrieved successfully",
  "data": [
    {
      "org_id": "org123",
      "organization_name": "Acme Construction",
      "vendor_id": "vendor456"
    },
    {
      "org_id": "org789",
      "organization_name": "Builder Inc",
      "vendor_id": "vendor456"
    }
  ]
}
```

**Notes:**

- Requires valid vendor access JWT token in Authorization header
- Returns all organizations the vendor has been granted access to

#### GET /fetchVendorInvoices

Fetch all invoices for a specific vendor in an organization.

**Authentication:** Required (Vendor JWT)

**Query Parameters:**

- `orgId` (string): Organization identifier
- `vendorId` (string): Vendor identifier

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "accountingId": "bill123",
      "isPaid": true,
      "paymentType": "Check",
      "paymentStatus": "Completed",
      "totalAmount": 1500.0,
      "paymentTotal": 1500.0,
      "updateDate": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Notes:**

- **Recently updated**: Now requires both `orgId` and `vendorId` parameters
- Returns payment status for all bills associated with the vendor
- Bill is considered paid if `paymentTotal >= totalAmount` and status is "Completed" or "PrintComplete"
- Returns empty array if no invoices found

---

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
  "data": [
    {
      "acctId": "123",
      "name": "Vendor Name",
      "address": "123 Main St",
      "city": "Springfield",
      "state": "IL",
      "zip": "62701",
      "mobilePhone": "5551234",
      "businessPhone": "5551234",
      "notes": "Optional notes"
    }
  ]
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
  "data": [
    {
      "id": "35",
      "name": "Advertising",
      "classification": "Expense",
      "accountType": "Expense",
      "accountSubType": "AdvertisingPromotional"
    }
  ]
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

#### GET /qbo/fetchPreferences

Retrieve QuickBooks company preferences and settings.

**Authentication:** Required

**Query Parameters:**

- `orgId` (string): Organization identifier
- `userId` (string): User identifier

**Response:**

```json
{
  "success": true,
  "data": {
    "Name": "Company Preferences",
    "TimeZone": "America/Los_Angeles",
    "Currency": { "value": "USD" }
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
- Returns company-level preferences and settings from QuickBooks

#### GET /qbo/fetchCustomers

Retrieve all customers from QuickBooks.

**Authentication:** Required

**Query Parameters:**

- `orgId` (string): Organization identifier
- `userId` (string): User identifier

**Response:**

```json
{
  "success": true,
  "data": {
    "QueryResponse": [
      {
        "id": "123",
        "displayName": "Acme Construction",
        "email": "contact@acme.com",
        "phone": "555-1234",
        "active": true
      }
    ],
    "time": "2024-02-15T10:30:00Z"
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
- Returns all customers in the QuickBooks instance

#### GET /qbo/fetchProjects

Retrieve all active projects (job customers) from QuickBooks.

**Authentication:** Required

**Query Parameters:**

- `orgId` (string): Organization identifier
- `userId` (string): User identifier

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "456",
      "displayName": "Downtown Office Renovation",
      "fullyQualifiedName": "Acme Construction:Downtown Office Renovation",
      "parentRef": { "value": "123" },
      "active": true,
      "isProject": true
    }
  ]
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
- Only returns customers marked as jobs (projects) in QuickBooks
- Returns normalized project data for easier consumption

#### GET /qbo/doesProjectExist

Check if a project exists in QuickBooks for a given Project Hound project ID.

**Authentication:** Required

**Query Parameters:**

- `orgId` (string): Organization identifier
- `projectId` (string): Project identifier
- `userId` (string): User identifier

**Response:**

```json
{
  "success": true
}
```

**Response (Not Found):**

```json
{
  "success": false
}
```

**Notes:**

- Returns `success: true` if the project exists in the `quickbooks_projects` table
- Returns `success: false` if the project does not exist
- Does not require QuickBooks connection to be active (only checks local database)
- Useful for determining if a project has been synced to QuickBooks

#### POST /qbo/addProject

Create a new project (sub-customer) under an existing customer in QuickBooks.

**Authentication:** Required

**Query Parameters:**

- `orgId` (string): Organization identifier
- `userId` (string): User identifier

**Request Body:**

```json
{
  "customerId": "123",
  "projectName": "Downtown Office Renovation",
  "projectId": "proj-001"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Project created successfully",
  "newQBId": "456"
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

- Required fields: `customerId`, `projectName`, `projectId`
- Creates a sub-customer (job) under the specified parent customer
- Returns the QuickBooks-assigned project ID in `newQBId` field
- Stores the mapping between Project Hound projectId and QuickBooks project ID in local database
- Returns 401 if token refresh fails (requires reconnection)
- Projects are stored as customers with Job=true in QuickBooks
- Status code: 201 Created on success, 401 if authentication fails, 500 for other errors

#### POST /qbo/updateProject

Update an existing project (sub-customer) in QuickBooks.

**Authentication:** Required

**Query Parameters:**

- `orgId` (string): Organization identifier
- `userId` (string): User identifier

**Request Body:**

```json
{
  "customerId": "123",
  "projectName": "Downtown Office Renovation - Updated",
  "projectId": "proj-001"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Project updated successfully",
  "qbId": "456"
}
```

**Error Response (401):**

```json
{
  "success": false,
  "message": "Token expired and refresh failed. Please reconnect QuickBooks."
}
```

**Error Response (404):**

```json
{
  "success": false,
  "message": "Project not found in QuickBooks. Please create the project first."
}
```

**Notes:**

- Required fields: `customerId`, `projectName`, `projectId`
- Updates an existing sub-customer (job) under the specified parent customer
- The project must already exist in QuickBooks (use `/qbo/addProject` to create new projects)
- Returns the QuickBooks project ID in `qbId` field
- Automatically fetches the existing customer record to retrieve SyncToken (required for updates)
- Returns 401 if token refresh fails (requires reconnection)
- Returns 404 if project not found in local database or QuickBooks
- Status code: 200 OK on success, 401 if authentication fails, 404 if project not found, 500 for other errors

#### POST /qbo/addCustomer

Create a new customer in QuickBooks.

**Authentication:** Required

**Query Parameters:**

- `orgId` (string): Organization identifier
- `userId` (string): User identifier

**Request Body:**

```json
{
  "displayName": "New Customer Name",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "555-1234",
  "email": "john@example.com",
  "address": "123 Main St",
  "address2": "Suite 100",
  "city": "Springfield",
  "state": "IL",
  "zip": "62701"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Customer added successfully",
  "newQBId": "789"
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

- Required field: `displayName`
- Optional fields: `firstName`, `lastName`, `phone`, `email`, `address`, `address2`, `city`, `state`, `zip`
- Returns the QuickBooks-assigned customer ID in `newQBId` field
- Returns 401 if token refresh fails (requires reconnection)

#### POST /qbo/addProject

Create a new project (sub-customer) under an existing customer in QuickBooks.

**Authentication:** Required

**Query Parameters:**

- `orgId` (string): Organization identifier
- `userId` (string): User identifier

**Request Body:**

```json
{
  "customerId": "123",
  "projectName": "Downtown Office Renovation",
  "projectId": "proj-001"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Project added successfully",
  "newQBId": "456"
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

- Required fields: `customerId`, `projectName`, `projectId`
- Creates a sub-customer (job) under the specified parent customer
- Returns the QuickBooks-assigned project ID in `newQBId` field
- Returns 401 if token refresh fails (requires reconnection)
- Projects are stored as customers with Job=true in QuickBooks

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
  "notes": "Primary supplier for materials"
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

#### POST /qbo/editBill

Update an existing bill in QuickBooks.

**Authentication:** Required

**Request Body:**

```json
{
  "orgId": "org123",
  "userId": "user456",
  "projectId": "project789",
  "projectName": "Project Alpha",
  "accountingId": "bill123",
  "qbBillData": {
    "vendorRef": "321",
    "dueDate": "2024-02-15",
    "docNumber": "INV-2024-001",
    "privateNote": "Optional note",
    "lineItems": [
      {
        "amount": 100.0,
        "description": "Line item description",
        "accountRef": "45"
      }
    ]
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Bill updated successfully",
  "data": {
    "Bill": {
      "Id": "789",
      "VendorRef": { "value": "321" },
      "TotalAmt": 100.0,
      "DueDate": "2024-02-15",
      "DocNumber": "INV-2024-001"
    }
  }
}
```

**Notes:**

- Required fields: `orgId`, `userId`, `projectId`, `projectName`, `accountingId`, `qbBillData`
- `qbBillData` required fields: `vendorRef`, `dueDate`, `lineItems`
- `lineItems` must be a non-empty array with `amount`, `description`, and `accountRef` for each item
- Optional fields: `docNumber`, `privateNote`
- Returns 401 if token refresh fails (requires reconnection)

#### POST /qbo/deleteBill

Delete an existing bill in QuickBooks.

**Authentication:** Required

**Request Body:**

```json
{
  "orgId": "org123",
  "userId": "user456",
  "projectId": "project789",
  "billId": "789"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Bill deleted successfully",
  "data": {
    "Bill": {
      "Id": "789",
      "status": "Deleted"
    }
  }
}
```

**Notes:**

- Required fields: `orgId`, `userId`, `projectId`, `billId`
- `billId` is the QuickBooks Bill ID (not the accounting ID)
- Returns 401 if token refresh fails (requires reconnection)

#### POST /qbo/editReceipt

Update an existing purchase (receipt) in QuickBooks.

**Authentication:** Required

**Request Body:**

```json
{
  "orgId": "org123",
  "userId": "user456",
  "projectId": "project789",
  "projectName": "Project Alpha",
  "accountingId": "RECEIPT-PROJ-001",
  "addAttachment": true,
  "imageId": "receipt-image-001",
  "qbPurchaseData": {
    "vendorRef": "321",
    "txnDate": "2024-02-15",
    "docNumber": "RECEIPT-001",
    "privateNote": "Optional note",
    "paymentAccount": {
      "paymentAccountRef": "98",
      "paymentType": "Checking",
      "checkNumber": "1001"
    },
    "lineItems": [
      {
        "amount": 100.0,
        "description": "Line item description",
        "accountRef": "45"
      }
    ]
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Purchase updated successfully",
  "data": {
    "Purchase": {
      "Id": "789",
      "PaymentType": "Check",
      "TotalAmt": 100.0,
      "TxnDate": "2024-02-15",
      "DocNumber": "RECEIPT-001"
    }
  }
}
```

**Notes:**

- Required fields: `orgId`, `userId`, `projectId`, `projectName`, `accountingId`, `qbPurchaseData`
- `qbPurchaseData` required fields: `vendorRef`, `txnDate`, `paymentAccount`, `lineItems`
- `paymentAccount` must include `paymentAccountRef`
- `lineItems` must be a non-empty array with `amount`, `description`, and `accountRef` for each item
- Optional fields: `docNumber`, `privateNote`, `paymentType`, `checkNumber`
- If `addAttachment` is true, the system will attach the receipt image to the updated purchase
- Returns 401 if token refresh fails (requires reconnection)

#### POST /qbo/deleteReceipt

Delete an existing purchase (receipt) in QuickBooks.

**Authentication:** Required

**Request Body:**

```json
{
  "orgId": "org123",
  "userId": "user456",
  "projectId": "project789",
  "purchaseId": "789"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Purchase deleted successfully",
  "data": {
    "Purchase": {
      "Id": "789",
      "status": "Deleted"
    }
  }
}
```

**Notes:**

- Required fields: `orgId`, `userId`, `projectId`, `purchaseId`
- `purchaseId` is the QuickBooks Purchase ID (not the accounting ID)
- Returns 401 if token refresh fails (requires reconnection)

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

#### POST /qbo/isBillPaid

Check if a specific bill is paid in QuickBooks.

**Authentication:** Required

**Query Parameters:**

- `userId` (string): User identifier

**Request Body:**

```json
{
  "orgId": "org123",
  "projectId": "project456",
  "accountingId": "bill123"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "isPaid": true,
    "paymentType": "Check",
    "paymentStatus": "Completed",
    "totalAmount": 1500.0,
    "paymentTotal": 1500.0,
    "updateDate": "2024-01-15T10:30:00Z"
  }
}
```

**Notes:**

- All fields in request body are required: `orgId`, `projectId`, `accountingId`
- Bill is considered paid if `paymentTotal >= totalAmount` and status is "Completed" or "PrintComplete"
- Returns empty data object if bill not found in payment tracking database

#### POST /qbo/areBillsPaid

Check payment status for all bills in a project.

**Authentication:** Required

**Query Parameters:**

- `userId` (string): User identifier

**Request Body:**

```json
{
  "orgId": "org123",
  "projectId": "project456"
}
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "accountingId": "bill1",
      "isPaid": true,
      "paymentType": "Check",
      "paymentStatus": "Completed",
      "totalAmount": 1500.0,
      "paymentTotal": 1500.0,
      "updateDate": "2024-01-15T10:30:00Z"
    },
    {
      "accountingId": "bill2",
      "isPaid": false,
      "paymentType": null,
      "paymentStatus": null,
      "totalAmount": 2500.0,
      "paymentTotal": 0.0,
      "updateDate": "2024-01-10T08:00:00Z"
    }
  ]
}
```

**Notes:**

- Required fields in request body: `orgId`, `projectId`
- Returns payment status for all bills associated with the project
- Bills are considered paid if `paymentTotal >= totalAmount` and status is "Completed" or "PrintComplete"
- Returns empty array if no bills found for the project

#### POST /qbo/notificationWebhook

Webhook endpoint for receiving QuickBooks Online notifications.

**Authentication:** HMAC signature verification (internal)

**Headers:**

- `intuit-signature` (string): HMAC-SHA256 signature of request body

**Request Body:**

QuickBooks webhook payload (various event types)

**Response:**

```
200 OK
```

**Notes:**

- This is an internal endpoint used by QuickBooks to notify of data changes
- Signature is verified using the QuickBooks webhook token
- Not intended for direct API consumer use
- Handles various QuickBooks event types (bill updates, payment changes, etc.)

---

### Notification Management

#### POST /registerExpoPushToken

Register an Expo push notification token for a user.

**Authentication:** Not required

**Request Body:**

```json
{
  "orgId": "org123",
  "userId": "user456",
  "expoPushToken": "ExponentPushToken[xxxxxxxxxxxxxx]"
}
```

**Response:**

```json
{
  "success": true
}
```

**Notes:**

- Stores the Expo push token in KV storage for later use
- Token is stored with key format: `expo:{orgId}:{userId}`
- All fields are required and cannot be empty
- Used for sending mobile push notifications via Expo

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

## Development

### Project Structure

```
src/
├── index.ts                    # Main API router
├── receipts.ts                 # Receipt management
├── invoices.ts                 # Invoice management
├── photos.ts                   # Photo management
├── organization.ts             # Organization management
├── receiptIntelligence.ts      # Receipt AI processing
├── invoiceIntelligence.ts      # Invoice AI processing
├── transformChangeOrder.ts     # Change order AI generation
├── changeOrders.ts             # Change order workflow
├── pdfService.ts              # PDF generation
├── calculatehash.ts           # Hash generation for verification
├── imageUtils.ts              # Image processing utilities
└── types.d.ts                 # TypeScript type definitions
```

### Running Tests

```bash
npm test
```

### Type Generation

Generate TypeScript types from Wrangler configuration:

```bash
npm run cf-typegen
```

### CORS Configuration

The API supports CORS preflight requests and returns appropriate headers. For change order acceptance endpoints, the allowed origin is `https://projecthoundinfo.pages.dev`.

## Technologies

- **Runtime:** Cloudflare Workers
- **Storage:** Cloudflare R2 (object storage)
- **Database:** Cloudflare D1 (SQLite)
- **Image Processing:** Cloudflare Images API
- **Document Intelligence:** Azure AI Document Intelligence
- **Generative AI:** Azure OpenAI (GPT-4o-mini)
- **PDF Generation:** API2PDF
- **Email:** SMTP2GO

## License

Private - All rights reserved
