import React, { useState } from 'react';
import { View, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import {
  Text,
  Card,
  Button,
  TextInput,
  Appbar,
  Dialog,
  Portal,
} from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { useFeedback } from '../contexts/FeedbackContext';
import { useNotifications } from '../contexts/NotificationContext';
import { Feedback, FeedbackReply } from '../types/feedback';
import { getPermissions } from '../utils/permissions';

interface FeedbackDetailProps {
  feedback: Feedback;
  onBack: () => void;
}

export default function FeedbackDetail({ feedback, onBack }: FeedbackDetailProps) {
  const { user } = useAuth();
  const { getReplies, addReply, deleteFeedback } = useFeedback();
  const { notifications } = useNotifications();
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  const replies = getReplies(feedback.id);
  const notification = notifications.find((n) => n.id === feedback.notificationId);

  if (!user) return null;

  const permissions = getPermissions(user.role);
  const isStaff = permissions.canReplyToFeedback;

  const handleSendReply = async () => {
    if (!replyText.trim() || !isStaff) return;

    setSubmitting(true);
    try {
      await addReply(feedback.id, replyText.trim());
      setReplyText('');
    } catch (error: any) {
      alert(error.message || 'Failed to send reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleteDialogVisible(false);
    try {
      await deleteFeedback(feedback.id);
      onBack();
    } catch (error: any) {
      alert(error.message || 'Failed to delete feedback');
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const renderReply = ({ item }: { item: FeedbackReply }) => (
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
        <Appbar.Content title="Feedback Details" />
        {permissions.canDeleteFeedback && (
          <Appbar.Action icon="delete" onPress={() => setDeleteDialogVisible(true)} />
        )}
      </Appbar.Header>

      <View style={styles.content}>
        {/* Original Notification Info */}
        {notification && (
          <Card style={styles.notificationCard}>
            <Card.Content>
              <Text variant="labelSmall" style={styles.label}>
                REGARDING NOTIFICATION
              </Text>
              <Text variant="titleMedium" style={styles.notificationTitle}>
                {notification.title}
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Feedback Details */}
        <Card style={styles.feedbackCard}>
          <Card.Content>
            <View style={styles.feedbackHeader}>
              <Text variant="labelMedium" style={styles.studentName}>
                {feedback.studentName}
              </Text>
              <Text variant="bodySmall" style={styles.timestamp}>
                {formatTimestamp(feedback.timestamp)}
              </Text>
            </View>
            <Text variant="bodyMedium" style={styles.feedbackMessage}>
              {feedback.message}
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
              A teacher or administrator will respond to your feedback.
            </Text>
          </View>
        )}
      </View>

      {/* Delete Confirmation Dialog */}
      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>Delete Feedback</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you sure you want to delete this feedback? This action cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleDelete} textColor="#c62828">
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  notificationCard: {
    marginBottom: 12,
    backgroundColor: '#e3f2fd',
  },
  label: {
    color: '#1976d2',
    marginBottom: 4,
  },
  notificationTitle: {
    fontWeight: 'bold',
  },
  feedbackCard: {
    marginBottom: 16,
    elevation: 2,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  studentName: {
    fontWeight: 'bold',
  },
  feedbackMessage: {
    lineHeight: 22,
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
