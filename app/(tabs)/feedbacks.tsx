import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { Text, ActivityIndicator, Appbar, Card, Button, TextInput, IconButton, Chip, Portal, Dialog } from 'react-native-paper';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../src/config/firebase';
import { useAuth } from '../../src/contexts/AuthContext';
import { getPermissions } from '../../src/utils/permissions';
import { Feedback } from '../../src/types/feedback';

export default function FeedbacksScreen() {
  const { user, signOut } = useAuth();
  const [feedbacks, setFeedbacks] = useState<(Feedback & { replies?: any[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [feedbackToDelete, setFeedbackToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'feedback'), orderBy('timestamp', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const feedbackList: (Feedback & { replies?: any[] })[] = [];
      snapshot.forEach((doc) => {
        feedbackList.push({
          id: doc.id,
          ...doc.data(),
        } as Feedback & { replies?: any[] });
      });
      setFeedbacks(feedbackList);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  if (!user) return null;

  const permissions = getPermissions(user.role);

  // Only Teachers and Admins can view this page
  if (!permissions.canViewFeedback) {
    return (
      <View style={styles.centerContainer}>
        <Text>You don't have permission to view feedback.</Text>
      </View>
    );
  }

  const handleReply = async (feedbackId: string) => {
    if (!replyText.trim()) return;

    setReplyLoading(true);
    try {
      const reply = {
        message: replyText.trim(),
        senderId: user.uid,
        senderName: `${user.firstName} ${user.lastName}`,
        senderRole: user.role,
        timestamp: new Date(),
      };

      await updateDoc(doc(db, 'feedback', feedbackId), {
        replies: arrayUnion(reply),
      });

      setReplyText('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error replying:', error);
      Alert.alert('Error', 'Failed to send reply');
    } finally {
      setReplyLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!feedbackToDelete) return;

    try {
      await deleteDoc(doc(db, 'feedback', feedbackToDelete));
      setDeleteDialogVisible(false);
      setFeedbackToDelete(null);
    } catch (error) {
      console.error('Error deleting:', error);
      Alert.alert('Error', 'Failed to delete feedback');
    }
  };

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
        <Appbar.Content title="Feedback Hub" subtitle={`${feedbacks.length} feedback(s)`} />
        <Appbar.Action icon="logout" onPress={signOut} />
      </Appbar.Header>

      <FlatList
        data={feedbacks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.header}>
                <View style={styles.headerInfo}>
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
                    onPress={() => {
                      setFeedbackToDelete(item.id);
                      setDeleteDialogVisible(true);
                    }}
                  />
                )}
              </View>

              <Chip style={styles.notificationChip} compact>
                Notification ID: {item.notificationId.slice(0, 8)}...
              </Chip>

              <Text variant="bodyMedium" style={styles.message}>
                {item.message}
              </Text>

              {/* Replies */}
              {item.replies && item.replies.length > 0 && (
                <View style={styles.repliesContainer}>
                  <Text variant="labelMedium" style={styles.repliesTitle}>Replies:</Text>
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

              {/* Reply Form */}
              {replyingTo === item.id ? (
                <View style={styles.replyForm}>
                  <TextInput
                    label="Your reply"
                    value={replyText}
                    onChangeText={setReplyText}
                    mode="outlined"
                    multiline
                    style={styles.replyInput}
                  />
                  <View style={styles.replyButtons}>
                    <Button onPress={() => setReplyingTo(null)}>Cancel</Button>
                    <Button
                      mode="contained"
                      onPress={() => handleReply(item.id)}
                      loading={replyLoading}
                      disabled={replyLoading}
                    >
                      Send
                    </Button>
                  </View>
                </View>
              ) : (
                permissions.canReplyToFeedback && (
                  <Button
                    mode="outlined"
                    onPress={() => setReplyingTo(item.id)}
                    style={styles.replyButton}
                    icon="reply"
                  >
                    Reply
                  </Button>
                )
              )}
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

      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>Delete Feedback</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to delete this feedback?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleDelete} textColor="#c62828">Delete</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
    alignItems: 'flex-start',
  },
  headerInfo: {
    flex: 1,
  },
  studentName: {
    fontWeight: 'bold',
  },
  timestamp: {
    color: '#666',
  },
  notificationChip: {
    alignSelf: 'flex-start',
    marginVertical: 8,
  },
  message: {
    marginTop: 8,
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
  },
  replyForm: {
    marginTop: 12,
  },
  replyInput: {
    marginBottom: 8,
  },
  replyButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  replyButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
  },
});
