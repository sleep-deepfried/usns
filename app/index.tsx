import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useAuth } from '../src/contexts/AuthContext';

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (loading) return;

    // Prevent multiple navigations
    if (hasNavigated.current) return;

    const timer = setTimeout(() => {
      hasNavigated.current = true;
      if (user) {
        console.log('User logged in, navigating to tabs:', user.email);
        router.replace('/(tabs)');
      } else {
        console.log('No user, navigating to login');
        router.replace('/(auth)/login');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [user, loading]);

  // Reset navigation flag when user changes (for logout scenarios)
  useEffect(() => {
    if (!user) {
      hasNavigated.current = false;
    }
  }, [user]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>USNS</Text>
      <ActivityIndicator size="large" color="#6200ee" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
