import AppButton from "@/components/common/AppButton";
import colors from "@/constants/colors";
import sizes from "@/constants/sizes";
import { getUserInfo } from "@/repositories/userRepository";
import { clearAuthSession } from "@/utils/session";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function initials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "U";
}

function HeaderAvatar({ profile }) {
  return (
    <View style={styles.headerAvatarWrap}>
      {profile?.avatar ? (
        <Image source={{ uri: profile.avatar }} style={styles.headerAvatar} />
      ) : (
        <View style={styles.headerAvatarFallback}>
          <Text style={styles.headerAvatarText}>{initials(profile?.displayName || profile?.username)}</Text>
        </View>
      )}
      <View style={styles.headerAvatarBadge}>
        <Ionicons name="chevron-down" size={12} color="#050505" />
      </View>
    </View>
  );
}

function SettingsRow({ icon, label, onPress }) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={30} color="#050505" />
      </View>
      <Text style={styles.rowText}>{label}</Text>
    </Pressable>
  );
}

export default function ProfileSettingsScreen() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const user = await getUserInfo();
      setProfile(user);
    } catch (error) {
      if (error.sessionExpired) {
        await clearAuthSession();
        router.replace("/(auth)/login");
        return;
      }
      Alert.alert("Không thể tải hồ sơ", error.message || "Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile]),
  );

  const profileLink = useMemo(() => {
    const id = profile?.id || "";
    return profile?.profileLink || Linking.createURL(id ? `/profile/${id}` : "/(tabs)/profile");
  }, [profile?.id, profile?.profileLink]);

  const showPlaceholder = (label) => {
    Alert.alert(label, "Mục này đã có giao diện, có thể nối backend sau.");
  };

  const shareProfile = async () => {
    try {
      await Share.share({ message: profileLink, url: profileLink });
    } catch {
      Alert.alert("Liên kết trang cá nhân", profileLink);
    }
  };

  const rows = [
    { icon: "albums-outline", label: "Cài đặt theo dõi", onPress: () => showPlaceholder("Cài đặt theo dõi") },
    { icon: "heart-circle-outline", label: "Chỉnh sửa tin nổi bật", onPress: () => showPlaceholder("Chỉnh sửa tin nổi bật") },
    { icon: "shield-checkmark-outline", label: "Trạng thái trang cá nhân", onPress: () => showPlaceholder("Trạng thái trang cá nhân") },
    { icon: "archive-outline", label: "Kho lưu trữ", onPress: () => showPlaceholder("Kho lưu trữ") },
    { icon: "eye-outline", label: "Chế độ xem", onPress: () => router.push(profile?.id ? `/profile/${profile.id}` : "/(tabs)/profile") },
    { icon: "shield-half-outline", label: "Khóa bảo vệ trang cá nhân", onPress: () => showPlaceholder("Khóa bảo vệ trang cá nhân") },
    { icon: "list-outline", label: "Nhật ký hoạt động", onPress: () => showPlaceholder("Nhật ký hoạt động") },
    { icon: "newspaper-outline", label: "Quản lý bài viết", onPress: () => showPlaceholder("Quản lý bài viết") },
    { icon: "reader-outline", label: "Xem lại bài viết và thẻ", onPress: () => showPlaceholder("Xem lại bài viết và thẻ") },
    { icon: "lock-closed-outline", label: "Trung tâm quyền riêng tư", onPress: () => showPlaceholder("Trung tâm quyền riêng tư") },
    {
      icon: "search-outline",
      label: "Tìm kiếm",
      onPress: () =>
        router.push({
          pathname: "/profile/search",
          params: { userId: profile?.id || "" },
        }),
    },
    { icon: "person-circle-outline", label: "Bật chế độ chuyên nghiệp", onPress: () => showPlaceholder("Bật chế độ chuyên nghiệp") },
    { icon: "share-social-outline", label: "Chia sẻ trang cá nhân", onPress: shareProfile },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={34} color="#050505" />
        </Pressable>
        <Text style={styles.headerTitle}>Cài đặt trang cá nhân</Text>
        <HeaderAvatar profile={profile} />
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color="#0866FF" />
          <Text style={styles.mutedText}>Đang tải hồ sơ...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.section}>
            {rows.map((row) => (
              <SettingsRow key={row.label} {...row} />
            ))}
          </View>

          <View style={styles.linkSection}>
            <Text style={styles.linkTitle}>Liên kết đến trang cá nhân của bạn</Text>
            <Text style={styles.linkSubtitle}>Liên kết riêng của bạn trên Facebook.</Text>
            <View style={styles.divider} />
            <Text style={styles.linkValue} numberOfLines={2}>
              {profileLink}
            </Text>
            <AppButton title="Chia sẻ liên kết" onPress={shareProfile} style={styles.shareButton} />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#D8DDE2",
  },
  header: {
    minHeight: 72,
    paddingHorizontal: sizes.md,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
  },
  backButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "900",
    color: "#050505",
  },
  headerAvatarWrap: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#E4E6EB",
  },
  headerAvatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DDE7F8",
  },
  headerAvatarText: {
    color: "#0866FF",
    fontSize: 13,
    fontWeight: "900",
  },
  headerAvatarBadge: {
    position: "absolute",
    right: 3,
    bottom: 3,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.white,
    backgroundColor: "#E4E6EB",
  },
  content: {
    paddingTop: 10,
    paddingBottom: sizes.xl,
  },
  section: {
    backgroundColor: colors.white,
  },
  row: {
    minHeight: 74,
    paddingHorizontal: sizes.lg,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#DADDE1",
  },
  rowIcon: {
    width: 50,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  rowText: {
    flex: 1,
    fontSize: 24,
    lineHeight: 30,
    color: "#050505",
  },
  linkSection: {
    marginTop: 10,
    paddingHorizontal: sizes.lg,
    paddingTop: sizes.lg,
    paddingBottom: sizes.xl,
    backgroundColor: colors.white,
  },
  linkTitle: {
    fontSize: 25,
    lineHeight: 31,
    fontWeight: "900",
    color: "#050505",
  },
  linkSubtitle: {
    marginTop: sizes.xs,
    fontSize: 21,
    lineHeight: 27,
    color: "#65676B",
  },
  divider: {
    marginTop: sizes.lg,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#DADDE1",
  },
  linkValue: {
    marginTop: sizes.lg,
    fontSize: 19,
    lineHeight: 25,
    fontWeight: "900",
    color: "#050505",
  },
  shareButton: {
    marginTop: sizes.lg,
    minHeight: 44,
    borderRadius: 22,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: sizes.sm,
    backgroundColor: colors.white,
  },
  mutedText: {
    fontSize: 14,
    color: colors.subtext,
  },
});
