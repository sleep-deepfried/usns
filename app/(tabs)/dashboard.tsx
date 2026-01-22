import React, { useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Divider, Appbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { getPermissions } from '../../src/utils/permissions';
import SendNotificationForm from '../../src/components/SendNotificationForm';
import UserManagementList from '../../src/components/UserManagementList';

export default function ManageScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    const permissions = getPermissions(user.role);
    if (!permissions.canAccessDashboard) {
      router.replace('/(tabs)');
    }
  }, [user]);

  if (!user) return null;

  const permissions = getPermissions(user.role);
  if (!permissions.canAccessDashboard) return null;

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Manage" subtitle={user.role} />
        <Appbar.Action icon="logout" onPress={signOut} />
      </Appbar.Header>

      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text variant="headlineSmall" style={styles.sectionTitle}>
            Send Notification
          </Text>
          <SendNotificationForm />
        </View>

        <Divider style={styles.divider} />

        <View style={styles.section}>
          <Text variant="headlineSmall" style={styles.sectionTitle}>
            User Management
          </Text>
          <UserManagementList />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 8,
  },
});
