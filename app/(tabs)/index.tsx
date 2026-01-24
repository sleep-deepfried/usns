import React, { useState } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Alert } from 'react-native';
import { Text, ActivityIndicator, Appbar, Avatar, Chip, Button } from 'react-native-paper';
import { useAuth } from '../../src/contexts/AuthContext';
import { useNotifications } from '../../src/contexts/NotificationContext';
import NotificationItem from '../../src/components/NotificationItem';
import { sendPushNotificationToUser } from '../../src/services/pushNotifications';

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const { notifications, loading } = useNotifications();
  const [testLoading, setTestLoading] = useState(false);

  const handleTestPush = async () => {
    if (!user) return;
    
    setTestLoading(true);
    try {
      await sendPushNotificationToUser(
        user.uid,
        '🔔 Test Push Notification',
        'This is a test push notification! If you see this, push notifications are working.'
      );
      Alert.alert('Success', 'Test push notification sent! Check your device notifications.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send test notification');
    } finally {
      setTestLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  const roleDisplay = user.role === 'Verified_Student' ? 'Verified Student' : user.role;

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="USNS" />
        <Appbar.Action icon="logout" onPress={signOut} />
      </Appbar.Header>

      <View style={styles.userHeader}>
        <Avatar.Text size={50} label={initials} style={styles.avatar} />
        <View style={styles.userInfo}>
          <Text variant="titleLarge" style={styles.userName}>
            {user.firstName} {user.lastName}
          </Text>
          <Chip 
            mode="flat" 
            compact 
            style={[styles.roleChip, { backgroundColor: getRoleColor(user.role) }]}
            textStyle={styles.roleText}
          >
            {roleDisplay}
          </Chip>
        </View>
        <Button 
          mode="outlined" 
          compact 
          onPress={handleTestPush}
          loading={testLoading}
          icon="bell-ring"
        >
          Test Push
        </Button>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <NotificationItem notification={item} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              No notifications yet
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => {}} />
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
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatar: {
    backgroundColor: '#6200ee',
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontWeight: 'bold',
    color: '#333',
  },
  roleChip: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  roleText: {
    color: '#fff',
    fontSize: 11,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
  },
});

function getRoleColor(role: string): string {
  switch (role) {
    case 'Administrator':
      return '#d32f2f';
    case 'Teacher':
      return '#1976d2';
    case 'Verified_Student':
      return '#388e3c';
    default:
      return '#757575';
  }
}
