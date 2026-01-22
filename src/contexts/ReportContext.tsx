import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Report, ReportReply } from '../types/report';
import { useAuth } from './AuthContext';

interface ReportContextValue {
  reports: Report[];
  loading: boolean;
  createReport: (title: string, message: string) => Promise<void>;
  updateReportStatus: (reportId: string, status: Report['status']) => Promise<void>;
  addReply: (reportId: string, message: string) => Promise<void>;
  getReplies: (reportId: string) => ReportReply[];
}

const ReportContext = createContext<ReportContextValue | undefined>(undefined);

export function ReportProvider({ children }: { children: React.ReactNode }) {
  const [reports, setReports] = useState<Report[]>([]);
  const [replies, setReplies] = useState<Record<string, ReportReply[]>>({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setReports([]);
      setLoading(false);
      return;
    }

    // Query based on role - students see only their reports, teachers/admins see all
    const isStaff = user.role === 'Administrator' || user.role === 'Teacher';
    const reportsQuery = isStaff
      ? query(collection(db, 'reports'), orderBy('createdAt', 'desc'))
      : query(
          collection(db, 'reports'),
          where('studentId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );

    const unsubscribe = onSnapshot(reportsQuery, (snapshot) => {
      const reportList: Report[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        reportList.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Report);
      });
      setReports(reportList);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  // Listen to replies for all reports
  useEffect(() => {
    if (reports.length === 0) return;

    const unsubscribes = reports.map((report) => {
      const repliesQuery = query(
        collection(db, 'reports', report.id, 'replies'),
        orderBy('createdAt', 'asc')
      );

      return onSnapshot(repliesQuery, (snapshot) => {
        const replyList: ReportReply[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          replyList.push({
            id: doc.id,
            reportId: report.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
          } as ReportReply);
        });
        setReplies((prev) => ({ ...prev, [report.id]: replyList }));
      });
    });

    return () => unsubscribes.forEach((unsub) => unsub());
  }, [reports]);

  const createReport = async (title: string, message: string) => {
    if (!user) throw new Error('Must be logged in');

    await addDoc(collection(db, 'reports'), {
      title,
      message,
      studentId: user.uid,
      studentName: `${user.firstName} ${user.lastName}`,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  const updateReportStatus = async (reportId: string, status: Report['status']) => {
    await updateDoc(doc(db, 'reports', reportId), {
      status,
      updatedAt: serverTimestamp(),
    });
  };

  const addReply = async (reportId: string, message: string) => {
    if (!user) throw new Error('Must be logged in');

    await addDoc(collection(db, 'reports', reportId, 'replies'), {
      message,
      senderId: user.uid,
      senderName: `${user.firstName} ${user.lastName}`,
      senderRole: user.role,
      createdAt: serverTimestamp(),
    });

    // Update report status to resolved when staff replies
    await updateReportStatus(reportId, 'resolved');
  };

  const getReplies = (reportId: string) => replies[reportId] || [];

  return (
    <ReportContext.Provider
      value={{ reports, loading, createReport, updateReportStatus, addReply, getReplies }}
    >
      {children}
    </ReportContext.Provider>
  );
}

export function useReports() {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error('useReports must be used within a ReportProvider');
  }
  return context;
}
