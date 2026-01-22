import React, { useState } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import {
  Text,
  Card,
  ActivityIndicator,
  Appbar,
  Chip,
} from 'react-native-paper';
import { useAuth } from '../../src/contexts/AuthContext';
import { useFeedback } from '../../src/contexts/FeedbackContext';
import { useNotifications } from '../../src/contexts/NotificationContext';
import { Feedback } from '../../src/types/feedback';
import FeedbackDetail from '../../src/components/FeedbackDetail';

export default function FeedbackListScreen() {
  const { user, signOut } = useAuth();
  const { feedback, loading } = useFeedback();
  const { notifications } = useNotifications();
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);

  if (!user) return null;

  const isStaff = user.role === 'Administrator' || user.role === 'Teacher';

  const getNotificationTitle = (notificationId: string) => {
    const notification = notifications.find((n) => n.id === notificationId);
    return notification?.title || 'Unknown Notification';
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const renderFeedback = ({ item }: { item: Feedback }) => (
    <Card style={styles.card} onPress={() => setSelectedFeedback(item)}>
      <Card.Content>
        <Chip mode="flat" compact style={styles.notificationChip}>
          {getNotificationTitle(item.notificationId)}
        </Chip>
        <Text variant="bodyMedium" numberOfLines={2} style={styles.message}>
          {item.message}
        </Text>
        <Text variant="bodySmall" style={styles.meta}>
          By {item.studentName} • {formatTimestamp(item.timestamp)}
        </Text>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Show feedback detail if selected
  if (selectedFeedback) {
    return (
      <FeedbackDetail
        feedback={selectedFeedback}
        onBack={() => setSelectedFeedback(null)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content
          title="Feedback"
          subtitle={`${user.firstName} ${user.lastName}`}
        />
        <Appbar.Action icon="logout" onPress={signOut} />
      </Appbar.Header>

      <FlatList
        data={feedback}
        keyExtractor={(item) => item.id}
        renderItem={renderFeedback}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              {isStaff ? 'No feedback received yet' : 'No feedback submitted yet'}
            </Text>
          </View>
        }
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => {}} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    marginBottom: 12,
    elevation: 2,
  },
  notificationChip: {
    alignSelf: 'flex-start',
    marginBottom: 8,
    backgroundColor: '#e3f2fd',
  },
  message: {
    marginBottom: 8,
  },
  meta: {
    color: '#999',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
  },
});
