import { Timestamp } from 'firebase/firestore';

export interface Notification {
  id: string;
  title: string;
  message: string;
  senderName: string;
  senderId: string;
  timestamp: Timestamp;
  readBy: string[];
}

export interface NotificationContextValue {
  notifications: Notification[];
  loading: boolean;
  sendNotification: (title: string, message: string) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
}
