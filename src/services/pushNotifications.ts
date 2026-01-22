import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import Constants from 'expo-constants';
import { db } from '../config/firebase';

// Check if we're running in Expo Go (executionEnvironment is the non-deprecated way)
const isExpoGo = Constants.executionEnvironment === 'storeClient';

// Configure how notifications appear when app is in foreground
// Only set up if not in Expo Go (push notifications removed from Expo Go in SDK 53+)
if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Push notifications don't work in Expo Go on SDK 53+
  if (isExpoGo) {
    console.log('Push notifications are not supported in Expo Go. Use a development build.');
    return null;
  }

  let token: string | null = null;

  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permissions if not granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission not granted');
    return null;
  }

  // Get Expo push token
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    token = tokenData.data;
    console.log('Push token:', token);
  } catch (error) {
    console.error('Error getting push token:', error);
  }

  // Android-specific channel setup
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6200ee',
    });
  }

  return token;
}

export async function savePushToken(userId: string, token: string) {
  try {
    await updateDoc(doc(db, 'users', userId), {
      fcmToken: token,
    });
    console.log('Push token saved to Firestore');
  } catch (error) {
    console.error('Error saving push token:', error);
  }
}

// Send local notification (for testing or immediate feedback)
export async function sendLocalNotification(title: string, body: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
    },
    trigger: null, // Send immediately
  });
}

// For sending push notifications to specific users, you need a backend.
// This function creates a notification record that a Cloud Function can pick up.
export async function createNotificationRecord(
  targetUserId: string,
  title: string,
  body: string,
  type: 'verification' | 'unverification' | 'promotion' | 'announcement'
) {
  try {
    await addDoc(collection(db, 'push_notifications'), {
      targetUserId,
      title,
      body,
      type,
      sent: false,
      createdAt: serverTimestamp(),
    });
    console.log('Notification record created for:', targetUserId);
  } catch (error) {
    console.error('Error creating notification record:', error);
  }
}
