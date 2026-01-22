import { Slot } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider } from '../src/contexts/AuthContext';
import { NotificationProvider } from '../src/contexts/NotificationContext';
import { FeedbackProvider } from '../src/contexts/FeedbackContext';

export default function RootLayout() {
  return (
    <PaperProvider>
      <AuthProvider>
        <NotificationProvider>
          <FeedbackProvider>
            <Slot />
          </FeedbackProvider>
        </NotificationProvider>
      </AuthProvider>
    </PaperProvider>
  );
}
