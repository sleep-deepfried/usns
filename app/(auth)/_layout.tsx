import { Slot, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '../../src/contexts/AuthContext';

export default function AuthLayout() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // If user is logged in, redirect to tabs
    if (user) {
      console.log('User authenticated in auth layout, redirecting to tabs');
      router.replace('/(tabs)');
    }
  }, [user, loading]);

  return <Slot />;
}
