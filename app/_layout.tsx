import { Slot } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider } from '../src/contexts/AuthContext';
import { NotificationProvider } from '../src/contexts/NotificationContext';
import { FeedbackProvider } from '../src/contexts/FeedbackContext';
import { ReportProvider } from '../src/contexts/ReportContext';
import { BannerProvider } from '../src/contexts/BannerContext';
import { BannerDisplay } from '../src/components/Banner';

export default function RootLayout() {
  return (
    <PaperProvider>
      <BannerProvider>
        <AuthProvider>
          <NotificationProvider>
            <FeedbackProvider>
              <ReportProvider>
                <View style={styles.container}>
                  <BannerDisplay />
                  <Slot />
                </View>
              </ReportProvider>
            </FeedbackProvider>
          </NotificationProvider>
        </AuthProvider>
      </BannerProvider>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
