import React, { useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text, ActivityIndicator, Card, Button, IconButton } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useFeedback, useFeedbackForNotification } from '../../../src/contexts/FeedbackContext';
import { getPermissions } from '../../../src/utils/permissions';
import FeedbackForm from '../../../src/components/FeedbackForm';

export default function FeedbackViewScreen() {
  const { notificationId } = useLocalSearchParams<{ notificationId: string }>();
  const { user } = useAuth();
  const { deleteFeedback } = useFeedback();
  const { feedback, loading } = useFeedbackForNotification(notificationId || '');
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  if (!user) return null;

  const permissions = getPermissions(user.role);

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const handleDelete = async (feedbackId: string) => {
    try {
      await deleteFeedback(feedbackId);
    } catch (error: any) {
      console.error('Error deleting feedback:', error);
      alert(error.message || 'Failed to delete feedback');
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={feedback}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.header}>
                <View style={styles.headerText}>
                  <Text variant="titleMedium" style={styles.studentName}>
                    {item.studentName}
                  </Text>
                  <Text variant="bodySmall" style={styles.timestamp}>
                    {formatTimestamp(item.timestamp)}
                  </Text>
                </View>
                {permissions.canDeleteFeedback && (
                  <IconButton
                    icon="delete"
                    size={20}
                    onPress={() => handleDelete(item.id)}
                  />
                )}
              </View>
              <Text variant="bodyMedium" style={styles.message}>
                {item.message}
              </Text>
            </Card.Content>
          </Card>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              No feedback yet
            </Text>
          </View>
        }
      />

      {permissions.canSendFeedback && (
        <>
          {showForm ? (
            <FeedbackForm
              notificationId={notificationId || ''}
              onClose={() => setShowForm(false)}
            />
          ) : (
            <Button
              mode="contained"
              onPress={() => setShowForm(true)}
              style={styles.addButton}
              icon="plus"
            >
              Add Feedback
            </Button>
          )}
        </>
      )}
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
    paddingBottom: 80,
  },
  card: {
    marginBottom: 12,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerText: {
    flex: 1,
  },
  studentName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  timestamp: {
    color: '#999',
  },
  message: {
    lineHeight: 20,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
  },
  addButton: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
});
