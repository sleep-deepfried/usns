import { Timestamp } from 'firebase/firestore';

export interface Feedback {
  id: string;
  notificationId: string;
  studentId: string;
  studentName: string;
  message: string;
  timestamp: Timestamp;
}

export interface FeedbackReply {
  id: string;
  feedbackId: string;
  message: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  createdAt: Date;
}

export interface FeedbackContextValue {
  feedback: Feedback[];
  loading: boolean;
  sendFeedback: (notificationId: string, message: string) => Promise<void>;
  deleteFeedback: (feedbackId: string) => Promise<void>;
  addReply: (feedbackId: string, message: string) => Promise<void>;
  getReplies: (feedbackId: string) => FeedbackReply[];
}
