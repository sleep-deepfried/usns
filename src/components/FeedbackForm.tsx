import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Card, HelperText } from 'react-native-paper';
import { useFeedback } from '../contexts/FeedbackContext';

interface FeedbackFormProps {
  notificationId: string;
  onClose: () => void;
}

export default function FeedbackForm({ notificationId, onClose }: FeedbackFormProps) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { sendFeedback } = useFeedback();

  const handleSubmit = async () => {
    setError('');

    // Validation
    if (!message.trim()) {
      setError('Feedback message is required');
      return;
    }

    if (message.length > 500) {
      setError('Feedback message is required (max 500 characters)');
      return;
    }

    setLoading(true);
    try {
      await sendFeedback(notificationId, message.trim());
      setMessage('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to send feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <TextInput
          label="Your Feedback"
          value={message}
          onChangeText={setMessage}
          mode="outlined"
          multiline={true}
          numberOfLines={4}
          maxLength={500}
          style={styles.input}
          error={!!error}
        />

        {error ? (
          <HelperText type="error" visible={true}>
            {error}
          </HelperText>
        ) : (
          <HelperText type="info" visible={true}>
            {message.length}/500 characters
          </HelperText>
        )}

        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={onClose}
            disabled={loading}
            style={styles.button}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            Submit
          </Button>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    elevation: 4,
  },
  input: {
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  button: {
    marginLeft: 8,
  },
});
