import UserAvatar from "@/components/common/UserAvatar";
import colors from "@/constants/colors";
import { getBlocks, setBlock } from "@/repositories/blockRepository";
import { getUserInfo } from "@/repositories/userRepository";
import { redirectIfSessionExpired } from "@/utils/screenErrors";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function getBlockedUserId(item = {}) {
  return String(
    item.blockedUserId ||
      item.blocked_user_id ||
      item.userId ||
      item.user_id ||
      item.user?.id ||
      item.blocked?.id ||
      item.raw?.blockedUserId ||
      item.raw?.blocked_user_id ||
      item.raw?.userId ||
      item.raw?.user_id ||
      item.raw?.user?.id ||
      item.raw?.blocked?.id ||
      item.id ||
      "",
  ).trim();
}

function isSameUserId(a, b) {
  return String(a || "").trim() === String(b || "").trim();
}

export default function ConversationInfoScreen() {
  const params = useLocalSearchParams();

  const partnerId = String(params.partnerId || "").trim();
  const partnerName = String(params.partnerName || "Người dùng");
  const partnerAvatar = String(params.partnerAvatar || "");

  const [partner, setPartner] = useState({
    id: partnerId,
    username: partnerName,
    avatar: partnerAvatar,
    role: "",
    description: "",
  });
  const [isLoading, setIsLoading] = useState(Boolean(partnerId));
  const [isBlocking, setIsBlocking] = useState(false);
  const [blockedByMe, setBlockedByMe] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      async function loadPartnerInfo() {
        if (!partnerId) {
          setIsLoading(false);
          return;
        }

        try {
          setIsLoading(true);

          const profile = await getUserInfo(partnerId);
          const blocks = await getBlocks();
          const isPartnerBlockedByMe = blocks.some((item) =>
            isSameUserId(getBlockedUserId(item), partnerId),
          );

          if (!mounted) return;

          setPartner({
            id: partnerId,
            username:
              profile.username ||
              profile.displayName ||
              profile.name ||
              partnerName ||
              "Người dùng",
            avatar: profile.avatar || partnerAvatar || "",
            role: profile.role || "",
            description: profile.description || "",
            raw: profile,
          });

          setBlockedByMe(isPartnerBlockedByMe);
        } catch (error) {
          if (await redirectIfSessionExpired(error, router)) return;

          if (mounted) {
            setPartner((current) => ({
              ...current,
              id: partnerId,
              username: partnerName || current.username || "Người dùng",
              avatar: partnerAvatar || current.avatar || "",
            }));
          }
        } finally {
          if (mounted) {
            setIsLoading(false);
          }
        }
      }

      loadPartnerInfo();

      return () => {
        mounted = false;
      };
    }, [partnerId, partnerName, partnerAvatar]),
  );

  const handleOpenProfile = useCallback(() => {
    if (!partnerId) return;

    router.push({
      pathname: "/profile/[userId]",
      params: { userId: partnerId },
    });
  }, [partnerId]);

  const handleBlock = useCallback(() => {
    if (!partnerId || isBlocking) return;

    const nextAction = blockedByMe ? "unblock" : "block";
    const title = blockedByMe ? "Bỏ chặn người dùng" : "Chặn người dùng";
    const message = blockedByMe
      ? `Bạn có chắc muốn bỏ chặn ${partner.username || "người dùng này"}?`
      : `Bạn có chắc muốn chặn ${partner.username || "người dùng này"}?`;

    Alert.alert(title, message, [
      { text: "Hủy", style: "cancel" },
      {
        text: blockedByMe ? "Bỏ chặn" : "Chặn",
        style: blockedByMe ? "default" : "destructive",
        onPress: async () => {
          try {
            setIsBlocking(true);

            await setBlock(partnerId, nextAction);

            setBlockedByMe(!blockedByMe);

            Alert.alert(
              blockedByMe ? "Đã bỏ chặn" : "Đã chặn",
              blockedByMe
                ? `${partner.username || "Người dùng này"} đã được bỏ chặn.`
                : `${
                    partner.username || "Người dùng này"
                  } đã được thêm vào danh sách chặn.`,
            );
          } catch (error) {
            if (await redirectIfSessionExpired(error, router)) return;

            Alert.alert(
              blockedByMe ? "Không thể bỏ chặn" : "Không thể chặn",
              error?.message || "Đã có lỗi xảy ra.",
            );
          } finally {
            setIsBlocking(false);
          }
        },
      },
    ]);
  }, [partnerId, partner.username, isBlocking, blockedByMe]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color={colors.ink} />
        </Pressable>

        <Text style={styles.headerTitle}>Thông tin</Text>

        <View style={{ width: 28 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.profileBlock}>
            <UserAvatar
              uri={partner.avatar}
              size={96}
              name={partner.username}
            />

            <Text numberOfLines={1} style={styles.partnerName}>
              {partner.username || "Người dùng"}
            </Text>

            {partner.role ? (
              <Text numberOfLines={1} style={styles.partnerMeta}>
                {partner.role}
              </Text>
            ) : null}

            {partner.description ? (
              <Text numberOfLines={3} style={styles.partnerDescription}>
                {partner.description}
              </Text>
            ) : null}

            <View style={styles.actionRow}>
              <Pressable
                onPress={handleOpenProfile}
                style={({ pressed }) => [
                  styles.roundAction,
                  pressed && styles.roundActionPressed,
                ]}
              >
                <View style={styles.roundIcon}>
                  <Ionicons name="person" size={22} color={colors.ink} />
                </View>
                <Text style={styles.roundActionText}>Trang cá nhân</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quyền riêng tư & hỗ trợ</Text>

            <Pressable
              onPress={handleBlock}
              disabled={isBlocking}
              style={({ pressed }) => [
                styles.menuRow,
                pressed && styles.menuRowPressed,
              ]}
            >
              <View
                style={blockedByMe ? styles.menuIconPrimary : styles.menuIconDanger}
              >
                <Ionicons
                  name={
                    blockedByMe ? "chatbubble-ellipses-outline" : "ban-outline"
                  }
                  size={22}
                  color={blockedByMe ? colors.primary : colors.error}
                />
              </View>

              <View style={styles.menuTextWrap}>
                <Text
                  style={
                    blockedByMe ? styles.menuTitlePrimary : styles.menuTitleDanger
                  }
                >
                  {isBlocking
                    ? blockedByMe
                      ? "Đang bỏ chặn..."
                      : "Đang chặn..."
                    : blockedByMe
                      ? "Bỏ chặn"
                      : "Chặn"}
                </Text>
                <Text style={styles.menuSubtitle}>
                  {blockedByMe
                    ? "Bạn có thể bỏ chặn để tiếp tục nhắn tin với người này."
                    : "Người này sẽ không thể nhắn tin hoặc tương tác với bạn."}
                </Text>
              </View>
            </Pressable>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    height: 52,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "700",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  profileBlock: {
    alignItems: "center",
    paddingTop: 30,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  partnerName: {
    marginTop: 14,
    maxWidth: "90%",
    color: colors.ink,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
    textAlign: "center",
  },
  partnerMeta: {
    marginTop: 4,
    color: colors.inkMuted,
    fontSize: 14,
    textAlign: "center",
  },
  partnerDescription: {
    marginTop: 8,
    color: colors.inkMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  actionRow: {
    marginTop: 22,
    flexDirection: "row",
    justifyContent: "center",
  },
  roundAction: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 96,
  },
  roundActionPressed: {
    opacity: 0.75,
  },
  roundIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E4E6EB",
    alignItems: "center",
    justifyContent: "center",
  },
  roundActionText: {
    marginTop: 7,
    color: colors.ink,
    fontSize: 13,
    fontWeight: "700",
  },
  section: {
    marginTop: 8,
    borderTopWidth: 8,
    borderTopColor: "#F0F2F5",
    paddingTop: 14,
  },
  sectionTitle: {
    paddingHorizontal: 16,
    marginBottom: 8,
    color: colors.inkMuted,
    fontSize: 13,
    fontWeight: "700",
  },
  menuRow: {
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  menuRowPressed: {
    backgroundColor: "#F0F2F5",
  },
  menuIconDanger: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuIconPrimary: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#E7F3FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuTextWrap: {
    flex: 1,
  },
  menuTitleDanger: {
    color: colors.error,
    fontSize: 15,
    fontWeight: "700",
  },
  menuTitlePrimary: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "700",
  },
  menuSubtitle: {
    marginTop: 2,
    color: colors.inkMuted,
    fontSize: 13,
    lineHeight: 18,
  },
});
