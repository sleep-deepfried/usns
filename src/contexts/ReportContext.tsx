import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  arrayUnion,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Report, ReportReply } from '../types/report';
import { useAuth } from './AuthContext';

interface ReportContextValue {
  reports: Report[];
  loading: boolean;
  createReport: (title: string, message: string) => Promise<void>;
  replyToReport: (reportId: string, message: string) => Promise<void>;
  updateReportStatus: (reportId: string, status: Report['status']) => Promise<void>;
}

const ReportContext = createContext<ReportContextValue | undefined>(undefined);

export function ReportProvider({ children }: { children: React.ReactNode }) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setReports([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reportList: Report[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        reportList.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          replies: data.replies || [],
        } as Report);
      });
      
      // Students only see their own reports, Admin/Teacher see all
      if (user.role === 'Student' || user.role === 'Verified_Student') {
        setReports(reportList.filter(r => r.studentId === user.uid));
      } else {
        setReports(reportList);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const createReport = async (title: string, message: string) => {
    if (!user) throw new Error('Must be logged in');

    await addDoc(collection(db, 'reports'), {
      title,
      message,
      studentId: user.uid,
      studentName: `${user.firstName} ${user.lastName}`,
      status: 'pending',
      createdAt: serverTimestamp(),
      replies: [],
    });
  };

  const replyToReport = async (reportId: string, message: string) => {
    if (!user) throw new Error('Must be logged in');

    const reply = {
      id: Date.now().toString(),
      message,
      senderId: user.uid,
      senderName: `${user.firstName} ${user.lastName}`,
      senderRole: user.role,
      createdAt: new Date(),
    };

    await updateDoc(doc(db, 'reports', reportId), {
      replies: arrayUnion(reply),
      status: 'in_progress',
    });
  };

  const updateReportStatus = async (reportId: string, status: Report['status']) => {
    await updateDoc(doc(db, 'reports', reportId), { status });
  };

  return (
    <ReportContext.Provider value={{ reports, loading, createReport, replyToReport, updateReportStatus }}>
      {children}
    </ReportContext.Provider>
  );
}

export function useReports() {
  const context = useContext(ReportContext);
  if (!context) throw new Error('useReports must be used within ReportProvider');
  return context;
}
