import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Chip, Button, TextInput, Divider } from 'react-native-paper';
import { Report } from '../types/report';
import { useReports } from '../contexts/ReportContext';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  report: Report;
}

export default function ReportItem({ report }: Props) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);
  const { replyToReport, updateReportStatus } = useReports();
  const { user } = useAuth();

  const canReply = user?.role === 'Administrator' || user?.role === 'Teacher';
  const canChangeStatus = canReply;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#ff9800';
      case 'in_progress': return '#2196f3';
      case 'resolved': return '#4caf50';
      default: return '#666';
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    
    setLoading(true);
    try {
      await replyToReport(report.id, replyText.trim());
      setReplyText('');
      setShowReply(false);
    } catch (err) {
      alert('Failed to send reply');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (status: Report['status']) => {
    try {
      await updateReportStatus(report.id, status);
    } catch (err) {
      alert('Failed to update status');
    }
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Text variant="titleMedium" style={styles.title}>{report.title}</Text>
          <Chip 
            style={{ backgroundColor: getStatusColor(report.status) }}
            textStyle={{ color: '#fff' }}
          >
            {report.status}
          </Chip>
        </View>

        <Text variant="bodySmall" style={styles.meta}>
          By {report.studentName} • {report.createdAt.toLocaleDateString()}
        </Text>

        <Text variant="bodyMedium" style={styles.message}>{report.message}</Text>

        {report.replies.length > 0 && (
          <>
            <Divider style={styles.divider} />
            <Text variant="titleSmall" style={styles.repliesTitle}>Replies</Text>
            {report.replies.map((reply, index) => (
              <View key={index} style={styles.reply}>
                <Text variant="bodySmall" style={styles.replyMeta}>
                  {reply.senderName} ({reply.senderRole})
                </Text>
                <Text variant="bodyMedium">{reply.message}</Text>
              </View>
            ))}
          </>
        )}
      </Card.Content>

      {canReply && (
        <Card.Actions style={styles.actions}>
          {canChangeStatus && report.status !== 'resolved' && (
            <Button compact onPress={() => handleStatusChange('resolved')}>
              Mark Resolved
            </Button>
          )}
          <Button compact onPress={() => setShowReply(!showReply)}>
            {showReply ? 'Cancel' : 'Reply'}
          </Button>
        </Card.Actions>
      )}

      {showReply && (
        <Card.Content>
          <TextInput
            label="Your reply"
            value={replyText}
            onChangeText={setReplyText}
            mode="outlined"
            multiline
            style={styles.replyInput}
          />
          <Button mode="contained" onPress={handleReply} loading={loading} disabled={loading}>
            Send Reply
          </Button>
        </Card.Content>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontWeight: 'bold',
    flex: 1,
  },
  meta: {
    color: '#666',
    marginBottom: 8,
  },
  message: {
    marginBottom: 8,
  },
  divider: {
    marginVertical: 12,
  },
  repliesTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  reply: {
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  replyMeta: {
    color: '#666',
    marginBottom: 4,
  },
  actions: {
    justifyContent: 'flex-end',
  },
  replyInput: {
    marginBottom: 12,
  },
});
