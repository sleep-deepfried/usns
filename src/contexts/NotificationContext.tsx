import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  arrayUnion,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Notification, NotificationContextValue } from '../types/notification';
import { useAuth } from './AuthContext';
import { useBanner } from './BannerContext';
import { sendPushNotificationToAll } from '../services/pushNotifications';
import { getPermissions } from '../utils/permissions';

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { showBanner } = useBanner();
  const isInitialLoad = useRef(true);
  const previousNotificationIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      isInitialLoad.current = true;
      previousNotificationIds.current = new Set();
      return;
    }

    // Real-time listener for notifications ordered by timestamp descending
    const q = query(
      collection(db, 'notifications'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notificationList: Notification[] = [];
        snapshot.forEach((docSnap) => {
          notificationList.push({
            id: docSnap.id,
            ...docSnap.data(),
          } as Notification);
        });

        // Check for new notifications (not sent by current user)
        if (!isInitialLoad.current) {
          notificationList.forEach((notif) => {
            if (!previousNotificationIds.current.has(notif.id) && notif.senderId !== user.uid) {
              showBanner('📢 New Announcement', `${notif.title}`, 'info');
            }
          });
        }

        // Update previous IDs
        previousNotificationIds.current = new Set(notificationList.map((n) => n.id));
        isInitialLoad.current = false;

        setNotifications(notificationList);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching notifications:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user, showBanner]);

  const sendNotification = async (title: string, message: string) => {
    if (!user) {
      throw new Error('User must be authenticated to send notifications');
    }

    try {
      const senderName = `${user.firstName} ${user.lastName}`;
      const notificationData = {
        title,
        message,
        senderName,
        senderId: user.uid,
        timestamp: Timestamp.now(),
        readBy: [],
      };

      await addDoc(collection(db, 'notifications'), notificationData);
      
      // Send push notification to all users
      await sendPushNotificationToAll(title, `${message}\n\n- ${senderName}`);
    } catch (error: any) {
      console.error('Error sending notification:', error);
      throw new Error(error.message || 'Failed to send notification');
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!user) {
      throw new Error('User must be authenticated');
    }

    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        readBy: arrayUnion(user.uid),
      });
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      throw new Error(error.message || 'Failed to mark as read');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    if (!user) {
      throw new Error('User must be authenticated');
    }

    const permissions = getPermissions(user.role);
    if (!permissions.canDeleteNotification) {
      throw new Error('You do not have permission to delete notifications');
    }

    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      throw new Error(error.message || 'Failed to delete notification');
    }
  };

  const value: NotificationContextValue = {
    notifications,
    loading,
    sendNotification,
    markAsRead,
    deleteNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
