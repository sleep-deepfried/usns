import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { BottomNavigation } from 'react-native-paper';
import { useAuth } from '../../src/contexts/AuthContext';
import { getPermissions } from '../../src/utils/permissions';
import HomeScreen from './index';
import ManageScreen from './dashboard';
import ReportsScreen from './reports';
import FeedbacksScreen from './feedbacks';
import MyFeedbackScreen from './myfeedback';

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

  // Add My Feedback tab for Students (to see their own feedback and replies)
  if (!permissions.canViewFeedback) {
    routes.push({ key: 'myfeedback', title: 'My Feedback', focusedIcon: 'message-reply', unfocusedIcon: 'message-reply-outline' });
  }

  // Add Feedbacks tab for Teachers/Admins (to manage all feedback)
  if (permissions.canViewFeedback) {
    routes.push({ key: 'feedbacks', title: 'Feedbacks', focusedIcon: 'message-text', unfocusedIcon: 'message-text-outline' });
  }

  // Add Manage tab for Teachers/Admins
  if (permissions.canAccessDashboard) {
    routes.push({ key: 'manage', title: 'Manage', focusedIcon: 'cog', unfocusedIcon: 'cog-outline' });
  }

  const sceneMap: Record<string, React.ComponentType<any>> = {
    home: HomeScreen,
    reports: ReportsScreen,
    myfeedback: MyFeedbackScreen,
    feedbacks: FeedbacksScreen,
    manage: ManageScreen,
  };

  const renderScene = BottomNavigation.SceneMap(sceneMap);

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
