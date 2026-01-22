import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Card, Text, Button, ActivityIndicator, Chip, Portal, Dialog } from 'react-native-paper';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { User } from '../types/auth';
import { useAuth } from '../contexts/AuthContext';
import { getPermissions } from '../utils/permissions';
import { createNotificationRecord } from '../services/pushNotifications';

type ActionType = 'verify' | 'unverify' | 'promote' | null;

export default function UserManagementList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<ActionType>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const userList: User[] = [];
      querySnapshot.forEach((doc) => {
        userList.push(doc.data() as User);
      });
      setUsers(userList);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const openConfirmModal = (user: User, action: ActionType) => {
    setSelectedUser(user);
    setActionType(action);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedUser(null);
    setActionType(null);
  };

  const handleConfirmAction = async () => {
    if (!selectedUser || !actionType || !currentUser) return;

    setActionLoading(selectedUser.uid);
    closeModal();

    try {
      const performerName = `${currentUser.firstName} ${currentUser.lastName}`;
      
      switch (actionType) {
        case 'verify':
          await updateDoc(doc(db, 'users', selectedUser.uid), {
            role: 'Verified_Student',
            isVerified: true,
          });
          // Create push notification record
          await createNotificationRecord(
            selectedUser.uid,
            '🎉 Account Verified!',
            `Congratulations! ${performerName} has verified your account. You can now send feedback on notifications.`,
            'verification'
          );
          alert('Student verified successfully!');
          break;
        case 'unverify':
          await updateDoc(doc(db, 'users', selectedUser.uid), {
            role: 'Student',
            isVerified: false,
          });
          // Create push notification record
          await createNotificationRecord(
            selectedUser.uid,
            'Account Status Changed',
            `Your verified status has been removed by ${performerName}. Please contact your teacher for more information.`,
            'unverification'
          );
          alert('Student unverified successfully!');
          break;
        case 'promote':
          await updateDoc(doc(db, 'users', selectedUser.uid), {
            role: 'Teacher',
          });
          // Create push notification record
          await createNotificationRecord(
            selectedUser.uid,
            '🎓 Promoted to Teacher!',
            `Congratulations! ${performerName} has promoted you to Teacher. You can now send notifications and verify students.`,
            'promotion'
          );
          alert('User promoted to Teacher successfully!');
          break;
      }
      await fetchUsers();
    } catch (error: any) {
      console.error('Error performing action:', error);
      alert(error.message || 'Failed to perform action');
    } finally {
      setActionLoading(null);
    }
  };

  const getModalTitle = () => {
    switch (actionType) {
      case 'verify': return 'Verify Student';
      case 'unverify': return 'Unverify Student';
      case 'promote': return 'Promote to Teacher';
      default: return '';
    }
  };

  const getModalMessage = () => {
    if (!selectedUser) return '';
    const name = `${selectedUser.firstName} ${selectedUser.lastName}`;
    switch (actionType) {
      case 'verify': 
        return `Are you sure you want to verify ${name}? They will be able to send feedback on notifications.`;
      case 'unverify': 
        return `Are you sure you want to unverify ${name}? They will no longer be able to send feedback.`;
      case 'promote': 
        return `Are you sure you want to promote ${name} to Teacher? They will be able to send notifications and verify students.`;
      default: return '';
    }
  };

  if (!currentUser) return null;

  const permissions = getPermissions(currentUser.role);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={users}
        keyExtractor={(item) => item.uid}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.header}>
                <View style={styles.userInfo}>
                  <Text variant="titleMedium" style={styles.name}>
                    {item.firstName} {item.lastName}
                  </Text>
                  <Text variant="bodySmall" style={styles.email}>
                    {item.email}
                  </Text>
                </View>
                <Chip mode="flat">{item.role}</Chip>
              </View>
            </Card.Content>

            <Card.Actions>
              {permissions.canPromoteToTeacher && item.role !== 'Administrator' && item.role !== 'Teacher' && (
                <Button
                  mode="contained"
                  onPress={() => openConfirmModal(item, 'promote')}
                  loading={actionLoading === item.uid}
                  disabled={actionLoading === item.uid}
                  compact={true}
                >
                  Promote to Teacher
                </Button>
              )}

              {permissions.canVerifyStudent && item.role === 'Student' && (
                <Button
                  mode="outlined"
                  onPress={() => openConfirmModal(item, 'verify')}
                  loading={actionLoading === item.uid}
                  disabled={actionLoading === item.uid}
                  compact={true}
                >
                  Verify
                </Button>
              )}

              {permissions.canUnverifyStudent && item.role === 'Verified_Student' && (
                <Button
                  mode="outlined"
                  onPress={() => openConfirmModal(item, 'unverify')}
                  loading={actionLoading === item.uid}
                  disabled={actionLoading === item.uid}
                  compact={true}
                  buttonColor="#ffebee"
                  textColor="#c62828"
                >
                  Unverify
                </Button>
              )}
            </Card.Actions>
          </Card>
        )}
        contentContainerStyle={styles.listContent}
        scrollEnabled={false}
      />

      <Portal>
        <Dialog visible={modalVisible} onDismiss={closeModal}>
          <Dialog.Title>{getModalTitle()}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">{getModalMessage()}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={closeModal}>Cancel</Button>
            <Button 
              mode="contained" 
              onPress={handleConfirmAction}
              buttonColor={actionType === 'unverify' ? '#c62828' : undefined}
            >
              Confirm
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    padding: 40,
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 16,
  },
  card: {
    marginBottom: 12,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userInfo: {
    flex: 1,
  },
  name: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    color: '#666',
  },
});
