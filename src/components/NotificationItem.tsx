import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Button, Chip, Portal, Modal, TextInput } from 'react-native-paper';
import { Notification } from '../types/notification';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useFeedback } from '../contexts/FeedbackContext';
import { getPermissions } from '../utils/permissions';

interface NotificationItemProps {
  notification: Notification;
}

export default function NotificationItem({ notification }: NotificationItemProps) {
  const { user } = useAuth();
  const { markAsRead } = useNotifications();
  const { sendFeedback } = useFeedback();
  const [loading, setLoading] = useState(false);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!user) return null;

  const permissions = getPermissions(user.role);
  const isRead = notification.readBy.includes(user.uid);

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const handleMarkAsRead = async () => {
    if (isRead) return;
    
    setLoading(true);
    try {
      await markAsRead(notification.id);
    } catch (error) {
      console.error('Error marking as read:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendFeedback = async () => {
    if (!feedbackMessage.trim()) return;

    setSubmitting(true);
    try {
      await sendFeedback(notification.id, feedbackMessage.trim());
      setFeedbackMessage('');
      setFeedbackModalVisible(false);
      alert('Feedback sent successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to send feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Card style={[styles.card, !isRead && styles.unreadCard]}>
        <Card.Content>
          <View style={styles.header}>
            <Text variant="titleMedium" style={styles.title}>
              {notification.title}
            </Text>
            {!isRead && <Chip mode="flat" compact={true}>New</Chip>}
          </View>

          <Text variant="bodyMedium" style={styles.message}>
            {notification.message}
          </Text>

          <View style={styles.footer}>
            <Text variant="bodySmall" style={styles.sender}>
              From: {notification.senderName}
            </Text>
            <Text variant="bodySmall" style={styles.timestamp}>
              {formatTimestamp(notification.timestamp)}
            </Text>
          </View>
        </Card.Content>

        <Card.Actions>
          {!isRead && (
            <Button
              mode="outlined"
              onPress={handleMarkAsRead}
              loading={loading}
              disabled={loading}
            >
              Mark as Read
            </Button>
          )}
          
          {permissions.canSendFeedback && (
            <Button
              mode="contained"
              onPress={() => setFeedbackModalVisible(true)}
            >
              Send Feedback
            </Button>
          )}
        </Card.Actions>
      </Card>

      {/* Feedback Modal */}
      <Portal>
        <Modal
          visible={feedbackModalVisible}
          onDismiss={() => setFeedbackModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            Send Feedback
          </Text>
          <Text variant="bodySmall" style={styles.modalSubtitle}>
            Regarding: {notification.title}
          </Text>
          <TextInput
            label="Your Feedback"
            value={feedbackMessage}
            onChangeText={setFeedbackMessage}
            mode="outlined"
            multiline
            numberOfLines={4}
            maxLength={500}
            style={styles.input}
          />
          <Text variant="bodySmall" style={styles.charCount}>
            {feedbackMessage.length}/500 characters
          </Text>
          <View style={styles.modalActions}>
            <Button onPress={() => setFeedbackModalVisible(false)}>Cancel</Button>
            <Button
              mode="contained"
              onPress={handleSendFeedback}
              loading={submitting}
              disabled={submitting || !feedbackMessage.trim()}
            >
              Submit
            </Button>
          </View>
        </Modal>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    elevation: 2,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#6200ee',
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
  message: {
    marginBottom: 12,
    lineHeight: 20,
  },
  footer: {
    marginTop: 8,
  },
  sender: {
    color: '#666',
    marginBottom: 4,
  },
  timestamp: {
    color: '#999',
  },
  modal: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalSubtitle: {
    color: '#666',
    marginBottom: 16,
  },
  input: {
    marginBottom: 4,
  },
  charCount: {
    color: '#999',
    textAlign: 'right',
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
});
