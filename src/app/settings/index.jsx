import Screen from "@/components/common/Screen";
import ProfileIcon from "@/components/icons/ProfileIcon";
import colors from "@/constants/colors";
import sizes from "@/constants/sizes";
import { logoutSession } from "@/repositories/authRepository";
import { clearNotificationState } from "@/services/notificationStore";
import { CACHE_KEY_PROFILE } from "@/utils/cacheStore";
import { clearAuthSession, getAuthSession } from "@/utils/session";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import {
  Alert,
  BackHandler,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

function SettingsRow({ icon, title, subtitle, onPress }) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.rowIcon}>
        <ProfileIcon name={icon} size={26} color={colors.ink} />
      </View>
      <View style={styles.rowTextBlock}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      <ProfileIcon name="chevron-forward" size={22} color={colors.inkMuted} />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const goBackToPreviousScreen = () => {
    if (router.canGoBack?.()) {
      router.back();
      return;
    }

    router.replace("/(tabs)/menu");
  };

  const runLogout = async () => {
    const currentSession = await getAuthSession().catch(() => null);
    await clearAuthSession();
    clearNotificationState();
    await AsyncStorage.removeItem(CACHE_KEY_PROFILE);
    router.replace("/(auth)/login");

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

  const confirmExit = () => {
    Alert.alert("Thoát ứng dụng", "Bạn muốn thoát khỏi ứng dụng?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Thoát",
        style: "destructive",
        onPress: () => {
          if (Platform.OS === "web") {
            Alert.alert(
              "Thoát ứng dụng",
              "Bạn có thể đóng tab trình duyệt hiện tại.",
            );
            return;
          }
          BackHandler.exitApp();
        },
      },
    ]);
  };

  const openSearch = () => router.push("/search");

  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Pressable
              style={styles.backButton}
              onPress={goBackToPreviousScreen}
              accessibilityRole="button"
              accessibilityLabel="Quay lại"
            >
              <ProfileIcon name="chevron-back" size={24} color={colors.ink} />
            </Pressable>
            <Text style={styles.title}>Cài đặt</Text>
            <Pressable
              style={styles.searchButton}
              onPress={openSearch}
              accessibilityRole="button"
              accessibilityLabel="Tìm kiếm"
            >
              <ProfileIcon name="search" size={24} color={colors.ink} />
            </Pressable>
          </View>
          <Text style={styles.subtitle}>
            Tài khoản, thông báo, bảo mật và thiết bị.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Cài đặt tài khoản</Text>
          <SettingsRow
            icon="person-circle-outline"
            title="Thông tin cá nhân"
            subtitle="Cập nhật tên hiển thị"
            onPress={() => router.push("/settings/profile-edit")}
          />
          <SettingsRow
            icon="key-outline"
            title="Bảo mật và đăng nhập"
            subtitle="Đăng nhập / Đổi mật khẩu"
            onPress={() => router.push("/settings/change-password")}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Thông báo</Text>
          <SettingsRow
            icon="notifications-outline"
            title="Cài đặt thông báo"
            subtitle="Thông báo đẩy, âm thanh và rung"
            onPress={() => router.push("/settings/push")}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Quyền riêng tư</Text>
          <SettingsRow
            icon="ban-outline"
            title="Chặn"
            subtitle="Xem, chặn và bỏ chặn người dùng"
            onPress={() => router.push("/settings/blocks")}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Trợ giúp & hỗ trợ</Text>
          <SettingsRow
            icon="document-text-outline"
            title="Điều khoản & chính sách"
            subtitle="Các quy định sử dụng hệ thống"
            onPress={() => router.push("/settings/policies")}
          />
        </View>

        <View style={styles.section}>
          <SettingsRow
            icon="log-out-outline"
            title="Đăng xuất"
            subtitle="Kết thúc phiên đăng nhập hiện tại"
            onPress={confirmLogout}
          />
          <SettingsRow
            icon="exit-outline"
            title="Thoát"
            subtitle="Thoát khỏi ứng dụng"
            onPress={confirmExit}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: 0,
  },
  content: {
    paddingBottom: sizes.xl,
  },
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: sizes.lg,
    paddingTop: sizes.lg,
    paddingBottom: sizes.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderMuted,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: sizes.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
  },
  title: {
    flex: 1,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
    color: colors.ink,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
  },
  subtitle: {
    marginTop: sizes.xs,
    fontSize: 15,
    lineHeight: 21,
    color: colors.inkMuted,
  },
  section: {
    marginTop: sizes.md,
    backgroundColor: colors.white,
  },
  sectionLabel: {
    paddingHorizontal: sizes.lg,
    paddingTop: sizes.lg,
    paddingBottom: sizes.sm,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
    color: colors.ink,
  },
  row: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: sizes.lg,
    paddingVertical: sizes.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderMuted,
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
    marginRight: sizes.md,
  },
  rowTextBlock: {
    flex: 1,
    paddingRight: sizes.md,
  },
  rowTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "800",
    color: colors.ink,
  },
  rowSubtitle: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
    color: colors.inkMuted,
  },
});
