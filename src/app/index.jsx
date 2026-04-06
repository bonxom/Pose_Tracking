import { getAuthSession } from '@/utils/session';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

const BOOTSTRAP_TIMEOUT_MS = 3000;

export default function Index() {
  const [targetRoute, setTargetRoute] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const hardFallbackTimeout = setTimeout(() => {
      if (!isMounted) return;
      setTargetRoute('/(auth)/login');
    }, BOOTSTRAP_TIMEOUT_MS);

    const bootstrapSession = async () => {
      try {
        const session = await getAuthSession();
        if (!isMounted) return;

        setTargetRoute(session ? '/(tabs)/home' : '/(auth)/login');
      } catch (storageError) {
        if (!isMounted) return;
        console.warn('Cannot read login session:', storageError);
        setTargetRoute('/(auth)/login');
      } finally {
        clearTimeout(hardFallbackTimeout);
      }
    };

    bootstrapSession();

    return () => {
      isMounted = false;
      clearTimeout(hardFallbackTimeout);
    };
  }, []);

  if (!targetRoute) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FFFFFF',
        }}
      >
        <ActivityIndicator />
      </View>
    );
  }

  return <Redirect href={targetRoute} />;
}
