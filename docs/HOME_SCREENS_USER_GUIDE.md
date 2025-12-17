# Home Screens User Guide

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
2. **Configuration Home Screen** - The central location for managing categories, templates, vendors, and suppliers

This guide explains how to use both home screens and their associated features.

## Projects Home Screen

The Projects Home Screen is the main landing page when you open ProjectHound. It displays all your projects and provides quick access to project details, notes, photos, receipts, invoices, and change orders.

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

5. **Invoices**
   - Opens the invoices screen
   - Manage vendor invoices
   - Track invoice line items
   - Link invoices to project costs

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

Create a new project with predefined templates and work items.

### Accessing Add Project

1. From the Projects Home Screen, tap the **menu icon** (three lines) in the top-right
2. Select **Add Project**

Note: This option only appears after you've set up at least one cost category in Configuration.

### Project Information Fields

**Required Fields:**
- **Project Name** - The name of the project
- **Project Template** - Select which template to use for seeding work items

**Optional Fields:**
- **Location** - Street address or description
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

## Configuration Home Screen

The Configuration Home Screen is your central hub for managing the building blocks of your project tracking system: categories, cost items, templates, vendors, and suppliers.

### Accessing Configuration

**From the Projects Home Screen:**
1. Tap the **menu icon** (three lines) in the top-right
2. Select **Configuration**

**From the welcome screen (first time setup):**
- Tap **Go To Configuration** button

### Screen Layout

The Configuration screen displays:
- App version number at the top
- Four main configuration sections (detailed below)
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

#### 3. Vendors/Merchants

**Purpose:** Maintain a list of vendors where you purchase materials (e.g., hardware stores, lumber yards, material suppliers).

**What you can do:**
- Add new vendors with contact information
- Edit vendor details (name, address, phone, notes)
- Import vendors from CSV files
- Export vendors to CSV files
- Associate vendors with receipts

**Accessing:** Tap **Vendors/Merchants** → "Add and Edit Vendors/Merchants"

#### 4. Suppliers/Contractors

**Purpose:** Maintain a list of suppliers and subcontractors who provide services (e.g., electricians, plumbers, HVAC contractors).

**What you can do:**
- Add new suppliers with contact information
- Edit supplier details (name, address, phone, notes)
- Import suppliers from CSV files
- Export suppliers to CSV files
- Associate suppliers with invoices

**Accessing:** Tap **Suppliers/Contractors** → "Add and Edit Suppliers/Contractors"

### Configuration Menu (Top-Right)

Tap the **menu icon** (three horizontal lines) in the top-right to access data management tools:

#### When Configuration Data Exists:
- **Export Configuration Data** - Export all categories, cost items, and templates to a JSON file
- **Export Vendors** - Export all vendor data to a CSV file (only appears when vendors exist)
- **Import Vendors** - Import vendors from a CSV file
- **Export Suppliers** - Export all supplier data to a CSV file (only appears when suppliers exist)
- **Import Suppliers** - Import suppliers from a CSV file

#### When No Configuration Data Exists:
- **Import Configuration Data** - Import categories, cost items, and templates from a JSON file

See the [Vendor and Supplier CSV Import/Export documentation](VENDOR_SUPPLIER_CSV_IMPORT_EXPORT.md) for detailed information on CSV import/export.

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

4. **Add Vendors and Suppliers (Optional):**
   - Add frequently used vendors and suppliers
   - This makes it faster to assign costs to receipts and invoices

## Company Settings

Manage your company information that appears on change orders and other generated documents.

### Accessing Company Settings

1. From the Projects Home Screen, tap the **menu icon** (three lines)
2. Select **Company Settings**

### Available Settings

**Company Information:**
- **Company Name** - Your business name
- **Address** - Street address (multi-line)
- **City** - City name
- **State** - State abbreviation
- **Zip** - ZIP/Postal code
- **Phone** - Business phone number
- **Email** - Business email address
- **Website** - Company website URL

**Branding:**
- **Company Logo** - Upload a logo image from your device
  - Tap the image area to select a photo
  - Image is automatically resized to 200px height
  - Logo appears on generated change order documents

### Saving Changes

1. Make your changes to any fields
2. Tap **Save** at the bottom
3. Settings are immediately applied
4. You're returned to the previous screen

### Auto-Save Note

Company Settings uses the auto-save system - if you tap the back button, your changes are automatically saved before navigating away.

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
4. Add your most-used vendors and suppliers before creating projects

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
1. Export vendors and suppliers periodically as backup
2. Use CSV import to bulk-add vendors/suppliers from other systems
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
2. Add at least one cost category
3. Create at least one project template
4. Return to Projects Home - Add Project will now appear

### Can't See Manage Team Option

**Cause:** You're not an organization admin

**Solution:**
- Ask your organization administrator to promote you to admin role
- This option is only visible to users with admin permissions

### Configuration Menu Options Not Showing

**Cause:** Menu options are contextual based on existing data

**Solution:**
- Export options only appear when data exists to export
- Add some data first (categories, vendors, suppliers)
- The export options will then appear

### Changes Not Saving

**Cause:** Navigation before blur/save completes

**Note:** The app uses auto-save - changes save automatically when you:
- Tap outside a field
- Press the back button
- Navigate to another screen

If changes seem lost, ensure you tap outside input fields before navigating.

## Related Documentation

- [Vendor and Supplier CSV Import/Export](VENDOR_SUPPLIER_CSV_IMPORT_EXPORT.md) - Detailed CSV format and import/export procedures
- [Auto-Save Implementation](AUTO_SAVE_IMPLEMENTATION.md) - Technical details on how auto-save works
- [README](../README.md) - Full application overview and technical stack

## Summary

The home screens in ProjectHound serve as your command center:
- **Projects Home** manages all your projects with quick access to details, notes, media, receipts, invoices, and changes
- **Configuration Home** manages the foundational data (categories, templates, vendors, suppliers)
- **Company Settings** maintains your business information for documents
- **Team Management** handles user access and permissions

Master these screens to efficiently manage your construction projects from start to finish.
