import { Slot } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider } from '../src/contexts/AuthContext';
import { NotificationProvider } from '../src/contexts/NotificationContext';
import { FeedbackProvider } from '../src/contexts/FeedbackContext';
import { ReportProvider } from '../src/contexts/ReportContext';

export default function RootLayout() {
  return (
    <PaperProvider>
      <AuthProvider>
        <NotificationProvider>
          <FeedbackProvider>
            <ReportProvider>
              <Slot />
            </ReportProvider>
          </FeedbackProvider>
        </NotificationProvider>
      </AuthProvider>
    </PaperProvider>
  );
}
