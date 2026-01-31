# ProjectHound

A comprehensive project management and tracking application for construction and contracting businesses, built with React Native and Expo.

## Overview

ProjectHound is a mobile-first application designed to help contractors and construction professionals manage projects, track costs, handle documentation, and streamline financial workflows. The app provides real-time data synchronization across devices and supports both iOS and Android platforms.

## Key Features

### 🏗️ Project Management

- **Project Tracking**: Create and manage multiple construction projects with detailed information including:
  - Project name, location, and owner details
  - Start dates and planned finish dates
  - Bid prices and budget tracking
  - Project status (active, on-hold, completed)
  - Geographic location with map integration
  - Favorite projects for quick access
  
- **Project Templates**: Create reusable project templates with predefined cost items to speed up project setup

- **Cost Items & Categories**: Organize project costs into customizable categories and line items with:
  - Custom codes and titles
  - Bid amounts and spent tracking
  - Completion status
  - Cost summaries by category

### 💰 Financial Management

- **Receipt Tracking**: 
  - Capture receipt images using the device camera
  - AI-powered line item extraction from receipt images
  - Associate receipt items with specific cost items
  - Track taxable vs non-taxable items with automatic tax proration
  - Vendor management and tracking
  - Receipt completion status

- **Invoice Management**:
  - Create and manage vendor invoices
  - Invoice number and date tracking
  - Line item details with cost item associations
  - Supplier information management
  - Invoice completion tracking

- **Change Orders**:
  - Create and manage project change orders
  - Multiple change order items per order
  - Status tracking (draft, approval-pending, approved, cancelled)
  - Generate professional HTML change order documents
  - Export and share change orders with clients

- **Cost Tracking**:
  - Real-time budget vs actual cost tracking
  - Detailed cost breakdowns by cost item
  - Cost summaries and reports
  - Progress visualization with completion bars

### 📸 Media Management

- **Photo & Video Capture**:
  - Built-in camera integration for photos and videos
  - Import media from device photo library
  - Video playback with full-screen modal viewer
  - Thumbnail generation for quick preview

- **Media Organization**:
  - Associate media with specific projects
  - Track creation dates and metadata
  - Batch selection and management
  - Set project thumbnails from media
  - Media deletion and cleanup

- **Export & Sharing**:
  - Create ZIP archives of project media (with automatic splitting for large files)
  - Share media files via social media and messaging apps
  - Export capabilities for photos and videos

### 📍 Location Services

- **Map Integration**:
  - Google Maps support on Android
  - Apple Maps support on iOS
  - Interactive map location picker
  - Draggable markers for precise location setting
  - Geofencing with configurable radius
  - Current device location detection

### 👥 Authentication & User Management

- **Clerk Authentication**:
  - Secure user authentication and authorization
  - Organization-based multi-tenancy
  - User session management
  - Sign out functionality

### 📝 Notes & Tasks

- **Project Notes**:
  - Create task-based notes for projects
  - Mark notes as completed
  - Track project-specific to-do items

### 🔄 Data Synchronization

- **Real-time Sync**:
  - WebSocket-based synchronization using TinyBase
  - Multi-device support with automatic conflict resolution
  - Offline-first architecture with local persistence
  - Automatic reconnection and sync on network recovery

- **Data Persistence**:
  - Local SQLite storage for offline access
  - Automatic data backup and restore
  - Mergeable stores for conflict-free synchronization

### 🎨 User Experience

- **Modern UI/UX**:
  - Dark mode and light mode support
  - Edge-to-edge design on Android
  - Smooth animations with Reanimated
  - Swipeable list items for quick actions
  - Keyboard-aware layouts
  - Haptic feedback
  - Auto-save functionality with focus management

- **Responsive Design**:
  - Optimized for phones and tablets
  - FlashList for performant scrolling
  - Adaptive layouts

### 📤 Document Generation & Sharing

- **HTML Export**:
  - Generate professional change order documents from templates
  - Mustache-based templating system
  - Custom branding and formatting

- **File Sharing**:
  - Share documents via native share sheet
  - Support for multiple file formats
  - Social media integration (Facebook, Instagram, Twitter, TikTok)

## Technical Stack

### Core Technologies

- **React Native 0.81.5**: Cross-platform mobile development
- **Expo SDK ~54.0**: Simplified development and deployment
- **TypeScript 5.9**: Type-safe development
- **TinyBase 6.7+**: Reactive data store with synchronization

### Key Dependencies

- **Authentication**: @clerk/clerk-expo
- **Navigation**: expo-router with typed routes
- **State Management**: TinyBase with mergeable stores
- **UI Components**: 
  - @shopify/flash-list for performant lists
  - react-native-reanimated for animations
  - expo-blur for visual effects
  
- **Media**: 
  - expo-camera for photo/video capture
  - expo-image-picker for gallery access
  - expo-video for video playback
  - expo-image-manipulator for image processing
  
- **Maps**: expo-maps (Google Maps + Apple Maps)
- **File Management**: 
  - expo-file-system for file operations
  - jszip for archive creation
  - expo-sharing for file sharing
  
- **Utilities**:
  - mustache for templating
  - react-native-share for social sharing
  - expo-sqlite for local database
  - reconnecting-websocket for sync

### Platform Support

- **iOS**: Full support with Apple Maps, native sharing, and platform-specific features
- **Android**: Full support with Google Maps, edge-to-edge design
- **Web**: Metro bundler with static output

## Development

### Prerequisites

- Node.js and npm
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### Available Scripts

```bash
npm start          # Start the Expo development server
npm run dev        # Start with development build
npm run android    # Run on Android
npm run ios        # Run on iOS
npm run web        # Run on web
npm test           # Run tests once
npm run test:watch # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run lint       # Run ESLint
```

For detailed testing information, see [Testing Guide](docs/TESTING_GUIDE.md).

### Environment Configuration

The app supports multiple variants:
- **Production**: `com.projecthound.app`
- **Development**: `com.projecthound.app.dev`
- **Preview**: `com.projecthound.app.preview`

## Architecture

### Data Architecture

ProjectHound uses a sophisticated data architecture with multiple specialized stores:

1. **Configuration Store**: Global configuration including categories, cost items, templates, and vendors
2. **Project List Store**: All projects for the organization
3. **Project Details Store**: Per-project data including receipts, invoices, media, notes, and change orders
4. **App Settings Store**: User preferences and application settings
5. **Upload Sync Store**: Manages file upload synchronization

All stores use TinyBase's mergeable store pattern for conflict-free replication across devices.

### Auto-Save System

The application implements a centralized FocusManager system that:
- Tracks all focusable input fields globally
- Ensures all fields are properly blurred before navigation
- Automatically saves data on blur events
- Prevents data loss during navigation

See `docs/AUTO_SAVE_IMPLEMENTATION.md` for detailed documentation.

## Permissions

The app requires the following permissions:

- **Camera**: Capture photos and videos for projects
- **Photo Library**: Import existing media
- **Location**: Set project locations
- **Media Library**: Save and access media files

## License

See LICENSE file for details.

## Version

Current version: 1.0.4
