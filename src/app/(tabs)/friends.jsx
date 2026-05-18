import {
  blockUser,
  getUserFriends,
  unfriendUser,
} from "@/repositories/userRepository";
import colors from "@/constants/colors";
import sizes from "@/constants/sizes";
import { clearAuthSession } from "@/utils/session";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

function initials(name = "") {
  return String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";
}

function FriendAvatar({ friend }) {
  if (friend.avatar) {
    return <Image source={{ uri: friend.avatar }} style={styles.avatar} />;
  }

  return (
    <View style={[styles.avatar, styles.avatarFallback]}>
      <Text style={styles.avatarText}>{initials(friend.displayName)}</Text>
    </View>
  );
}

function FriendOptions({ friend, visible, onClose, onChanged }) {
  const runBlock = async () => {
    try {
      await blockUser(friend.id);
      onClose();
      onChanged?.();
      Alert.alert("Đã chặn", `${friend.displayName} đã được đưa vào danh sách chặn.`);
    } catch (error) {
      Alert.alert("Không thể chặn", error.message || "Vui lòng thử lại.");
    }
  };

  const runUnfriend = async () => {
    try {
      const result = await unfriendUser(friend.id);
      onClose();
      onChanged?.();
      Alert.alert(
        "Đã xử lý",
        result.placeholder
          ? "Project chưa có API hủy bạn bè, thao tác đang dùng fallback an toàn."
          : "Đã hủy bạn bè.",
      );
    } catch (error) {
      Alert.alert("Không thể hủy bạn bè", error.message || "Vui lòng thử lại.");
    }
  };

  const rows = [
    {
      label: "Xem trang cá nhân của người đó",
      icon: "person-circle-outline",
      onPress: () => router.push(`/profile/${friend.id}`),
    },
    {
      label: "Xem bạn bè của người đó",
      icon: "people-outline",
      onPress: () =>
        router.push({
          pathname: "/(tabs)/friends",
          params: { userId: friend.id, source: "profile" },
        }),
    },
    { label: "Chặn", icon: "ban-outline", onPress: runBlock },
    { label: "Hủy bạn bè", icon: "person-remove-outline", onPress: runUnfriend },
  ];

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>{friend.displayName}</Text>
          {rows.map((row) => (
            <Pressable
              key={row.label}
              style={styles.optionRow}
              onPress={() => {
                onClose();
                row.onPress?.();
              }}
            >
              <View style={styles.optionIcon}>
                <Ionicons name={row.icon} size={21} color={colors.text} />
              </View>
              <Text style={styles.optionText}>{row.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}

export default function FriendsScreen() {
  const params = useLocalSearchParams();
  const userId = typeof params.userId === "string" ? params.userId : "";
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadFriends = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError("");

    try {
      const items = await getUserFriends(userId, { sort: "abc", count: 100 });
      setFriends(items);
    } catch (loadError) {
      if (loadError.sessionExpired) {
        await clearAuthSession();
        router.replace("/(auth)/login");
        return;
      }
      setError(loadError.message || "Không thể tải danh sách bạn bè.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      loadFriends(false);
    }, [loadFriends]),
  );

  const title = useMemo(() => (userId ? "Bạn bè của hồ sơ" : "Bạn bè"), [userId]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Pressable style={styles.searchButton} hitSlop={8}>
          <Ionicons name="search-outline" size={24} color="#050505" />
        </Pressable>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadFriends(true)} tintColor="#0866FF" />
        }
        contentContainerStyle={styles.content}
      >
        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color="#0866FF" />
            <Text style={styles.mutedText}>Đang tải danh sách bạn bè...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerState}>
            <Ionicons name="alert-circle-outline" size={34} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : friends.length ? (
          <>
            <Text style={styles.countText}>{friends.length} người bạn, sắp xếp ABC</Text>
            {friends.map((friend) => (
              <View key={friend.id} style={styles.friendRow}>
                <Pressable
                  style={styles.friendInfo}
                  onPress={() => router.push(`/profile/${friend.id}`)}
                >
                  <FriendAvatar friend={friend} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.friendName}>{friend.displayName}</Text>
                    <Text style={styles.friendMeta} numberOfLines={1}>
                      {friend.city || "Bạn bè"}
                    </Text>
                  </View>
                </Pressable>
                <Pressable
                  style={styles.moreButton}
                  onPress={() => setSelectedFriend(friend)}
                >
                  <Ionicons name="ellipsis-horizontal" size={22} color={colors.text} />
                </Pressable>
              </View>
            ))}
          </>
        ) : (
          <View style={styles.centerState}>
            <Ionicons name="people-outline" size={40} color={colors.subtext} />
            <Text style={styles.emptyTitle}>Chưa có bạn bè</Text>
            <Text style={styles.mutedText}>Danh sách bạn bè sẽ hiển thị tại đây khi API có dữ liệu.</Text>
          </View>
        )}
      </ScrollView>

      {selectedFriend ? (
        <FriendOptions
          friend={selectedFriend}
          visible={Boolean(selectedFriend)}
          onClose={() => setSelectedFriend(null)}
          onChanged={() => loadFriends(true)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F0F2F5",
  },
  header: {
    minHeight: 54,
    paddingHorizontal: sizes.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#CED0D4",
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#050505",
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E4E6EB",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: sizes.md,
    gap: sizes.sm,
  },
  countText: {
    marginBottom: sizes.xs,
    fontSize: 14,
    fontWeight: "800",
    color: colors.subtext,
  },
  friendRow: {
    minHeight: 78,
    borderRadius: 8,
    backgroundColor: colors.white,
    padding: sizes.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: sizes.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E4E6EB",
  },
  friendInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: sizes.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E4E6EB",
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DDE7F8",
  },
  avatarText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "900",
  },
  friendName: {
    fontSize: 16,
    fontWeight: "900",
    color: "#050505",
  },
  friendMeta: {
    marginTop: 3,
    fontSize: 13,
    color: colors.subtext,
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F2F5",
  },
  centerState: {
    minHeight: 260,
    alignItems: "center",
    justifyContent: "center",
    gap: sizes.sm,
    padding: sizes.xl,
  },
  mutedText: {
    color: colors.subtext,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.text,
  },
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.32)",
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: sizes.lg,
    paddingTop: sizes.sm,
    paddingBottom: 34,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 74,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#D1D5DB",
    marginBottom: sizes.md,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.text,
    marginBottom: sizes.sm,
  },
  optionRow: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: sizes.md,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E4E6EB",
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
  },
});
