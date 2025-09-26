import { ConfigContext, ExpoConfig } from 'expo/config';

const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

const getUniqueIdentifier = () => {
  if (IS_DEV) {
    return 'com.projecthound.app.dev';
  }

  if (IS_PREVIEW) {
    return 'com.projecthound.app.preview';
  }

  return 'com.projecthound.app';
};

const getAppName = () => {
  if (IS_DEV) {
    return 'PHound (Dev)';
  }

  if (IS_PREVIEW) {
    return 'PHound (Preview)';
  }

  return 'Project Hound';
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: getAppName(),
  slug: 'jobplus',
  version: '1.0.3',
  orientation: 'default',
  icon: './assets/images/icon.png',
  scheme: 'projecthound',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    image: './assets/images/splash-icon-dark.png',
    dark: {
      image: './assets/images/splash-icon-light.png',
      backgroundColor: '#000000',
    },
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: getUniqueIdentifier(),
    icon: {
      dark: './assets/images/icon.png',
      light: './assets/images/icon.png',
      tinted: './assets/images/icon.png',
    },
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'This app needs access to your location to set your project location.',
      NSCameraUsageDescription: 'This app needs access to your camera to take photos and record videos.',
      NSPhotoLibraryUsageDescription:
        'This app needs access to your photo library to import photos into your project.',
      ITSAppUsesNonExemptEncryption: false,
      LSApplicationQueriesSchemes: ['fb', 'instagram', 'twitter', 'tiktoksharesdk'],
    },
  },
  android: {
    edgeToEdgeEnabled: true,
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      monochromeImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    permissions: [
      'android.permission.ACCESS_MEDIA_LOCATION',
      'android.permission.READ_MEDIA_IMAGES',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.RECORD_AUDIO',
      'android.permission.ACCESS_MEDIA_LOCATION',
      'android.permission.READ_MEDIA_IMAGES',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.RECORD_AUDIO',
    ],
    package: getUniqueIdentifier(),
    config: {
      googleMaps: {
        apiKey: 'AIzaSyAppcKOrkmSBjj0emmOr1zC8bpQebxe3KE',
      },
    },
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    [
      'react-native-edge-to-edge',
      {
        android: {
          parentTheme: 'Default',
          enforceNavigationBarContrast: true,
        },
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'The app accesses your photos to let you add them to your project.',
        cameraPermission: 'The app accesses your camera to let you add photos to your project.',
      },
    ],
    [
      'expo-media-library',
      {
        photosPermission: 'Allow $(PRODUCT_NAME) to access your photos.',
        savePhotosPermission: 'Allow $(PRODUCT_NAME) to save photos.',
        isAccessMediaLocationEnabled: true,
      },
    ],
    [
      'expo-document-picker',
      {
        iCloudContainerEnvironment: 'Production',
      },
    ],
    [
      'react-native-share',
      {
        ios: ['fb', 'instagram', 'twitter', 'tiktoksharesdk'],
        android: [
          'com.facebook.katana',
          'com.instagram.android',
          'com.twitter.android',
          'com.zhiliaoapp.musically',
        ],
      },
    ],
    [
      'expo-maps',
      {
        requestLocationPermission: 'true',
        locationPermission: 'Allow $(PRODUCT_NAME) to use your location.',
      },
    ],

    'expo-router',
    'expo-secure-store',
    'expo-video',
    'expo-sqlite',
    'expo-web-browser',
    'expo-asset',
    'expo-build-properties',
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: {
      origin: false,
    },
    eas: {
      projectId: '0d1178cf-26f4-4ce6-8014-1a3b95e0f7e5',
    },
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
  updates: {
    url: 'https://u.expo.dev/0d1178cf-26f4-4ce6-8014-1a3b95e0f7e5',
  },
  owner: 'bkea',
});
