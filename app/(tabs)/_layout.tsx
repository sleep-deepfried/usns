import { useRouter, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { BottomNavigation } from 'react-native-paper';
import { useAuth } from '../../src/contexts/AuthContext';
import { getPermissions } from '../../src/utils/permissions';
import HomeScreen from './index';
import DashboardScreen from './dashboard';

export default function TabsLayout() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
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

  // Define routes based on permissions
  const routes = [
    { key: 'home', title: 'Home', focusedIcon: 'home', unfocusedIcon: 'home-outline' },
  ];

  // Only add dashboard for users with access
  if (permissions.canAccessDashboard) {
    routes.push({ key: 'dashboard', title: 'Dashboard', focusedIcon: 'view-dashboard', unfocusedIcon: 'view-dashboard-outline' });
  }

  const renderScene = BottomNavigation.SceneMap({
    home: HomeScreen,
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
