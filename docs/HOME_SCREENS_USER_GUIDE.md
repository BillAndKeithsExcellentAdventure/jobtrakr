# Home Screens User Guide

## Table of Contents

- [Getting Started](#getting-started-with-projecthound)
  - [Signing Up](#signing-up-with-clerk)
  - [Email Verification](#receiving-and-entering-a-verification-code)
  - [Creating Your Organization](#defining-your-organization)
- [Projects Home Screen](#projects-home-screen)
- [Add Project](#add-project)
- [Project Details Screen](#project-details-screen)
- [Edit Project Screen](#edit-project-screen)
- [Cost Items (Work Items)](#cost-items-work-items)
- [Project Receipts](#project-receipts)
- [Project Bills (Invoices)](#project-bills-invoices)
- [Project Change Orders](#project-change-orders)
- [Project Photos](#project-photos)
- [Project Notes](#project-notes)
- [App Settings (Company Settings)](#app-settings-company-settings)
- [Configuration Home Screen](#configuration-home-screen)
- [Team Management](#team-management-organization-admins-only)
- [Navigation Patterns](#navigation-patterns)
- [Loading States](#loading-states)
- [Tips and Best Practices](#tips-and-best-practices)
- [Troubleshooting](#troubleshooting)

---

## Getting Started with ProjectHound

Before you can use ProjectHound, you need to create an account and set up your organization. This section guides you through the initial setup process.

### Signing Up with Clerk

ProjectHound uses Clerk for secure authentication and user management.

**To create a new account:**

1. **Navigate to the Sign Up screen**
   - Open ProjectHound and tap **Sign up** on the login screen

2. **Enter your information**
   - **Email Address** - Your business or personal email
   - **Password** - A secure password for your account

3. **Submit your registration**
   - Tap **Continue** to create your account
   - Clerk will send a verification email to your email address

### Receiving and Entering a Verification Code

After submitting your sign-up information, you must verify your email address.

**Email Verification Process:**

1. **Check your email**
   - Look for an email from ProjectHound (powered by Clerk) with a verification code
   - If you don't see it quickly, check your spam or junk mail folder

2. **Enter the verification code**
   - You'll be automatically taken to the verification screen
   - Enter the 6-digit code from the email
   - Tap **Verify**

3. **Verification Complete**
   - Once verified, your account is created and activated
   - You'll be redirected to create your organization

**Note:** The verification code typically expires after a short period. If your code expires or you need a new one, you can return to the sign-up screen and begin the registration process again to receive a fresh verification code.

### Defining Your Organization

After email verification, you must create an organization. An organization is your company or workspace where all projects and data are stored.

**Creating an Organization:**

1. **Enter Organization Information**
   - You'll see the "Create Organization" screen automatically
   - **Organization Name** - Enter your company or business name
     - This name will be used throughout the application
     - Examples: "Smith Construction", "ABC Builders", "Joe's Contracting"

2. **Create the Organization**
   - Tap **Create Organization**
   - The system creates your organization and sets you as the administrator
   - You'll see a success message when complete

3. **Automatic Setup**
   - You're automatically set as an organization administrator
   - You gain access to all admin features, including team management
   - You're redirected to the Projects Home Screen to begin setup

**Important Notes:**

- Organization names should be unique and descriptive
- You are the owner and first administrator of the organization
- Only organization administrators can invite other users and manage team roles

### Next Steps After Organization Creation

Once your organization is created:

1. **Set up your configuration** - Define categories, cost items, and templates
2. **Configure company settings** - Add your company logo, address, and contact information
3. **Invite team members** - Add other users to collaborate on projects (admins only)
4. **Create your first project** - Start tracking work and costs

## Overview

ProjectHound has two main home screens that serve as the primary navigation hubs:

1. **Projects Home Screen** - Your main dashboard for viewing and managing all projects
2. **Configuration Home Screen** - The central location for managing company settings, categories, templates, vendors, customers, and QuickBooks setup

This guide explains how to use both home screens and their associated features.

## Projects Home Screen

The Projects Home Screen is the main landing page when you open ProjectHound. It displays all your projects and provides quick access to project details, notes, photos, receipts, bills, and change orders.

### Accessing the Projects Home Screen

- The Projects Home Screen appears automatically after signing in
- To return to it from any screen, tap the back button until you reach the home screen

### Screen Layout

**When you have no projects yet:**

- A welcome message appears: "Welcome to ProjectHound!"
- You'll see options to either import default cost codes or set up your own configuration
- Two buttons are available:
  - **Import Defaults** - Loads pre-configured cost codes for basic home building
  - **Go To Configuration** - Takes you to the Configuration screen to set up custom codes

**When you have projects:**

- Projects are displayed in a scrollable grid layout
- Each project card shows:
  - Project thumbnail image (if set)
  - Project name
  - Owner name
  - Location
  - Start date and planned finish date
  - Bid price and amount spent
  - Owner contact information (address, phone, email)
  - Favorite indicator (heart icon)

### Quick Actions on Projects

Each project card has a button bar at the bottom with six quick action buttons:

1. **Like (Heart Icon)**
   - Tap to mark/unmark a project as a favorite
   - Favorited projects are automatically tracked for quick access
   - The heart icon fills in when a project is favorited

2. **Notes**
   - Opens the project notes screen
   - Create task-based to-do items for the project
   - Mark notes as completed

3. **Photos**
   - Opens the project photo gallery
   - View, capture, and manage project photos and videos
   - Set project thumbnails
   - Export and share media

4. **Receipts**
   - Opens the receipts screen
   - Track expenses with receipt images
   - Use AI to extract line items from receipts
   - Associate costs with specific cost items
   - When QuickBooks is connected, receipt line items can be assigned to different projects
   - If a receipt contains line items for multiple projects, the receipt is copied to those other projects so each project can track its own portion

5. **Bills**
   - Opens the bills screen
   - Manage vendor bills
   - Track bill line items
   - Link bills to project costs
   - If QuickBooks is connected, bills are sent to QuickBooks
   - If QuickBooks marks a bill as paid, a paid status badge appears in ProjectHound

6. **Changes**
   - Opens the change orders screen
   - Create and manage project change orders
   - Generate professional change order documents
   - Track approval status

### Opening a Project

To view full project details:

- Tap anywhere on a project card (outside the action buttons)
- This opens the detailed project view with complete budget tracking and cost item breakdowns

### Main Menu (Top-Right)

Tap the **menu icon** (three horizontal lines) in the top-right corner to access:

#### Always Available:

- **Company Settings** - Edit company name, address, logo, and contact information
- **Configuration** - Navigate to the Configuration Home Screen
- **Logout** - Sign out of the application

#### When Projects Exist:

- **Add Project** - Create a new project (only appears after initial configuration is complete)

#### For Organization Admins:

- **Manage Team** - Invite team members and manage user roles (only visible to organization administrators)

## Add Project

Create a new project with predefined templates and cost items.

### Accessing Add Project

1. From the Projects Home Screen, tap the **menu icon** (three lines) in the top-right
2. Select **Add Project**

Note: This option only appears after you've set up at least one cost category in Configuration.

### Project Information Fields

**Required Fields:**

- **Project Name** - The name of the project
- **Project Template** - Select which template to use for seeding cost items

**Optional Fields:**

- **Location** - Street address or description
- **Customer** - Select using the CustomerPicker search/list control
- **Owner Name** - Client or property owner name
- **Owner Contact Information:**
  - Address and Address 2
  - City, State, Zip
  - Phone number
  - Email address
- **Bid Price** - The quoted or estimated project cost
- **Start Date** - When the project begins
- **Planned Finish Date** - Expected completion date (defaults to 9 months from start)
- **Project Status** - Active, On-hold, or Completed

### CustomerPicker in Add/Edit Project

- The project flow now uses **CustomerPicker** for customer selection
- You can search and select from existing active customers
- You can add a new customer directly from the picker
- If QuickBooks is connected, adding a customer from the picker also creates the customer in QuickBooks and stores the linked accounting ID

### Project Templates

Templates define which cost items are included in a project. When you select a template:

- All associated cost items are automatically added to the project
- Each cost item includes the cost code, description, and bid amount
- You can modify these after project creation

### Creating the Project

1. Fill in the project name (required)
2. Select a template from the dropdown (required)
3. Fill in any additional information you want to track
4. Tap **Create Project** at the bottom
5. The new project appears on the Projects Home Screen

## Project Details Screen

Tapping on a project card (outside the action buttons) opens the Project Details screen — the financial command center for a single project.

### Screen Layout

**Header:**

- Project name
- Total quoted price (original bid + sum of all approved change orders)
- QuickBooks logo (if QuickBooks is connected)
- Three-dot menu for project management actions

**Financial Summary:**

- **Quoted Price** – The project bid price including approved change orders
- **Spent** – Total actual costs entered so far
- **Balance** – Remaining budget (Quoted − Spent)
- **Estimated Costs** – Sum of per-item cost estimates
- **Completion Summary** – Number of work items marked complete, profit/loss on completed work (shown in red if negative)

**Cost Summary Table:**

Lists all cost categories with three columns:
- **Estimate $** – Planned budget for the category
- **Spent $** – Actual costs posted to that category
- **Balance $** – Remaining (Estimate − Spent)

Each row is tappable and opens a detail view for that category's work items.

**Bottom Action Bar:**

- **Notes** – Open project notes/tasks
- **Photos** – Open the project photo gallery
- **Receipts** – Open the receipts list
- **Bills** – Open the bills/invoices list
- **Changes** – Open the change orders list

### Project Menu (Three-Dot Icon)

Tap the three-dot icon in the header to access project management options:

- **Edit Project Info** – Change the project name, dates, location, customer, bid price, and GPS coordinates
- **Add Cost Category** – Add an existing category (from your configured list) to this project (only shown if unused categories are available)
- **Set Estimate Costs** – Bulk-set estimated cost amounts across work items (only shown if work items exist)
- **Delete Project** – Permanently delete the project; requires typing a confirmation phrase to proceed
- **Cost Item Cleanup** – Remove work items that have no estimate and no actual costs
- **Export Cost Items** – Export the project's cost data to a CSV file and share it

## Edit Project Screen

Access this screen from the Project Details three-dot menu → **Edit Project Info**.

### Fields

| Field | Description |
|-------|-------------|
| **Project Name** | The full name of the project |
| **Abbreviation** | Short uppercase identifier (max 10 alphanumeric characters); auto-converted to uppercase |
| **Initial Quoted Price** | The original bid price (before change orders) |
| **Location** | Street address or description of the job site |
| **Customer** | Search and select from your customer list using CustomerPicker |
| **Start Date** | Project start date (tap to open date picker) |
| **Planned Finish Date** | Expected completion date (tap to open date picker) |
| **GPS Coordinates** | Latitude/longitude shown in decimal degrees |

**GPS Actions:**

- **Use Current** – Sets GPS coordinates to your device's current location (requires location permission)
- **Select on Map** – Opens a map screen to tap and set the project location

### Saving

All fields auto-save when you tap away from them (blur). Tap the back button to return to Project Details; all changes are already saved.

## Cost Items (Work Items)

Within the Project Details cost summary table, tap any category row to open its cost item list.

### Cost Items List Screen

Displays all work items within the selected category:

- **Item Code** – Unique identifier for the cost item
- **Description** – Name of the work item
- **Estimate** – Budget amount set for this item
- **Spent** – Actual cost posted against this item
- **Balance** – Remaining (Estimate − Spent)
- **Complete indicator** – Checkmark if the item is marked complete

Tap an item to view its detailed breakdown. Use the **Add Cost Items** button to add pre-configured cost items from your category definition.

### Cost Item Detail Screen

Shows the full financial history for a single work item:

- Total estimated amount
- Total spent
- List of individual transactions (receipts, bills, manual entries) that have been charged to this item

## Project Receipts

Receipts track material and supply expenses. Access by tapping **Receipts** on the project action bar.

### Receipts List Screen

**Adding Receipts:**

- **Add Photo** – Opens the camera to capture an image of a physical receipt. If multiple QuickBooks payment accounts are configured, you will be prompted to select which account to charge. For checking accounts, you can enter a check number.
- **Add Manual** – Opens a blank receipt form for manual data entry without a photo.

**Filtering Receipts:**

- Without QuickBooks: A text filter bar lets you search receipts by vendor name (case-insensitive, with a clear button).
- With QuickBooks: A toggle switch lets you view **All** receipts or only those **Not posted to QuickBooks**.

**Receipt List Items:**

Each receipt in the list displays:
- Vendor name
- Date
- Total amount
- Posting status (if QuickBooks is connected)

Swipe a receipt item to **Delete** it.

### Receipt Details Screen

Tap a receipt in the list to open its details.

**Summary Box:**

- Thumbnail of the receipt image (tap to view full image)
- Vendor name
- Receipt date
- Total amount
- **Edit Details** button – Opens the receipt edit screen
- **Show Image** button – Opens the full-size receipt photo

**Line Items Section:**

Lists all cost items charged to this receipt:
- Amount
- Description
- Work item assignment
- Swipe an item to delete or edit it

**Status Warnings:**

- ⚠ Items with no work item assignment
- ⚠ Items assigned to a different project
- ⚠ Line item total does not match the receipt total

**Actions:**

- **Add Line Item** – Navigate to the add line item screen
- **Load from Photo** – If no line items exist, tap to request AI processing of the receipt image to automatically extract line items
- **Save Receipt to QuickBooks** / **Update Receipt in QuickBooks** – Sync the receipt to QuickBooks when all conditions are met (see QuickBooks Sync Requirements below)

**QuickBooks Sync Requirements:**

A receipt can only be synced to QuickBooks when:

1. QuickBooks is connected
2. The receipt has at least one line item
3. The total amount is greater than $0
4. A payment account is selected
5. The vendor is linked to a QuickBooks vendor
6. All line items have a work item assignment
7. At least one line item is assigned to the current project
8. The sum of line items matches the receipt total

### Receipt Edit Screen

Edit a receipt's header information.

| Field | Description |
|-------|-------------|
| **Date** | Receipt date (tap to open date picker) |
| **Amount** | Total receipt amount |
| **Vendor/Merchant** | Select from your vendor list using VendorPicker |
| **Description** | Optional memo or description |
| **Payment Account** | (QuickBooks only) Which account to charge |
| **Check #** | (Checking accounts only) Optional check number |

All fields auto-save when you tap away from them.

### Add Line Item Screen

Manually add a cost line item to a receipt.

| Field | Description |
|-------|-------------|
| **Amount** | Dollar amount for this line item |
| **Description** | What was purchased |
| **Work Item** | Which project cost item to charge |
| **Project** | Which project (used for multi-project receipts) |

**AI Processing:** If a receipt photo is available and no line items have been added yet, tap **Load from Photo** on the Receipt Details screen to have AI analyze the image and automatically create line items. You can then review and edit the AI-suggested items.

## Project Bills (Invoices)

Bills track vendor invoices that need to be paid. Access by tapping **Bills** on the project action bar.

### Bills List Screen

**Adding Bills:**

- **Add Photo** – Opens the camera to capture an image of a vendor invoice or bill.
- **Add Manual** – Opens a blank bill form for manual data entry.

**Bill List Items:**

Each bill displays:
- Vendor name
- Invoice number
- Due date
- Total amount
- Paid status badge (updated from QuickBooks when connected)

Swipe a bill item to **Delete** it.

The app checks QuickBooks for payment status updates automatically when this screen loads (if QuickBooks is connected).

### Bill Details Screen

Tap a bill in the list to view its details.

**Summary Box:**

- Thumbnail of the bill image
- Vendor name
- Invoice number
- Invoice date and due date
- Total amount
- Paid/Unpaid status badge
- **Edit Details** button
- **Show Image** button

**Line Items Section:**

Lists all cost items on this bill with swipe-to-edit/delete.

**Actions:**

- **Add Line Item** – Add a cost item to the bill
- **Load from Photo** – Request AI extraction from the bill image (when no items exist)
- **Add Bill to QuickBooks** / **Update Bill in QuickBooks** – Sync to QuickBooks when all conditions are met

**QuickBooks Sync Requirements:**

A bill can be synced to QuickBooks when:

1. QuickBooks is connected
2. The bill has at least one line item
3. The total amount is greater than $0
4. A vendor is selected
5. All line items have a work item assignment
6. The sum of line items matches the bill total

### Bill Edit Screen

Edit a bill's header information.

| Field | Description |
|-------|-------------|
| **Date** | Bill/invoice date (tap to open date picker) |
| **Due Date** | Payment due date (defaults to 30 days from bill date) |
| **Amount** | Total bill amount |
| **Invoice Number** | Vendor's invoice number |
| **Vendor** | Select from vendor list using VendorPicker |
| **Description** | Optional memo |
| **Payment Account** | (QuickBooks only) Account to use for payment |

## Project Change Orders

Change orders document approved additions to the original project scope. Access by tapping **Changes** on the project action bar.

### Change Orders List Screen

Displays all change orders for the project.

**Header Information:**

- **Total Approved** – Sum of all change orders with "Approved" status
- **Add Change Order** button (appears when both company settings and customer information are complete)

**Before Creating Change Orders:**

You must have complete information in two places before you can create a change order:

1. **Company Settings** – Company name, address, phone, and email must be filled in
2. **Customer Information** – The project must have a customer with a name and email address

If either is incomplete, the screen shows a message explaining what needs to be configured, with a button to navigate directly to that settings screen.

**Change Order Status Icons:**

- 💡 **Draft** – Being prepared, not yet sent
- 👓 **Pending Approval** – Sent to customer, awaiting response
- ✓ **Approved** – Customer has approved
- ✗ **Cancelled** – Cancelled or rejected

**Change Order List Items:**

Each change order displays the title, status icon, and quoted amount. Swipe to delete.

### Change Order Details Screen

Tap a change order to view its full details.

**Header Section:**

- Status icon
- Change order title
- Accounting ID (assigned after sending)
- Description
- Quoted price

**Line Items List:**

Lists all items included in the change order:
- Item description
- Cost amount

Footer shows the total.

**Three-Dot Menu:**

- **Edit Change Order Info** – Modify the title, description, and quoted price
- **Add Change Order Item** – Add a new line item (description, amount, associated work item)
- **Set Change Order Status** – Manually set the status (Draft, Pending Approval, Approved, Cancelled)

**Sending for Approval:**

When the change order has items and a total greater than $0, a **Send for Approval** (or **Resend**) button appears. Tapping it:

1. Generates a professional HTML document using your company branding
2. Sends the document to the customer's email address with an acceptance link
3. The acceptance link is valid for 48 hours
4. The change order status is updated to "Pending Approval"

## Project Photos

Manage project photos and videos. Access by tapping **Photos** on the project action bar.

### Photos Screen

Displays all media captured or imported for the project in a gallery view.

**Capturing Media:**

- Tap **Take Picture/Video** to launch the camera
- Supports both photos and videos
- Thumbnails are generated automatically
- The media is stored in the app and associated with the project

**Header Menu:**

- **Import Photos** – Select multiple photos from your device's photo library to add to the project
- **Manage Photo Access** – Control which photos can be shared publicly (useful for customer-facing reports)

**Viewing Media:**

- Tap a photo to view it full-screen with zoom support
- Tap a video to play it in the video player

**Upload Indicator:**

A "Uploading photo..." spinner appears while media is being processed and synced to the server.

## Project Notes

Track project tasks and observations. Access by tapping **Notes** on the project action bar.

### Notes Screen

**Adding a Note:**

1. Type your note text in the input field at the top (multi-line, up to 100 characters)
2. Tap **Add Note**
3. The note appears in the list immediately

**Editing a Note:**

- Swipe a note item to reveal the **Edit** action
- The input field switches to edit mode showing the note's current text
- Modify the text and tap **Save**, or tap **Cancel** to discard changes

**Completing a Note:**

- Swipe a note item to reveal the **Complete** / **Incomplete** toggle
- Completed notes appear at the bottom of the list, visually distinguished

**Deleting a Note:**

- Swipe a note item to reveal the **Delete** action

Notes are sorted so incomplete items appear first, with completed items at the bottom.

## App Settings (Company Settings)

Configure your company information that appears on generated documents. Access from the Projects Home Screen menu → **Company Settings**.

### Available Settings

**Company Information:**

| Field | Description |
|-------|-------------|
| **Company Name** | Your business name |
| **Address** | Street address (multi-line) |
| **City** | City name |
| **State** | State abbreviation |
| **Zip** | ZIP/Postal code |
| **Phone** | Business phone number |
| **Email** | Business email address |
| **Website** | Company website URL |

**Branding:**

- **Company Logo** – Tap the logo area to select an image from your device. The logo is automatically resized and appears on generated change order documents.

### Saving

All fields auto-save when you tap away from them. Tap **Save** at the bottom to explicitly confirm all changes and return to the previous screen.

## Configuration Home Screen

The Configuration Home Screen is your central hub for managing the building blocks of your project tracking system, plus QuickBooks integration and company defaults.

### Accessing Configuration

**From the Projects Home Screen:**

1. Tap the **menu icon** (three lines) in the top-right
2. Select **Configuration**

**From the welcome screen (first time setup):**

- Tap **Go To Configuration** button

### Screen Layout

The Configuration screen displays:

- App version number at the top
- A **Connect to QuickBooks** action when QuickBooks is not connected
- Core configuration sections (detailed below)
- Additional QuickBooks options when connected
- A menu icon in the top-right for import/export operations

### Configuration Sections

#### 1. Categories

**Purpose:** Define the major cost categories for tracking project costs (e.g., Foundation, Framing, Electrical, Plumbing).

**What you can do:**

- View all cost categories
- Add new categories with custom codes and names
- Edit existing categories
- Add cost items under each category
- Import default categories for home building projects

**Accessing:** Tap **Categories** → "Manage cost categories"

#### 2. Project Templates

**Purpose:** Create reusable templates that define which cost items are included in different types of projects.

**What you can do:**

- View all project templates
- Create new templates
- Add/remove cost items from templates
- Edit template names and descriptions
- Use templates when creating new projects

**Accessing:** Tap **Project Templates** → "Define Project-specific Cost Items"

#### 3. Vendors

**Purpose:** Maintain a list of vendors where you purchase materials (e.g., hardware stores, lumber yards, material suppliers).

**What you can do:**

- Add new vendors with contact information
- Edit vendor details (name, address, phone, notes)
- Import vendors from CSV files
- Export vendors to CSV files
- Associate vendors with receipts and bills
- Link an existing vendor to a QuickBooks vendor from the vendor edit screen
- Add a vendor to QuickBooks from the vendor edit screen

**QuickBooks-linked vendor behavior:**

- In receipt/bill flows, **VendorPicker** is used to select vendors
- When QuickBooks is connected, vendors shown for QuickBooks posting must be linked to a QuickBooks `accountingId`
- You can add a new vendor directly from VendorPicker; when QuickBooks is connected, the vendor is also created in QuickBooks

**Accessing:** Tap **Vendors** → "Add and Edit Vendors"

#### 4. Customers

**Purpose:** Maintain a list of project customers/owners used for project assignment and QuickBooks project/customer mapping.

**What you can do:**

- Add new customers with contact details
- Edit customer details
- Import customers from CSV files (when QuickBooks is not connected)
- Link an existing customer to a QuickBooks customer from the customer edit screen
- Add a customer to QuickBooks from the customer edit screen

**Accessing:** Tap **Customers** → "Add and Edit Customers"

#### 5. QuickBooks Accounts (Visible when QuickBooks is connected)

**Purpose:** Define which QuickBooks accounts are used for syncing receipts and bills.

**What you can do:**

- View imported QuickBooks accounts
- Configure default expense and payment account usage for accounting sync

**Accessing:** Tap **QuickBooks Accounts** → "Define accounts to use"

### Configuration Menu (Top-Right)

Tap the **menu icon** (three horizontal lines) in the top-right to access data management tools:

#### Always Available (Power Users):

- **Import Configuration Data** - Import categories, cost items, and templates from a JSON file
- **Export Configuration Data** - Export all categories, cost items, and templates to a JSON file (when configuration data exists)

#### When QuickBooks Is Not Connected:

- **Import Vendors** - Import vendors from a CSV file
- **Export Vendors** - Export all vendor data to a CSV file (only appears when vendors exist)
- **Import Customers from CSV** - Import customers from a CSV file

#### When QuickBooks Is Connected:

- **Load Company Info from QuickBooks** - Pull company profile defaults from QuickBooks
- **Get Vendors from QuickBooks** - Import/sync vendors from QuickBooks
- **Get Customers from QuickBooks** - Import/sync customers from QuickBooks
- **Get Accounts from QuickBooks** - Import/sync chart of accounts used by QuickBooks account mapping
- **Disconnect from QuickBooks** - Disconnect your QuickBooks integration

#### Legacy/Offline Data Tools:

- CSV import/export options are context-sensitive and may be hidden while QuickBooks-connected sync options are active

See the [Vendor CSV Import/Export documentation](VENDOR_CSV_IMPORT_EXPORT.md) for detailed information on CSV import/export.

### Initial Setup Workflow

When using ProjectHound for the first time:

1. **Set Up Categories:**
   - Choose to import defaults or create your own
   - If importing defaults, select from predefined category sets (e.g., "Basic Home Building")
   - If creating custom, add categories one by one with codes and names

2. **Add Cost Items to Categories:**
   - For each category, add specific cost items (e.g., under "Foundation": Footings, Concrete, Rebar)
   - Assign each cost item a unique code and name
   - These cost items will be used for cost tracking

3. **Create Project Templates:**
   - Create at least one template (e.g., "Standard Home", "Remodel", "Commercial Build")
   - Add the cost items that apply to each type of project
   - Templates speed up project creation by pre-selecting cost items

4. **Add Vendors and Customers (Optional):**
   - Add frequently used vendors and customers
   - This makes it faster to assign costs to receipts/bills and map projects/customers for QuickBooks

5. **Connect QuickBooks (Optional but recommended for accounting sync):**
   - Use **Connect to QuickBooks** on the Configuration screen
   - After connecting, import company info, vendors, customers, and accounts
   - Configure QuickBooks account defaults before posting receipts/bills

## Team Management (Organization Admins Only)

Invite team members to collaborate on projects and manage user roles within your organization.

### Accessing Team Management

**Prerequisites:**

- You must be an organization administrator
- The feature only appears if you have admin permissions

**To access:**

1. From the Projects Home Screen, tap the **menu icon** (three lines)
2. Select **Manage Team**

### Inviting Users

Organization administrators can invite other users to join the team and collaborate on projects.

**To invite a new team member:**

1. **Enter the email address**
   - Type the user's email address in the email field
   - Ensure the email is correct before sending

2. **Send the invitation**
   - Tap **Send Invitation**
   - An invitation email is sent to the user
   - The invitation includes a link to join your organization

3. **Invitation Status Messages:**
   - **Success:** "Invitation sent successfully" - The email was sent
   - **Already exists:** "User is already a member" - This person is already in your organization
   - **Error:** Displays specific error message if something went wrong

**What Happens After Sending an Invitation:**

The invited user receives an email with instructions to join your organization. They must:

1. **Click the invitation link** in the email
2. **Sign up for ProjectHound** (if they don't have an account):
   - Enter their email address and create a password
   - Receive and enter a verification code (sent to their email)
   - Check spam/junk folder if the code doesn't arrive quickly
3. **Join the organization** - After verification, they automatically join your organization
4. **Access organization data** - They can now view and work on organization projects

**Important Notes:**

- Invited users start as regular members (not administrators)
- You can promote members to administrators after they join
- Invitations are sent via email through the Clerk authentication system
- Users must verify their email before accessing the organization
- If a user already has a ProjectHound account, they still need to accept the invitation to join your organization

### Managing Existing Members

The screen displays a list of all current organization members, showing:

- User name
- Email address
- Current role (Member or Admin)
- Role management buttons

### Changing Member Roles

**To promote a member to admin:**

1. Find the member in the list
2. Tap **Make Admin** button next to their name
3. Confirm the action
4. The member's role updates to "org:admin"
5. They gain access to admin features like Team Management

**To remove admin privileges:**

1. Find the admin in the list
2. Tap **Remove Admin** button
3. Confirm the action
4. The user's role reverts to regular member ("org:member")

**Important Notes:**

- You cannot remove your own admin status if you're the last admin
- At least one admin must remain in the organization
- Role changes take effect immediately

### Member Removal

**To remove a member from the organization:**

1. Find the member in the list
2. Tap **Remove** button next to their name
3. Confirm the removal
4. The member is immediately removed from the organization
5. They lose access to all organization projects and data

**Restrictions:**

- You cannot remove yourself from the organization
- Organization owners (the person who created the organization) cannot be removed

## Navigation Patterns

### Common Navigation Flows

**From Projects to Configuration:**

1. Projects Home → Menu → Configuration
2. Make configuration changes
3. Back button → Returns to Projects Home

**Adding a Project:**

1. Projects Home → Menu → Add Project
2. Fill in project details
3. Tap Create Project → Returns to Projects Home with new project visible

**Managing Data:**

1. Projects Home → Menu → Configuration
2. Configuration Home → Menu → Export/Import options
3. Select desired operation
4. Complete the export/import
5. Back to Configuration Home

### Back Button Behavior

The back button in the top-left corner:

- Saves any pending changes (auto-save)
- Returns to the previous screen
- Follows the navigation history

### Bottom Tab Navigation

When viewing projects, you may see tabs at the bottom for:

- Projects (home)
- Other views (depending on app configuration)

## Loading States

### First Time Load

When opening the app for the first time:

1. "Loading..." appears briefly
2. If no configuration exists: Welcome screen with import/setup options
3. If configuration exists: Projects Home Screen loads

### Configuration Check

The app verifies minimum configuration requirements:

- At least one cost category must exist with cost items added to it
- At least one project template must exist
- If requirements aren't met, the welcome screen appears

### Data Synchronization

The app automatically synchronizes data:

- Real-time sync across multiple devices
- Offline changes sync when connection returns
- Loading indicator appears during heavy sync operations

## Tips and Best Practices

### Getting Started

1. Start with importing default categories if you're building homes
2. Review and customize the imported categories to match your needs
3. Create 2-3 project templates for your common project types
4. Add your most-used vendors and customers before creating projects

### Project Organization

1. Use favorites (heart icon) for active projects you check frequently
2. Set project thumbnails from the Photos screen to make projects easier to identify
3. Keep owner contact information complete for easy reference

### Configuration Management

1. Export your configuration after initial setup as a backup
2. Use templates to maintain consistency across similar projects
3. Regularly review and clean up unused cost items and categories

### Team Collaboration

1. Invite team members early so they can access project data
2. Give admin role to trusted team leads who need to manage users
3. Keep the member list current by removing users who leave

### Data Management

1. Export vendors and customers periodically as backup
2. Use CSV import to bulk-add vendors/customers from other systems
3. Export configuration data before making major changes

## Troubleshooting

### "No Projects Found" Message

**Cause:** No minimum configuration exists yet

**Solution:**

1. Tap **Import Defaults** to use pre-configured categories, OR
2. Tap **Go To Configuration** to set up custom categories and templates

### Add Project Not Available

**Cause:** Configuration requirements not met

**Solution:**

1. Navigate to Configuration
2. Add at least one cost category with cost items
3. Create at least one project template
4. Return to Projects Home — Add Project will now appear

### Can't See Manage Team Option

**Cause:** You're not an organization admin

**Solution:**

- Ask your organization administrator to promote you to admin role
- This option is only visible to users with admin permissions

### Configuration Menu Options Not Showing

**Cause:** Menu options are contextual based on existing data

**Solution:**

- Export options only appear when data exists to export
- Add some data first (categories, vendors, customers)
- The export options will then appear

### Changes Not Saving

**Note:** The app uses auto-save — changes save automatically when you:

- Tap outside a field (blur)
- Press the back button
- Navigate to another screen

If changes seem lost, ensure you tap outside input fields before navigating away from a screen.

### Receipt or Bill Won't Sync to QuickBooks

**Cause:** One or more sync requirements are not met

**Checklist:**

1. QuickBooks is connected (check Configuration screen)
2. The receipt/bill has at least one line item
3. The total amount is greater than $0
4. A payment account is selected (receipts only)
5. The vendor is selected and linked to a QuickBooks vendor
6. All line items have a work item assignment
7. At least one line item is assigned to the current project (receipts)
8. The sum of line items matches the header total

The Receipt/Bill Details screen shows warnings for each unmet condition.

### Can't Send Change Order for Approval

**Cause:** Missing company or customer information

**Solution:**

1. Go to **Company Settings** (Projects menu → Company Settings) and fill in: Company Name, Address, Phone, and Email
2. Go to **Edit Project** and assign a customer; ensure the customer has a name and email address
3. Return to Change Orders — the **Add Change Order** and send buttons will now be available

### Change Order Not Marked as Approved

**Cause:** The acceptance link may have expired, or the customer email wasn't received

**Solution:**

- Open the Change Order Details screen and tap **Resend** to send a new approval email with a fresh 48-hour acceptance link
- Manually set the status to Approved via the three-dot menu → **Set Change Order Status** if the customer verbally approved

### AI Photo Processing Not Working

**Cause:** The receipt/bill must have a photo attached before AI extraction can be used

**Solution:**

1. Ensure the receipt or bill was created with **Add Photo** (not **Add Manual**)
2. Wait for any in-progress uploads to complete (spinner indicator)
3. Open the Receipt/Bill Details screen and tap **Load from Photo**

### Verification Code Not Received

**Cause:** Email delivery delay or spam filtering

**Solution:**

1. Wait a few minutes and check your email again
2. Check your spam or junk mail folder
3. If the code has expired, return to the sign-up screen and restart registration to receive a new code

## Related Documentation

- [Vendor CSV Import/Export](VENDOR_CSV_IMPORT_EXPORT.md) - Detailed CSV format and import/export procedures
- [Auto-Save Implementation](AUTO_SAVE_IMPLEMENTATION.md) - Technical details on how auto-save works
- [README](../README.md) - Full application overview and technical stack

## Summary

ProjectHound screens are organized into two main areas:

**Project Management:**

- **Projects Home** — Your dashboard; view all projects with quick-action buttons
- **Project Details** — Financial overview with cost tracking by category
- **Edit Project** — Modify project name, dates, location, customer, and bid price
- **Cost Items** — Drill into individual work items and their financial history
- **Receipts** — Track material and supply expenses; sync to QuickBooks
- **Bills** — Manage vendor invoices; sync to QuickBooks
- **Change Orders** — Document and send scope additions for customer approval
- **Photos** — Capture and organize project media
- **Notes** — Create and track project tasks and observations

**Configuration & Settings:**

- **Configuration Home** — Hub for categories, templates, vendors, customers, and QuickBooks
- **App Settings / Company Settings** — Business information used on generated documents
- **Team Management** — Invite users and manage organization roles (admins only)

Master these screens to efficiently manage your construction projects from start to finish.
