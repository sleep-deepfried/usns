import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Feedback, FeedbackContextValue } from '../types/feedback';
import { useAuth } from './AuthContext';
import { getPermissions } from '../utils/permissions';

const FeedbackContext = createContext<FeedbackContextValue | undefined>(undefined);

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const sendFeedback = async (notificationId: string, message: string) => {
    if (!user) {
      throw new Error('User must be authenticated to send feedback');
    }

    const permissions = getPermissions(user.role);
    if (!permissions.canSendFeedback) {
      throw new Error('You do not have permission to send feedback');
    }

    try {
      const feedbackData = {
        notificationId,
        studentId: user.uid,
        studentName: `${user.firstName} ${user.lastName}`,
        message,
        timestamp: Timestamp.now(),
      };

      await addDoc(collection(db, 'feedback'), feedbackData);
    } catch (error: any) {
      console.error('Error sending feedback:', error);
      throw new Error(error.message || 'Failed to send feedback');
    }
  };

  const deleteFeedback = async (feedbackId: string) => {
    if (!user) {
      throw new Error('User must be authenticated');
    }

    const permissions = getPermissions(user.role);
    if (!permissions.canDeleteFeedback) {
      throw new Error('You do not have permission to delete feedback');
    }

    try {
      await deleteDoc(doc(db, 'feedback', feedbackId));
    } catch (error: any) {
      console.error('Error deleting feedback:', error);
      throw new Error(error.message || 'Failed to delete feedback');
    }
  };

  const value: FeedbackContextValue = {
    feedback,
    loading,
    sendFeedback,
    deleteFeedback,
  };

  return (
    <FeedbackContext.Provider value={value}>
      {children}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (context === undefined) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
}

// Hook to fetch feedback for a specific notification
export function useFeedbackForNotification(notificationId: string) {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !notificationId) {
      setFeedback([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'feedback'),
      where('notificationId', '==', notificationId),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const feedbackList: Feedback[] = [];
        snapshot.forEach((doc) => {
          feedbackList.push({
            id: doc.id,
            ...doc.data(),
          } as Feedback);
        });
        setFeedback(feedbackList);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching feedback:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user, notificationId]);

  return { feedback, loading };
}
