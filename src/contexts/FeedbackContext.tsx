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
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Feedback, FeedbackReply, FeedbackContextValue } from '../types/feedback';
import { useAuth } from './AuthContext';
import { getPermissions } from '../utils/permissions';

const FeedbackContext = createContext<FeedbackContextValue | undefined>(undefined);

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [replies, setReplies] = useState<Record<string, FeedbackReply[]>>({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Fetch all feedback (for staff) or user's feedback (for students)
  useEffect(() => {
    if (!user) {
      setFeedback([]);
      setLoading(false);
      return;
    }

    const permissions = getPermissions(user.role);
    const isStaff = permissions.canViewFeedback;

    // Staff see all feedback, students see only their own
    const feedbackQuery = isStaff
      ? query(collection(db, 'feedback'), orderBy('timestamp', 'desc'))
      : query(
          collection(db, 'feedback'),
          where('studentId', '==', user.uid),
          orderBy('timestamp', 'desc')
        );

    const unsubscribe = onSnapshot(
      feedbackQuery,
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
  }, [user]);

  // Listen to replies for all feedback
  useEffect(() => {
    if (feedback.length === 0) return;

    const unsubscribes = feedback.map((fb) => {
      const repliesQuery = query(
        collection(db, 'feedback', fb.id, 'replies'),
        orderBy('createdAt', 'asc')
      );

      return onSnapshot(repliesQuery, (snapshot) => {
        const replyList: FeedbackReply[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          replyList.push({
            id: doc.id,
            feedbackId: fb.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
          } as FeedbackReply);
        });
        setReplies((prev) => ({ ...prev, [fb.id]: replyList }));
      });
    });

    return () => unsubscribes.forEach((unsub) => unsub());
  }, [feedback]);

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

  const addReply = async (feedbackId: string, message: string) => {
    if (!user) throw new Error('Must be logged in');

    const permissions = getPermissions(user.role);
    if (!permissions.canReplyToFeedback) {
      throw new Error('You do not have permission to reply to feedback');
    }

    await addDoc(collection(db, 'feedback', feedbackId, 'replies'), {
      message,
      senderId: user.uid,
      senderName: `${user.firstName} ${user.lastName}`,
      senderRole: user.role,
      createdAt: serverTimestamp(),
    });
  };

  const getReplies = (feedbackId: string) => replies[feedbackId] || [];

  const value: FeedbackContextValue = {
    feedback,
    loading,
    sendFeedback,
    deleteFeedback,
    addReply,
    getReplies,
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
