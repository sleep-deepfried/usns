import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Card, HelperText } from 'react-native-paper';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { getPermissions } from '../utils/permissions';

export default function SendNotificationForm() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { sendNotification } = useNotifications();
  const { user } = useAuth();

  if (!user) return null;

  const permissions = getPermissions(user.role);
  if (!permissions.canSendNotification) return null;

  const handleSubmit = async () => {
    setError('');

    // Validation
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (title.length > 100) {
      setError('Title is required (max 100 characters)');
      return;
    }

    if (!message.trim()) {
      setError('Message is required');
      return;
    }

    if (message.length > 1000) {
      setError('Message is required (max 1000 characters)');
      return;
    }

    setLoading(true);
    try {
      await sendNotification(title.trim(), message.trim());
      setTitle('');
      setMessage('');
      alert('Notification sent successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <TextInput
          label="Title"
          value={title}
          onChangeText={setTitle}
          mode="outlined"
          maxLength={100}
          style={styles.input}
          error={!!error && !title.trim()}
        />

        <HelperText type="info" visible={true}>
          {title.length}/100 characters
        </HelperText>

        <TextInput
          label="Message"
          value={message}
          onChangeText={setMessage}
          mode="outlined"
          multiline={true}
          numberOfLines={6}
          maxLength={1000}
          style={styles.input}
          error={!!error && !message.trim()}
        />

        <HelperText type="info" visible={true}>
          {message.length}/1000 characters
        </HelperText>

        {error ? (
          <HelperText type="error" visible={true}>
            {error}
          </HelperText>
        ) : null}

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          style={styles.button}
          icon="send"
        >
          Send Notification
        </Button>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    elevation: 2,
  },
  input: {
    marginBottom: 4,
  },
  button: {
    marginTop: 16,
  },
});
