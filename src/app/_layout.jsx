import { getPostById } from "@/repositories/postRepository";
import {
  resetInAppNotificationRuntime,
  startInAppNotificationRuntime,
  stopInAppNotificationRuntime,
} from "@/services/inAppNotificationRuntime";
import { getAuthSession } from "@/utils/session";
import {
  Stack,
  router,
  usePathname,
  useRouter,
  useSegments,
} from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, Pressable, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

function getToastInitial(value = "") {
  const trimmed = String(value || "").trim();
  return trimmed ? trimmed[0].toUpperCase() : "N";
}

function isGenericToastBody(value = "") {
  const text = String(value || "").trim();

  return (
    !text ||
    text === "Có thông báo mới." ||
    text === "Có thông báo mới" ||
    text === "Bạn có thông báo mới." ||
    text === "Bạn có thông báo mới"
  );
}

function getNotificationTargetId(notification = {}) {
  return String(
    notification.targetId ||
      notification.objectId ||
      notification.raw?.objectId ||
      notification.raw?.object_id ||
      notification.raw?.targetId ||
      notification.raw?.target_id ||
      notification.raw?.postId ||
      notification.raw?.post_id ||
      "",
  ).trim();
}

async function buildToastNotification(notification = {}) {
  const targetId = getNotificationTargetId(notification);
  let body = String(notification.body || "").trim();

  if (isGenericToastBody(body) && targetId) {
    try {
      const post = await getPostById(targetId);
      const postDescription = String(post?.described || "").trim();
      body = postDescription ? `“${postDescription}”` : "";
    } catch (error) {
      console.log("LOAD_NOTIFICATION_POST_BODY_ERROR", error?.message);
      body = "";
    }
  }

  return {
    title: notification?.title || "Bạn có thông báo mới",
    body: isGenericToastBody(body) ? "" : body,
    avatar: notification?.avatar || "",
  };
}

export default function RootLayout() {
  const navigationRouter = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
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
        const isAuthenticated = Boolean(session);
        const isAuthGroup = currentGroup === "(auth)";

        setIsAuthenticated(isAuthenticated);

        if (!isAuthenticated && !isAuthGroup) {
          navigationRouter.replace("/(auth)/login");
          return;
        }

        if (isAuthenticated && isAuthGroup) {
          navigationRouter.replace("/(tabs)/home");
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
  }, [navigationRouter, segments]);

  useEffect(() => {
    if (!isAuthenticated) {
      resetInAppNotificationRuntime();
      setNotificationToast(null);
      return undefined;
    }

    const stopRuntime = startInAppNotificationRuntime({
      getCurrentPath: () => pathnameRef.current,
      onNewInAppNotification: ({ notification }) => {
        console.log("SHOW_NOTIFICATION_TOAST", {
          notification,
          path: pathnameRef.current,
        });

        buildToastNotification(notification).then((toast) => {
          setNotificationToast(toast);

          if (toastTimerRef.current) {
            clearTimeout(toastTimerRef.current);
          }

          toastTimerRef.current = setTimeout(() => {
            setNotificationToast(null);
          }, 3500);
        });
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
        <StatusBar style="auto" />
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
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="post" />
        <Stack.Screen name="conversation" />
        <Stack.Screen name="search" />
        <Stack.Screen name="settings" />
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
            borderRadius: 16,
            paddingHorizontal: 12,
            paddingVertical: 12,
            borderWidth: 1,
            borderColor: "#E5E7EB",
            shadowColor: "#000",
            shadowOpacity: 0.16,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 8,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          {notificationToast.avatar ? (
            <Image
              source={{ uri: notificationToast.avatar }}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: "#E5E7EB",
              }}
            />
          ) : (
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: "#1877F2",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>
                {getToastInitial(notificationToast.title)}
              </Text>
            </View>
          )}

          <View style={{ flex: 1 }}>
            <Text
              numberOfLines={1}
              style={{ fontWeight: "700", color: "#111827", fontSize: 14 }}
            >
              {notificationToast.title}
            </Text>

            {notificationToast.body ? (
              <Text
                numberOfLines={2}
                style={{ color: "#4B5563", fontSize: 13, marginTop: 2 }}
              >
                {notificationToast.body}
              </Text>
            ) : null}
          </View>
        </Pressable>
      ) : null}
    </SafeAreaProvider>
  );
}
