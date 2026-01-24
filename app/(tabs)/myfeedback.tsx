import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text, ActivityIndicator, Appbar, Card, Chip } from 'react-native-paper';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../src/config/firebase';
import { useAuth } from '../../src/contexts/AuthContext';
import { Feedback } from '../../src/types/feedback';

export default function MyFeedbackScreen() {
  const { user, signOut } = useAuth();
  const [feedbacks, setFeedbacks] = useState<(Feedback & { replies?: any[] })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Query only feedback submitted by this user
    const q = query(
      collection(db, 'feedback'),
      where('studentId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const feedbackList: (Feedback & { replies?: any[] })[] = [];
      snapshot.forEach((doc) => {
        feedbackList.push({ id: doc.id, ...doc.data() } as Feedback & { replies?: any[] });
      });
      setFeedbacks(feedbackList);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  if (!user) return null;

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
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
      <Appbar.Header>
        <Appbar.Content title="My Feedback" subtitle={`${feedbacks.length} submitted`} />
        <Appbar.Action icon="logout" onPress={signOut} />
      </Appbar.Header>

      <FlatList
        data={feedbacks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.header}>
                <Text variant="bodySmall" style={styles.timestamp}>
                  {formatTimestamp(item.timestamp)}
                </Text>
                {item.replies && item.replies.length > 0 && (
                  <Chip compact style={styles.repliedChip}>Replied</Chip>
                )}
              </View>

              <Text variant="bodyMedium" style={styles.message}>
                {item.message}
              </Text>

              {/* Show replies from teachers/admins */}
              {item.replies && item.replies.length > 0 && (
                <View style={styles.repliesContainer}>
                  <Text variant="labelMedium" style={styles.repliesTitle}>
                    Replies from Staff:
                  </Text>
                  {item.replies.map((reply: any, index: number) => (
                    <View key={index} style={styles.reply}>
                      <Text variant="bodySmall" style={styles.replyMeta}>
                        {reply.senderName} ({reply.senderRole})
                      </Text>
                      <Text variant="bodyMedium">{reply.message}</Text>
                    </View>
                  ))}
                </View>
              )}
            </Card.Content>
          </Card>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              You haven't submitted any feedback yet
            </Text>
            <Text variant="bodySmall" style={styles.emptySubtext}>
              Send feedback from announcements on the Home page
            </Text>
          </View>
        }
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
  },
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timestamp: {
    color: '#666',
  },
  repliedChip: {
    backgroundColor: '#e8f5e9',
  },
  message: {
    lineHeight: 22,
  },
  repliesContainer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  repliesTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1565c0',
  },
  reply: {
    backgroundColor: '#e3f2fd',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  replyMeta: {
    color: '#1565c0',
    marginBottom: 4,
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});
