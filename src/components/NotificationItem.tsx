import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Button, Chip } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Notification } from '../types/notification';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { getPermissions } from '../utils/permissions';

interface NotificationItemProps {
  notification: Notification;
}

export default function NotificationItem({ notification }: NotificationItemProps) {
  const { user } = useAuth();
  const { markAsRead } = useNotifications();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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

  const handleSendFeedback = () => {
    router.push(`/(tabs)/feedback/${notification.id}`);
  };

  return (
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
            onPress={handleSendFeedback}
          >
            Send Feedback
          </Button>
        )}
      </Card.Actions>
    </Card>
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
});
