import Screen from "@/components/common/Screen";
import ProfileIcon from "@/components/icons/ProfileIcon";
import colors from "@/constants/colors";
import sizes from "@/constants/sizes";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

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
  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Cài đặt</Text>
          <Text style={styles.subtitle}>Tài khoản, thông báo, bảo mật và thiết bị.</Text>
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
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
    color: colors.ink,
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
