import React, { useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text, ActivityIndicator, Appbar, FAB, Portal, Modal } from 'react-native-paper';
import { useAuth } from '../../src/contexts/AuthContext';
import { useReports } from '../../src/contexts/ReportContext';
import ReportItem from '../../src/components/ReportItem';
import CreateReportForm from '../../src/components/CreateReportForm';

export default function ReportsScreen() {
  const { user, signOut } = useAuth();
  const { reports, loading } = useReports();
  const [showCreateForm, setShowCreateForm] = useState(false);

  const canCreateReport = user?.role === 'Student' || user?.role === 'Verified_Student';

  if (loading || !user) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Reports" subtitle={canCreateReport ? 'Your Reports' : 'All Reports'} />
        <Appbar.Action icon="logout" onPress={signOut} />
      </Appbar.Header>

      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ReportItem report={item} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              No reports yet
            </Text>
          </View>
        }
      />

      {canCreateReport && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => setShowCreateForm(true)}
        />
      )}

      <Portal>
        <Modal
          visible={showCreateForm}
          onDismiss={() => setShowCreateForm(false)}
          contentContainerStyle={styles.modal}
        >
          <CreateReportForm onSuccess={() => setShowCreateForm(false)} />
        </Modal>
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
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  modal: {
    margin: 20,
  },
});
