import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  arrayUnion,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Notification, NotificationContextValue } from '../types/notification';
import { useAuth } from './AuthContext';

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
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
        snapshot.forEach((doc) => {
          notificationList.push({
            id: doc.id,
            ...doc.data(),
          } as Notification);
        });
        setNotifications(notificationList);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching notifications:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  const sendNotification = async (title: string, message: string) => {
    if (!user) {
      throw new Error('User must be authenticated to send notifications');
    }

    try {
      const notificationData = {
        title,
        message,
        senderName: `${user.firstName} ${user.lastName}`,
        senderId: user.uid,
        timestamp: Timestamp.now(),
        readBy: [],
      };

      await addDoc(collection(db, 'notifications'), notificationData);
      
      // TODO: Trigger push notification to all users via FCM
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

  const value: NotificationContextValue = {
    notifications,
    loading,
    sendNotification,
    markAsRead,
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
