import Screen from "@/components/common/Screen";
import ProfileIcon from "@/components/icons/ProfileIcon";
import colors from "@/constants/colors";
import sizes from "@/constants/sizes";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function PoliciesScreen() {
  const goBackToSettings = () => {
    if (router.canGoBack?.()) {
      router.back();
      return;
    }

    router.replace("/settings");
  };

  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Pressable style={styles.backButton} onPress={goBackToSettings}>
              <ProfileIcon name="chevron-back" size={24} color={colors.ink} />
            </Pressable>
            <Text style={styles.headerTitle}>Trợ giúp & hỗ trợ</Text>
          </View>
          <Text style={styles.title}>Điều khoản & chính sách</Text>
          <Text style={styles.subtitle}>
            Các quy định sử dụng ứng dụng và nội dung trong hệ thống.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tiêu chuẩn cộng đồng</Text>
          <Text style={styles.cardText}>
            Người dùng cần đăng nội dung học tập phù hợp, tôn trọng giảng viên
            và học viên khác, không chia sẻ nội dung vi phạm hoặc gây hại.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quyền riêng tư</Text>
          <Text style={styles.cardText}>
            Thông tin cá nhân, bài đăng, bình luận và tương tác được xử lý theo
            quyền của từng tài khoản trong hệ thống.
          </Text>
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
    gap: sizes.sm,
    marginBottom: sizes.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
  },
  headerTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "900",
    color: colors.ink,
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
  card: {
    marginTop: sizes.md,
    backgroundColor: colors.white,
    paddingHorizontal: sizes.lg,
    paddingVertical: sizes.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderMuted,
  },
  cardTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "900",
    color: colors.ink,
  },
  cardText: {
    marginTop: sizes.xs,
    fontSize: 14,
    lineHeight: 20,
    color: colors.inkMuted,
  },
});
