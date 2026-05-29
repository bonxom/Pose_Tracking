import {
  startInAppNotificationRuntime,
  stopInAppNotificationRuntime,
} from "@/services/pushNotifications";
import { getAuthSession } from "@/utils/session";
import { Stack, router, usePathname, useRouter, useSegments } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  const navRouter = useRouter();
  const segments = useSegments();
  const pathname = usePathname();

  const pathnameRef = useRef(pathname);
  const toastTimerRef = useRef(null);

  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notificationToast, setNotificationToast] = useState(null);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    let isMounted = true;

    const syncSessionAndGuardRoute = async () => {
      try {
        const session = await getAuthSession();
        if (!isMounted) return;

        const currentGroup = segments[0];
        const authenticated = Boolean(session);
        const isAuthGroup = currentGroup === "(auth)";
        const isSignupSuccess =
          currentGroup === "(auth)" && segments[1] === "signup-success";

        setIsAuthenticated(authenticated);

        if (!authenticated && !isAuthGroup) {
          navRouter.replace("/(auth)/login");
          return;
        }

        if (authenticated && isAuthGroup && !isSignupSuccess) {
          navRouter.replace("/(tabs)/home");
        }
      } finally {
        if (isMounted) {
          setIsBootstrapping(false);
        }
      }
    };

    syncSessionAndGuardRoute();

    return () => {
      isMounted = false;
    };
  }, [navRouter, segments]);

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined;
    }

    const stopRuntime = startInAppNotificationRuntime({
      getCurrentPath: () => pathnameRef.current,
      onOpen: () => {
        router.push("/(tabs)/notifications");
      },
      onNewInAppNotification: ({ unreadCount }) => {
        console.log("SHOW_NOTIFICATION_TOAST", {
          unreadCount,
          path: pathnameRef.current,
        });

        setNotificationToast({
          title: "Bạn có thông báo mới",
          body: `Bạn có ${unreadCount} thông báo chưa đọc.`,
        });

        if (toastTimerRef.current) {
          clearTimeout(toastTimerRef.current);
        }

        toastTimerRef.current = setTimeout(() => {
          setNotificationToast(null);
        }, 3500);
      },
    });

    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
        toastTimerRef.current = null;
      }

      stopRuntime?.();
      stopInAppNotificationRuntime();
    };
  }, [isAuthenticated]);

  if (isBootstrapping) {
    return (
      <SafeAreaProvider>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#FFFFFF",
          }}
        >
          <ActivityIndicator />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="post" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="chat" />
          <Stack.Screen name="profile" />
        </Stack>

        {notificationToast && isAuthenticated ? (
          <Pressable
            onPress={() => {
              setNotificationToast(null);
              router.push("/(tabs)/notifications");
            }}
            style={{
              position: "absolute",
              top: 64,
              left: 16,
              right: 16,
              zIndex: 9999,
              backgroundColor: "#FFFFFF",
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              shadowColor: "#000",
              shadowOpacity: 0.16,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 8,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "800", color: "#111827" }}>
              {notificationToast.title}
            </Text>
            <Text style={{ marginTop: 4, fontSize: 13, color: "#4B5563" }}>
              {notificationToast.body}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaProvider>
  );
}
