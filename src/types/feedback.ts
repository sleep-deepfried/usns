import { Timestamp } from 'firebase/firestore';

export interface Feedback {
  id: string;
  notificationId: string;
  studentId: string;
  studentName: string;
  message: string;
  timestamp: Timestamp;
}

export interface FeedbackContextValue {
  feedback: Feedback[];
  loading: boolean;
  sendFeedback: (notificationId: string, message: string) => Promise<void>;
  deleteFeedback: (feedbackId: string) => Promise<void>;
}
