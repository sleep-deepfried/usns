export interface Report {
  id: string;
  title: string;
  message: string;
  studentId: string;
  studentName: string;
  status: 'pending' | 'in_progress' | 'resolved';
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportReply {
  id: string;
  reportId: string;
  message: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  createdAt: Date;
}
