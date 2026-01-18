// utils/notificationService.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async (): Promise<Notifications.NotificationBehavior> => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const registerForPushNotifications = async (
  orgId: string,
  userId: string,
  backendUrl: string,
): Promise<void> => {
  try {
    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get push notification permissions');
      return;
    }

    // Get Expo push token
    const expoPushToken = await Notifications.getExpoPushTokenAsync({
      projectId: '0d1178cf-26f4-4ce6-8014-1a3b95e0f7e5', // Get from app.json or Expo dashboard
    });

    console.log('Expo Push Token:', expoPushToken.data);

    // Register token with your backend
    const response = await fetch(`${backendUrl}/registerExpoPushToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orgId,
        userId,
        expoPushToken: expoPushToken.data,
      }),
    });

    const data = await response.json();
    if (data.success) {
      console.log('Push token registered successfully');
    } else {
      console.error('Failed to register push token:', data.message);
    }
  } catch (error) {
    console.error('Error registering for push notifications:', error);
  }
};
