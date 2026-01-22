export interface Report {
    id: string;
    title: string;
    message: string;
    studentId: string;
    studentName: string;
    status: 'pending' | 'in_progress' | 'resolved';
    createdAt: Date;
    replies: ReportReply[];
}

export interface ReportReply {
    id: string;
    message: string;
    senderId: string;
    senderName: string;
    senderRole: string;
    createdAt: Date;
}
