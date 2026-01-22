import React, { useState } from 'react';
import { View, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import {
  Text,
  Card,
  Button,
  TextInput,
  Chip,
  Appbar,
  Menu,
} from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { useReports } from '../contexts/ReportContext';
import { Report, ReportReply } from '../types/report';

interface ReportDetailProps {
  report: Report;
  onBack: () => void;
}

export default function ReportDetail({ report, onBack }: ReportDetailProps) {
  const { user } = useAuth();
  const { getReplies, addReply, updateReportStatus } = useReports();
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const replies = getReplies(report.id);

  if (!user) return null;

  const isStaff = user.role === 'Administrator' || user.role === 'Teacher';

  const handleSendReply = async () => {
    if (!replyText.trim() || !isStaff) return;

    setSubmitting(true);
    try {
      await addReply(report.id, replyText.trim());
      setReplyText('');
    } catch (error: any) {
      alert(error.message || 'Failed to send reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (status: Report['status']) => {
    setMenuVisible(false);
    try {
      await updateReportStatus(report.id, status);
    } catch (error: any) {
      alert(error.message || 'Failed to update status');
    }
  };

  const getStatusColor = (status: Report['status']) => {
    switch (status) {
      case 'pending':
        return '#ff9800';
      case 'in_progress':
        return '#2196f3';
      case 'resolved':
        return '#4caf50';
      default:
        return '#666';
    }
  };

  const renderReply = ({ item }: { item: ReportReply }) => (
    <Card style={[styles.replyCard, item.senderId === user.uid && styles.ownReply]}>
      <Card.Content>
        <View style={styles.replyHeader}>
          <Text variant="labelMedium" style={styles.senderName}>
            {item.senderName}
          </Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{item.senderRole}</Text>
          </View>
        </View>
        <Text variant="bodyMedium">{item.message}</Text>
        <Text variant="bodySmall" style={styles.timestamp}>
          {item.createdAt.toLocaleString()}
        </Text>
      </Card.Content>
    </Card>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Appbar.Header>
        <Appbar.BackAction onPress={onBack} />
        <Appbar.Content title="Report Details" />
        {isStaff && (
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Appbar.Action icon="dots-vertical" onPress={() => setMenuVisible(true)} />
            }
          >
            <Menu.Item
              onPress={() => handleStatusChange('pending')}
              title="Mark as Pending"
            />
            <Menu.Item
              onPress={() => handleStatusChange('in_progress')}
              title="Mark as In Progress"
            />
            <Menu.Item
              onPress={() => handleStatusChange('resolved')}
              title="Mark as Resolved"
            />
          </Menu>
        )}
      </Appbar.Header>

      <View style={styles.content}>
        {/* Report Details */}
        <Card style={styles.reportCard}>
          <Card.Content>
            <View style={styles.reportHeader}>
              <Text variant="titleLarge" style={styles.reportTitle}>
                {report.title}
              </Text>
              <Chip
                mode="flat"
                style={{ backgroundColor: getStatusColor(report.status) }}
                textStyle={{ color: '#fff' }}
              >
                {report.status.replace('_', ' ').toUpperCase()}
              </Chip>
            </View>
            <Text variant="bodyMedium" style={styles.reportMessage}>
              {report.message}
            </Text>
            <Text variant="bodySmall" style={styles.reportMeta}>
              Submitted by {report.studentName} on {report.createdAt.toLocaleDateString()}
            </Text>
          </Card.Content>
        </Card>

        {/* Replies */}
        <Text variant="titleMedium" style={styles.repliesTitle}>
          Replies ({replies.length})
        </Text>

        <FlatList
          data={replies}
          keyExtractor={(item) => item.id}
          renderItem={renderReply}
          contentContainerStyle={styles.repliesList}
          ListEmptyComponent={
            <Text style={styles.noReplies}>No replies yet</Text>
          }
        />

        {/* Reply Input - Only for Staff */}
        {isStaff && (
          <View style={styles.replyInputContainer}>
            <TextInput
              placeholder="Type your reply..."
              value={replyText}
              onChangeText={setReplyText}
              mode="outlined"
              style={styles.replyInput}
              multiline
            />
            <Button
              mode="contained"
              onPress={handleSendReply}
              loading={submitting}
              disabled={submitting || !replyText.trim()}
              style={styles.sendButton}
            >
              Send
            </Button>
          </View>
        )}

        {/* Message for students */}
        {!isStaff && (
          <View style={styles.studentMessage}>
            <Text variant="bodySmall" style={styles.studentMessageText}>
              A teacher or administrator will respond to your report.
            </Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  reportCard: {
    marginBottom: 16,
    elevation: 2,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reportTitle: {
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  reportMessage: {
    marginBottom: 12,
    lineHeight: 22,
  },
  reportMeta: {
    color: '#666',
  },
  repliesTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  repliesList: {
    flexGrow: 1,
  },
  replyCard: {
    marginBottom: 8,
  },
  ownReply: {
    backgroundColor: '#e3f2fd',
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  senderName: {
    fontWeight: 'bold',
    marginRight: 8,
  },
  roleChip: {
    marginLeft: 4,
  },
  roleBadge: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  roleText: {
    fontSize: 12,
    color: '#333',
  },
  timestamp: {
    color: '#999',
    marginTop: 4,
  },
  noReplies: {
    textAlign: 'center',
    color: '#666',
    padding: 20,
  },
  replyInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  replyInput: {
    flex: 1,
    marginRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    marginBottom: 6,
  },
  studentMessage: {
    padding: 16,
    backgroundColor: '#fff3e0',
    borderRadius: 8,
  },
  studentMessageText: {
    color: '#e65100',
    textAlign: 'center',
  },
});
