import SearchButton from "@/components/common/SearchButton";
import UserAvatar from "@/components/common/UserAvatar";
import colors from "@/constants/colors";
import sizes from "@/constants/sizes";
import { logoutSession } from "@/repositories/authRepository";
import globalStyles from "@/styles/global.styles";
import { getAuthSession, subscribeAuthSession } from "@/utils/session";
import { clearCurrentUserSession } from "@/utils/userSessionCleanup";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

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
        <Ionicons
          name={icon}
          size={22}
          color={danger ? "#DC2626" : "#394150"}
        />
      </View>
      <Text style={[styles.rowText, danger && styles.rowTextDanger]}>
        {label}
      </Text>
      {trailing ? (
        <Ionicons name="chevron-down" size={20} color="#65676B" />
      ) : null}
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

    const unsubscribe = subscribeAuthSession((value) => {
      if (mounted) setSession(value);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      getAuthSession()
        .then((value) => {
          if (active) {
            setSession(value);
          }
        })
        .catch(() => {});

      return () => {
        active = false;
      };
    }, []),
  );

  const goPlaceholder = (title) => {
    Alert.alert(title, "Mục này có thể nối backend sau.");
  };

  const runLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);

    const currentSession =
      session || (await getAuthSession().catch(() => null));

    try {
      await clearCurrentUserSession();
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
    <>
      <View style={globalStyles.headerTopRow}>
        <Text style={globalStyles.headerTitle}>Menu</Text>
        <SearchButton />
      </View>

      <View style={styles.content}>
        <Pressable
          style={styles.profileRow}
          onPress={() => router.push("/(tabs)/profile")}
        >
          <UserAvatar uri={session?.avatar || ""} size={48} />
          <View style={styles.profileTextBlock}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileSubtext}>Xem trang cá nhân của bạn</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#65676B" />
        </Pressable>

        <View style={styles.shortcutGrid}>
          <MenuShortcut
            icon="notifications"
            label="Thông báo"
            color="#F59E0B"
            onPress={() => router.push("/(tabs)/notifications")}
          />
          <MenuShortcut
            icon="bookmark"
            label="Đã lưu"
            color="#A855F7"
            onPress={() => goPlaceholder("Đã lưu")}
          />
          <MenuShortcut
            icon="flag"
            label="Trang"
            color="#F97316"
            onPress={() => goPlaceholder("Trang")}
          />
          <MenuShortcut
            icon="calendar"
            label="Sự kiện"
            color="#EF4444"
            onPress={() => goPlaceholder("Sự kiện")}
          />
          <MenuShortcut
            icon="game-controller"
            label="Chơi game"
            color="#2563EB"
            onPress={() => goPlaceholder("Chơi game")}
          />
        </View>

        <View style={styles.section}>
          <MenuRow
            icon="help-circle-outline"
            label="Trợ giúp & hỗ trợ"
            onPress={() => router.push("/settings/policies")}
          />
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
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: sizes.md,
    paddingBottom: sizes.xl,
    gap: sizes.md,
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
