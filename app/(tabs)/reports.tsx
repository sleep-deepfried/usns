import React, { useState } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import {
  Text,
  Card,
  Button,
  FAB,
  Portal,
  Modal,
  TextInput,
  Chip,
  ActivityIndicator,
  Appbar,
} from 'react-native-paper';
import { useAuth } from '../../src/contexts/AuthContext';
import { useReports } from '../../src/contexts/ReportContext';
import { Report } from '../../src/types/report';
import ReportDetail from '../../src/components/ReportDetail';

export default function ReportsScreen() {
  const { user, signOut } = useAuth();
  const { reports, loading, createReport } = useReports();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!user) return null;

  const isStudent = user.role === 'Student' || user.role === 'Verified_Student';

  const handleCreateReport = async () => {
    if (!title.trim() || !message.trim()) return;

    setSubmitting(true);
    try {
      await createReport(title.trim(), message.trim());
      setTitle('');
      setMessage('');
      setModalVisible(false);
      alert('Report submitted successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: Report['status']) => {
    switch (status) {
      case 'pending':
        return '#ff9800';
      case 'in_progress':
        return '#2196f3';
      case 'resolved':
        return '#4caf50';
      default:
        return '#666';
    }
  };

  const renderReport = ({ item }: { item: Report }) => (
    <Card
      style={styles.card}
      onPress={() => setSelectedReport(item)}
    >
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text variant="titleMedium" style={styles.title}>
            {item.title}
          </Text>
          <Chip
            mode="flat"
            style={{ backgroundColor: getStatusColor(item.status) }}
            textStyle={{ color: '#fff', fontSize: 10 }}
          >
            {item.status.replace('_', ' ').toUpperCase()}
          </Chip>
        </View>
        <Text variant="bodyMedium" numberOfLines={2} style={styles.message}>
          {item.message}
        </Text>
        <Text variant="bodySmall" style={styles.meta}>
          By {item.studentName} • {item.createdAt.toLocaleDateString()}
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

  // Show report detail if selected
  if (selectedReport) {
    return (
      <ReportDetail
        report={selectedReport}
        onBack={() => setSelectedReport(null)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Reports" subtitle={`${user.firstName} ${user.lastName}`} />
        <Appbar.Action icon="logout" onPress={signOut} />
      </Appbar.Header>

      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        renderItem={renderReport}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              {isStudent ? 'No reports submitted yet' : 'No reports to review'}
            </Text>
          </View>
        }
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => {}} />}
      />

      {isStudent && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => setModalVisible(true)}
          label="New Report"
        />
      )}

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>
            Submit a Report
          </Text>
          <TextInput
            label="Title"
            value={title}
            onChangeText={setTitle}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Description"
            value={message}
            onChangeText={setMessage}
            mode="outlined"
            multiline
            numberOfLines={4}
            style={styles.input}
          />
          <View style={styles.modalActions}>
            <Button onPress={() => setModalVisible(false)}>Cancel</Button>
            <Button
              mode="contained"
              onPress={handleCreateReport}
              loading={submitting}
              disabled={submitting || !title.trim() || !message.trim()}
            >
              Submit
            </Button>
          </View>
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
    paddingBottom: 100,
  },
  card: {
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  message: {
    color: '#666',
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
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  modal: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 8,
  },
  modalTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
});
