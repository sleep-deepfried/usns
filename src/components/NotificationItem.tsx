import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Card, Text, Button, Chip, Portal, Modal, Dialog, IconButton } from 'react-native-paper';
import { Notification } from '../types/notification';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { getPermissions } from '../utils/permissions';
import FeedbackForm from './FeedbackForm';

interface NotificationItemProps {
  notification: Notification;
}

export default function NotificationItem({ notification }: NotificationItemProps) {
  const { user } = useAuth();
  const { markAsRead, deleteNotification } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

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

  const handleDelete = async () => {
    try {
      await deleteNotification(notification.id);
      setDeleteDialogVisible(false);
    } catch (error) {
      console.error('Error deleting notification:', error);
      Alert.alert('Error', 'Failed to delete announcement');
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
            <View style={styles.headerRight}>
              {!isRead && <Chip mode="flat" compact={true}>New</Chip>}
              {permissions.canDeleteNotification && (
                <IconButton
                  icon="delete"
                  size={20}
                  onPress={() => setDeleteDialogVisible(true)}
                />
              )}
            </View>
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
              onPress={() => setShowFeedbackForm(true)}
            >
              Send Feedback
            </Button>
          )}
        </Card.Actions>
      </Card>

      <Portal>
        <Modal
          visible={showFeedbackForm}
          onDismiss={() => setShowFeedbackForm(false)}
          contentContainerStyle={styles.modal}
        >
          <FeedbackForm
            notificationId={notification.id}
            onClose={() => setShowFeedbackForm(false)}
          />
        </Modal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>Delete Announcement</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to delete this announcement?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleDelete} textColor="#c62828">Delete</Button>
          </Dialog.Actions>
        </Dialog>
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
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
    margin: 20,
  },
});
