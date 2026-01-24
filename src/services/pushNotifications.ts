import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { doc, updateDoc, addDoc, collection, serverTimestamp, getDoc, getDocs } from 'firebase/firestore';
import Constants from 'expo-constants';
import { db } from '../config/firebase';

// Check if we're running in Expo Go
const isExpoGo = Constants.executionEnvironment === 'storeClient';

// Configure how notifications appear when app is in foreground
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
  if (isExpoGo) {
    console.log('Push notifications not available in Expo Go. Build an APK for full functionality.');
    return null;
  }

  let token: string | null = null;

  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission not granted');
    return null;
  }

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

// Send local notification
export async function sendLocalNotification(title: string, body: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
    },
    trigger: null,
  });
}

// Send push notification to a specific user via Expo's push service
export async function sendPushNotificationToUser(
  targetUserId: string,
  title: string,
  body: string
) {
  try {
    // Get user's push token from Firestore
    const userDoc = await getDoc(doc(db, 'users', targetUserId));
    if (!userDoc.exists()) {
      console.log('User not found:', targetUserId);
      return;
    }

    const userData = userDoc.data();
    const pushToken = userData.fcmToken;

    if (!pushToken) {
      console.log('User has no push token:', targetUserId);
      return;
    }

    // Send via Expo's push service
    await sendExpoPushNotification(pushToken, title, body);
    console.log('Push notification sent to:', targetUserId);
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}

// Send push notification to all users
export async function sendPushNotificationToAll(title: string, body: string) {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const tokens: string[] = [];

    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.fcmToken) {
        tokens.push(userData.fcmToken);
      }
    });

    if (tokens.length === 0) {
      console.log('No users with push tokens found');
      return;
    }

    // Send to all tokens
    await sendExpoPushNotifications(tokens, title, body);
    console.log(`Push notification sent to ${tokens.length} users`);
  } catch (error) {
    console.error('Error sending push notifications:', error);
  }
}

// Send notification via Expo's push API
async function sendExpoPushNotification(pushToken: string, title: string, body: string) {
  const message = {
    to: pushToken,
    sound: 'default',
    title,
    body,
    data: { type: 'notification' },
  };

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
}

// Send notifications to multiple tokens
async function sendExpoPushNotifications(pushTokens: string[], title: string, body: string) {
  const messages = pushTokens.map((token) => ({
    to: token,
    sound: 'default',
    title,
    body,
    data: { type: 'notification' },
  }));

  // Expo recommends sending in batches of 100
  const chunks = [];
  for (let i = 0; i < messages.length; i += 100) {
    chunks.push(messages.slice(i, i + 100));
  }

  for (const chunk of chunks) {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chunk),
    });
  }
}

// Create notification record and send push notification
export async function createNotificationRecord(
  targetUserId: string,
  title: string,
  body: string,
  type: 'verification' | 'unverification' | 'promotion' | 'announcement'
) {
  try {
    // Save record to Firestore
    await addDoc(collection(db, 'push_notifications'), {
      targetUserId,
      title,
      body,
      type,
      sent: true,
      createdAt: serverTimestamp(),
    });

    // Send the actual push notification
    await sendPushNotificationToUser(targetUserId, title, body);

    console.log('Notification record created and sent for:', targetUserId);
  } catch (error) {
    console.error('Error creating notification record:', error);
  }
}
