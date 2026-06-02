import { logoutSession } from "@/repositories/authRepository";
import { clearNotificationState } from "@/services/notificationStore";
import colors from "@/constants/colors";
import sizes from "@/constants/sizes";
import { clearAuthSession, getAuthSession } from "@/utils/session";
import { CACHE_KEY_PROFILE } from "@/utils/cacheStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function initials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "U";
}

function MenuShortcut({ icon, label, color = "#0866FF", onPress }) {
  return (
    <Pressable style={styles.shortcutCard} onPress={onPress}>
      <Ionicons name={icon} size={24} color={color} />
      <Text style={styles.shortcutText}>{label}</Text>
    </Pressable>
  );
}

function MenuRow({ icon, label, onPress, danger = false, trailing = true }) {
  return (
    <Pressable style={styles.menuRow} onPress={onPress}>
      <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
        <Ionicons name={icon} size={22} color={danger ? "#DC2626" : "#394150"} />
      </View>
      <Text style={[styles.rowText, danger && styles.rowTextDanger]}>{label}</Text>
      {trailing ? <Ionicons name="chevron-down" size={20} color="#65676B" /> : null}
    </Pressable>
  );
}

export default function MenuScreen() {
  const [session, setSession] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let mounted = true;
    getAuthSession()
      .then((value) => {
        if (mounted) setSession(value);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const goPlaceholder = (title) => {
    Alert.alert(title, "Mục này có thể nối backend sau.");
  };

  const runLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);

    const currentSession = session || (await getAuthSession().catch(() => null));

    try {
      await clearAuthSession();
      clearNotificationState();
      await AsyncStorage.removeItem(CACHE_KEY_PROFILE);
    } finally {
      router.replace("/(auth)/login");
    }

    logoutSession(currentSession).catch((error) => {
      console.info("LOGOUT_BACKEND_BEST_EFFORT_FAILED", error?.message);
    });
  };

  const confirmLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất khỏi tài khoản này?", [
      { text: "Hủy", style: "cancel" },
      { text: "Đăng xuất", style: "destructive", onPress: runLogout },
    ]);
  };

  const displayName = session?.displayName || session?.username || "Người dùng";

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Menu</Text>
          <Pressable style={styles.headerIcon} onPress={() => router.push("/settings")}>
            <Ionicons name="settings" size={22} color="#050505" />
          </Pressable>
        </View>

        <Pressable style={styles.profileRow} onPress={() => router.push("/(tabs)/profile")}>
          <View style={styles.avatar}>
            {session?.avatar ? (
              <Image source={{ uri: session.avatar }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{initials(displayName)}</Text>
            )}
          </View>
          <View style={styles.profileTextBlock}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileSubtext}>Xem trang cá nhân của bạn</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#65676B" />
        </Pressable>

        <View style={styles.shortcutGrid}>
          <MenuShortcut icon="notifications" label="Thông báo" color="#F59E0B" onPress={() => router.push("/(tabs)/notifications")} />
          <MenuShortcut icon="bookmark" label="Đã lưu" color="#A855F7" onPress={() => goPlaceholder("Đã lưu")} />
          <MenuShortcut icon="flag" label="Trang" color="#F97316" onPress={() => goPlaceholder("Trang")} />
          <MenuShortcut icon="calendar" label="Sự kiện" color="#EF4444" onPress={() => goPlaceholder("Sự kiện")} />
          <MenuShortcut icon="game-controller" label="Chơi game" color="#2563EB" onPress={() => goPlaceholder("Chơi game")} />
        </View>

        <View style={styles.section}>
          <MenuRow icon="grid-outline" label="Xem thêm" onPress={() => goPlaceholder("Xem thêm")} />
          <MenuRow icon="help-circle-outline" label="Trợ giúp & hỗ trợ" onPress={() => goPlaceholder("Trợ giúp & hỗ trợ")} />
          <MenuRow
            icon="settings-outline"
            label="Cài đặt"
            onPress={() => router.push("/settings")}
          />
          <MenuRow
            icon="log-out-outline"
            label={loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
            danger
            trailing={false}
            onPress={confirmLogout}
          />
        </View>

        {loggingOut ? (
          <View style={styles.logoutState}>
            <ActivityIndicator color="#0866FF" />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F0F2F5",
  },
  content: {
    paddingHorizontal: sizes.md,
    paddingBottom: sizes.xl,
    gap: sizes.md,
  },
  header: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "900",
    color: "#050505",
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E4E6EB",
  },
  profileRow: {
    minHeight: 76,
    borderRadius: 8,
    padding: sizes.md,
    flexDirection: "row",
    alignItems: "center",
    gap: sizes.sm,
    backgroundColor: colors.white,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DDE7F8",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarText: {
    color: "#0866FF",
    fontSize: 16,
    fontWeight: "900",
  },
  profileTextBlock: {
    flex: 1,
  },
  profileName: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "900",
    color: "#050505",
  },
  profileSubtext: {
    marginTop: 2,
    fontSize: 13,
    color: "#65676B",
  },
  shortcutGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: sizes.sm,
  },
  shortcutCard: {
    width: "48.8%",
    minHeight: 76,
    borderRadius: 8,
    padding: sizes.md,
    justifyContent: "center",
    gap: sizes.xs,
    backgroundColor: colors.white,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  shortcutText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "900",
    color: "#050505",
  },
  section: {
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: colors.white,
  },
  menuRow: {
    minHeight: 58,
    paddingHorizontal: sizes.md,
    flexDirection: "row",
    alignItems: "center",
    gap: sizes.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#DADDE1",
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E4E6EB",
  },
  rowIconDanger: {
    backgroundColor: "#FEE2E2",
  },
  rowText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
    color: "#050505",
  },
  rowTextDanger: {
    color: "#DC2626",
  },
  logoutState: {
    alignItems: "center",
    paddingVertical: sizes.md,
  },
});
