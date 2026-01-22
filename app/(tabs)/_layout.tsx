import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { BottomNavigation } from 'react-native-paper';
import { useAuth } from '../../src/contexts/AuthContext';
import { getPermissions } from '../../src/utils/permissions';
import HomeScreen from './index';
import DashboardScreen from './dashboard';
import ReportsScreen from './reports';
import FeedbackListScreen from './feedbacklist';

export default function TabsLayout() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/(auth)/login');
    }
  }, [user, loading]);

  if (loading || !user) {
    return null;
  }

  const permissions = getPermissions(user.role);

  // Define routes based on role
  const routes: { key: string; title: string; focusedIcon: string; unfocusedIcon: string }[] = [
    { key: 'home', title: 'Home', focusedIcon: 'home', unfocusedIcon: 'home-outline' },
    { key: 'reports', title: 'Reports', focusedIcon: 'file-document', unfocusedIcon: 'file-document-outline' },
  ];

  // Add Feedback tab for staff (to view/reply) or verified students (to see their feedback)
  if (permissions.canViewFeedback || permissions.canSendFeedback) {
    routes.push({ key: 'feedback', title: 'Feedback', focusedIcon: 'message', unfocusedIcon: 'message-outline' });
  }

  // Only add admin panel for users with access
  if (permissions.canAccessDashboard) {
    routes.push({ key: 'dashboard', title: 'Admin', focusedIcon: 'cog', unfocusedIcon: 'cog-outline' });
  }

  const renderScene = BottomNavigation.SceneMap({
    home: HomeScreen,
    reports: ReportsScreen,
    feedback: FeedbackListScreen,
    dashboard: permissions.canAccessDashboard ? DashboardScreen : HomeScreen,
  });

  return (
    <View style={styles.container}>
      <BottomNavigation
        navigationState={{ index, routes }}
        onIndexChange={setIndex}
        renderScene={renderScene}
        barStyle={styles.bottomBar}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bottomBar: {
    backgroundColor: '#fff',
  },
});
