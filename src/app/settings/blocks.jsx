import AppButton from "@/components/common/AppButton";
import AppInput from "@/components/common/AppInput";
import Screen from "@/components/common/Screen";
import ProfileIcon from "@/components/icons/ProfileIcon";
import colors from "@/constants/colors";
import sizes from "@/constants/sizes";
import { getBlocks, setBlock } from "@/repositories/blockRepository";
import { searchScreenSearch } from "@/repositories/searchRepository";
import { resolveAvatarUri } from "@/utils/profile";
import { redirectIfSessionExpired } from "@/utils/screenErrors";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
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

function BlockedAvatar({ item }) {
  if (item.avatar) {
    return (
      <Image
        source={{ uri: resolveAvatarUri(item.avatar) }}
        style={styles.avatar}
        blurRadius={3}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={150}
      />
    );
  }

  const initial = String(item.username || item.id || "?")
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <View style={styles.avatarFallback}>
      <Text style={styles.avatarText}>{initial || "?"}</Text>
    </View>
  );
}

export default function BlocksScreen() {
  const [blocks, setBlocks] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [actionUserId, setActionUserId] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const loadBlocks = useCallback(() => {
    setIsLoading(true);
    setStatus("");
    getBlocks()
      .then(setBlocks)
      .catch(async (error) => {
        if (await redirectIfSessionExpired(error, router)) return;
        setStatus(error.message || "Không thể tải danh sách chặn.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  useFocusEffect(loadBlocks);

  const goBackToSettings = () => {
    if (router.canGoBack?.()) {
      router.back();
      return;
    }

    router.replace("/settings");
  };

  const searchUsers = async () => {
    const keyword = searchKeyword.trim();
    if (!keyword) {
      setStatus("Nhập tên hoặc tài khoản người dùng cần tìm.");
      return;
    }

    try {
      setIsSearching(true);
      setStatus("");
      const result = await searchScreenSearch(keyword, { count: 8 });
      const users = (result.users || []).filter((user) => user.id);
      setSearchResults(users);
      if (users.length === 0) {
        setStatus("Không tìm thấy người dùng phù hợp.");
      }
    } catch (error) {
      if (await redirectIfSessionExpired(error, router)) return;
      setStatus(error.message || "Không thể tìm người dùng.");
    } finally {
      setIsSearching(false);
    }
  };

  const blockUser = async (target) => {
    const targetId = String(target?.id || "").trim();
    if (!targetId) {
      setStatus("Chọn người dùng cần chặn.");
      return;
    }

    try {
      setActionUserId(targetId);
      await setBlock(targetId, "block");
      setStatus(`Đã chặn ${target.name || target.username || "người dùng"}.`);
      setSearchKeyword("");
      setSearchResults([]);
      setIsAdding(false);
      loadBlocks();
    } catch (error) {
      if (await redirectIfSessionExpired(error, router)) return;
      setStatus(error.message || "Không thể chặn người dùng.");
    } finally {
      setActionUserId("");
    }
  };

  const confirmBlockUser = (target) => {
    const targetId = String(target?.id || "").trim();
    if (!targetId) {
      setStatus("Chọn người dùng cần chặn.");
      return;
    }

    Alert.alert(
      "Chặn người dùng",
      `Bạn có chắc muốn chặn ${target.name || target.username || "người dùng này"}?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Chặn",
          style: "destructive",
          onPress: () => blockUser(target),
        },
      ],
    );
  };

  const unblockUser = async (item) => {
    try {
      setActionUserId(item.id);
      await setBlock(item.id, "unblock");
      setBlocks((current) => current.filter((block) => block.id !== item.id));
      setStatus("Đã bỏ chặn người dùng.");
    } catch (error) {
      if (await redirectIfSessionExpired(error, router)) return;
      setStatus(error.message || "Không thể bỏ chặn.");
    } finally {
      setActionUserId("");
    }
  };

  const confirmUnblockUser = (item) => {
    Alert.alert(
      "Bỏ chặn người dùng",
      `Bạn có chắc muốn bỏ chặn ${item.username || "người dùng này"}?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Bỏ chặn",
          onPress: () => unblockUser(item),
        },
      ],
    );
  };

  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Pressable style={styles.backButton} onPress={goBackToSettings}>
              <ProfileIcon name="chevron-back" size={24} color={colors.ink} />
            </Pressable>
            <Text style={styles.headerTitle}>Cài đặt</Text>
          </View>
          <Text style={styles.title}>Chặn</Text>
          <Text style={styles.subtitle}>
            Khi bạn chặn ai đó, người đó sẽ không thể xem bài viết, nhắn tin
            hoặc tương tác với bạn trong hệ thống.
          </Text>
        </View>

        <View style={styles.addSection}>
          <Pressable
            style={styles.addRow}
            onPress={() => {
              setIsAdding((current) => !current);
              setStatus("");
              setSearchKeyword("");
              setSearchResults([]);
            }}
          >
            <View style={styles.addIcon}>
              <ProfileIcon name="add" size={24} color={colors.brand} />
            </View>
            <Text style={styles.addText}>THÊM VÀO DANH SÁCH CHẶN</Text>
          </Pressable>

          {isAdding ? (
            <View style={styles.addForm}>
              <AppInput
                label="Tìm người dùng"
                placeholder="Nhập tên hoặc tài khoản"
                value={searchKeyword}
                onChangeText={setSearchKeyword}
                autoFocus
                returnKeyType="search"
                onSubmitEditing={searchUsers}
              />
              <AppButton
                title="Tìm kiếm"
                onPress={searchUsers}
                loading={isSearching}
              />
              {searchResults.map((item) => (
                <View key={item.id} style={styles.searchResultRow}>
                  {item.avatar ? (
                    <Image
                      source={{ uri: item.avatar }}
                      style={styles.searchAvatar}
                    />
                  ) : (
                    <View style={styles.searchAvatarFallback}>
                      <Text style={styles.avatarText}>
                        {String(item.name || item.id || "?")
                          .charAt(0)
                          .toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.blockInfo}>
                    <Text style={styles.blockName}>
                      {item.name || item.username}
                    </Text>
                    <Text style={styles.blockMeta} numberOfLines={1}>
                      {item.handle || item.role || item.id}
                    </Text>
                  </View>
                  <AppButton
                    title="CHẶN"
                    onPress={() => confirmBlockUser(item)}
                    loading={actionUserId === item.id}
                    style={styles.blockButton}
                    textStyle={styles.unblockButtonText}
                  />
                </View>
              ))}
            </View>
          ) : null}
        </View>

        {status ? <Text style={styles.statusText}>{status}</Text> : null}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {blocks.length} người dùng bị chặn
            </Text>
            <Pressable
              style={styles.refreshButton}
              onPress={loadBlocks}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.brand} />
              ) : (
                <ProfileIcon name="refresh" size={20} color={colors.brand} />
              )}
            </Pressable>
          </View>

          {!isLoading && blocks.length === 0 ? (
            <View style={styles.emptyBox}>
              <ProfileIcon
                name="ban-outline"
                size={30}
                color={colors.inkMuted}
              />
              <Text style={styles.emptyTitle}>Chưa có người dùng bị chặn</Text>
              <Text style={styles.emptyText}>
                Những người bạn chặn sẽ xuất hiện tại đây.
              </Text>
            </View>
          ) : null}

          {blocks.map((item) => (
            <View key={item.id} style={styles.blockRow}>
              <BlockedAvatar item={item} />
              <View style={styles.blockInfo}>
                <Text style={styles.blockName}>{item.username}</Text>
              </View>
              <AppButton
                title="BỎ CHẶN"
                onPress={() => confirmUnblockUser(item)}
                loading={actionUserId === item.id}
                style={styles.unblockButton}
                textStyle={styles.unblockButtonText}
              />
            </View>
          ))}
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
  addSection: {
    marginTop: sizes.md,
    backgroundColor: colors.white,
  },
  addRow: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: sizes.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderMuted,
  },
  addIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: sizes.md,
    backgroundColor: colors.primaryLight,
  },
  addText: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "900",
    color: colors.brand,
  },
  addForm: {
    padding: sizes.lg,
    gap: sizes.md,
  },
  searchResultRow: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: sizes.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderMuted,
  },
  searchAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: sizes.md,
    backgroundColor: colors.surfaceMuted,
  },
  searchAvatarFallback: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: sizes.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
  },
  section: {
    marginTop: sizes.md,
    backgroundColor: colors.white,
  },
  sectionHeader: {
    minHeight: 54,
    paddingHorizontal: sizes.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderMuted,
  },
  sectionTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "900",
    color: colors.ink,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
  },
  statusText: {
    marginHorizontal: sizes.lg,
    marginTop: sizes.md,
    fontSize: 14,
    lineHeight: 20,
    color: colors.inkMuted,
  },
  emptyBox: {
    alignItems: "center",
    gap: sizes.sm,
    paddingHorizontal: sizes.xl,
    paddingVertical: sizes.xxl,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: colors.ink,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    color: colors.inkMuted,
  },
  blockRow: {
    minHeight: 74,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: sizes.lg,
    paddingVertical: sizes.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderMuted,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: sizes.md,
    backgroundColor: colors.surfaceMuted,
    opacity: 0.65,
  },
  avatarFallback: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: sizes.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
    opacity: 0.65,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "900",
    color: colors.inkMuted,
  },
  blockInfo: {
    flex: 1,
    paddingRight: sizes.md,
  },
  blockName: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "800",
    color: colors.ink,
  },
  blockMeta: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
    color: colors.inkMuted,
  },
  unblockButton: {
    width: 92,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceMuted,
  },
  blockButton: {
    width: 72,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceMuted,
  },
  unblockButtonText: {
    color: colors.ink,
    fontSize: 14,
  },
});
