import UserAvatar from "@/components/common/UserAvatar";
import colors from "@/constants/colors";
import { getPostById } from "@/repositories/postRepository";
import { checkNewVersion } from "@/repositories/settingsRepository";
import {
  resetInAppNotificationRuntime,
  startInAppNotificationRuntime,
  stopInAppNotificationRuntime,
} from "@/services/pushNotifications";
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
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

function isVersionLessThan(v1, v2) {
  const parts1 = String(v1 || "")
    .split(".")
    .map(Number);
  const parts2 = String(v2 || "")
    .split(".")
    .map(Number);
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 < p2) return true;
    if (p1 > p2) return false;
  }
  return false;
}

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
  const navRouter = useRouter();
  const segments = useSegments();
  const pathname = usePathname();

  const pathnameRef = useRef(pathname);
  const toastTimerRef = useRef(null);

  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notificationToast, setNotificationToast] = useState(null);
  const [updateState, setUpdateState] = useState({
    showModal: false,
    required: false,
    url: "",
    latestVersion: "",
  });

  useEffect(() => {
    if (!isAuthenticated) {
      setUpdateState({
        showModal: false,
        required: false,
        url: "",
        latestVersion: "",
      });
      return;
    }

    let isMounted = true;

    const checkAppVersion = async () => {
      try {
        const data = await checkNewVersion();
        if (!isMounted) return;

        if (data && data.version) {
          const nowVersion = data.now || "1.0.0";
          const latestVersion = data.version.version || "1.1.0";

          if (isVersionLessThan(nowVersion, latestVersion)) {
            setUpdateState({
              showModal: true,
              required:
                data.version.required === "1" || data.version.required === 1,
              url: data.version.url || "https://example.com/app",
              latestVersion,
            });
          }
        }
      } catch (error) {
        console.warn(
          "[VERSION CHECK] Failed to check new version:",
          error.message,
        );
      }
    };

    checkAppVersion();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    let isMounted = true;

    const syncSessionAndGuardRoute = async () => {
      try {
        const session = await getAuthSession();

        if (!isMounted) {
          return;
        }

        const currentGroup = segments[0];
        const authenticated = Boolean(session);
        const isAuthGroup = currentGroup === "(auth)";

        setIsAuthenticated(authenticated);

        if (!authenticated && !isAuthGroup) {
          navRouter.replace("/(auth)/login");
          return;
        }

        if (authenticated && isAuthGroup) {
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
      resetInAppNotificationRuntime?.();
      setNotificationToast(null);
      return undefined;
    }

    const stopRuntime = startInAppNotificationRuntime({
      getCurrentPath: () => pathnameRef.current,
      onOpen: () => {
        router.push("/(tabs)/notifications");
      },
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
      stopInAppNotificationRuntime?.();
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
        <Stack.Screen name="search/index" />
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
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <UserAvatar
              uri={notificationToast?.avatar || ""}
              size={44}
              bordered={true}
            />

            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 15,
                  fontWeight: "800",
                  color: "#111827",
                }}
              >
                {notificationToast.title}
              </Text>

              {notificationToast.body ? (
                <Text
                  numberOfLines={2}
                  style={{
                    marginTop: 3,
                    fontSize: 13,
                    color: "#4B5563",
                  }}
                >
                  {notificationToast.body}
                </Text>
              ) : null}
            </View>
          </View>
        </Pressable>
      ) : null}

      <Modal
        visible={updateState.showModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!updateState.required) {
            setUpdateState((prev) => ({ ...prev, showModal: false }));
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.iconCircle}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>

            <Text style={styles.modalTitle}>Cập nhật ứng dụng</Text>
            <Text style={styles.modalDescription}>
              {updateState.required
                ? "Vui lòng cập nhật lên phiên bản mới nhất để tiếp tục sử dụng ứng dụng."
                : "Một phiên bản mới đã sẵn sàng. Hãy cập nhật để trải nghiệm các tính năng mới nhất!"}
            </Text>

            <View style={styles.versionBadgeContainer}>
              <Text style={styles.versionBadgeText}>
                Phiên bản mới: {updateState.latestVersion}
              </Text>
            </View>

            <Text
              style={styles.urlText}
              numberOfLines={1}
              ellipsizeMode="middle"
              selectable
            >
              {updateState.url}
            </Text>

            <View style={styles.buttonContainer}>
              <Pressable
                style={({ pressed }) => [
                  styles.updateButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={async () => {
                  try {
                    await Linking.openURL(updateState.url);
                  } catch (err) {
                    console.warn("Failed to open update URL:", err.message);
                  }
                }}
              >
                <Text style={styles.updateButtonText}>Cập nhật ngay</Text>
              </Pressable>

              {!updateState.required && (
                <Pressable
                  style={({ pressed }) => [
                    styles.laterButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => {
                    setUpdateState((prev) => ({ ...prev, showModal: false }));
                  }}
                >
                  <Text style={styles.laterButtonText}>Để sau</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#EEF2F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 4,
    borderColor: "#E2E8F0",
  },
  newBadgeText: {
    fontSize: 14,
    fontWeight: "900",
    color: colors.primary,
    letterSpacing: 0.5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 8,
    textAlign: "center",
  },
  modalDescription: {
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
  versionBadgeContainer: {
    backgroundColor: "#EEF2FF",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  versionBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  urlText: {
    fontSize: 12,
    color: colors.primary,
    textAlign: "center",
    marginBottom: 20,
    padding: 8,
  },
  buttonContainer: {
    width: "100%",
    gap: 8,
  },
  updateButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  updateButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  laterButton: {
    backgroundColor: "#F1F5F9",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  laterButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#475569",
  },
  buttonPressed: {
    opacity: 0.85,
  },
});
