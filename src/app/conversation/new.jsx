import UserAvatar from "@/components/common/UserAvatar";
import {
  getConversationList,
  getConversationListCache,
} from "@/repositories/conversationRepository";
import { searchScreenSearch } from "@/repositories/searchRepository";
import { redirectIfSessionExpired } from "@/utils/screenErrors";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PAGE_SIZE = 20;

function normalizeUser(item = {}) {
  return {
    id: String(item.id || item.user_id || item.userId || ""),
    name: String(
      item.name ||
        item.username ||
        item.displayName ||
        item.fullname ||
        item.handle ||
        "Người dùng",
    ),
    handle: String(item.handle || item.username || item.user_name || ""),
    role: String(item.role || item.type || ""),
    avatar: String(item.avatar || item.image || item.picture || ""),
    description: String(item.description || item.described || item.bio || ""),
    raw: item,
  };
}

function conversationToUser(item = {}) {
  const partner = item.partner || {};

  return normalizeUser({
    id: partner.id,
    name: partner.username,
    username: partner.username,
    avatar: partner.avatar,
    role: partner.role,
  });
}

function mergeUsers(current = [], incoming = []) {
  const map = new Map();

  current.forEach((item) => {
    if (item.id) map.set(item.id, item);
  });

  incoming.forEach((item) => {
    if (item.id) map.set(item.id, item);
  });

  return Array.from(map.values());
}

export default function NewConversationScreen() {
  const inputRef = useRef(null);

  const [keyword, setKeyword] = useState("");
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [searchUsers, setSearchUsers] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextIndex, setNextIndex] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState("");

  const trimmedKeyword = keyword.trim();

  const visibleUsers = useMemo(() => {
    return trimmedKeyword ? searchUsers : suggestedUsers;
  }, [trimmedKeyword, searchUsers, suggestedUsers]);

  const loadSuggestions = useCallback(async () => {
    try {
      setError("");
      setIsLoadingSuggestions(true);

      const cache = getConversationListCache?.();
      const cachedUsers = Array.isArray(cache?.messages)
        ? cache.messages.map(conversationToUser).filter((item) => item.id)
        : [];

      if (cachedUsers.length) {
        setSuggestedUsers(cachedUsers);
      }

      const data = await getConversationList();
      const nextUsers = Array.isArray(data?.messages)
        ? data.messages.map(conversationToUser).filter((item) => item.id)
        : [];

      setSuggestedUsers((current) => mergeUsers(current, nextUsers));
    } catch (suggestionError) {
      if (await redirectIfSessionExpired(suggestionError, router)) return;

      setError(suggestionError?.message || "Không thể tải danh sách gợi ý.");
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSuggestions();

      const timer = setTimeout(() => {
        inputRef.current?.focus?.();
      }, 250);

      return () => clearTimeout(timer);
    }, [loadSuggestions]),
  );

  const runSearch = useCallback(
    async ({ append = false, index = 0, value = keyword } = {}) => {
      const text = String(value || "").trim();

      if (!text) {
        setSearchUsers([]);
        setNextIndex(0);
        setHasMore(false);
        setError("");
        return;
      }

      try {
        setError("");
        if (append) {
          setIsLoadingMore(true);
        } else {
          setIsSearching(true);
          setSearchUsers([]);
          setNextIndex(0);
          setHasMore(false);
        }

        const result = await searchScreenSearch(text, {
          index,
          count: PAGE_SIZE,
          append,
        });

        const nextUsers = (result.users || [])
          .map(normalizeUser)
          .filter((item) => item.id);

        setSearchUsers((current) =>
          append ? mergeUsers(current, nextUsers) : nextUsers,
        );

        setNextIndex(result.nextIndex);
        setHasMore(Boolean(result.hasMore));
      } catch (searchError) {
        if (await redirectIfSessionExpired(searchError, router)) return;

        setError(searchError?.message || "Không thể tìm người dùng.");

        if (!append) {
          setSearchUsers([]);
          setNextIndex(0);
          setHasMore(false);
        }
      } finally {
        setIsSearching(false);
        setIsLoadingMore(false);
      }
    },
    [keyword],
  );

  const handleChangeKeyword = useCallback((value) => {
    setKeyword(value);
    setError("");

    const text = String(value || "").trim();

    if (!text) {
      setSearchUsers([]);
      setNextIndex(0);
      setHasMore(false);
    }
  }, []);

  const handleClearKeyword = useCallback(() => {
    setKeyword("");
    setError("");
    setSearchUsers([]);
    setNextIndex(0);
    setHasMore(false);
    inputRef.current?.focus?.();
  }, []);

  const handleSubmitSearch = useCallback(() => {
    runSearch({ append: false, index: 0, value: trimmedKeyword });
  }, [runSearch, trimmedKeyword]);

  const handlePressUser = useCallback((user) => {
    const partnerId = String(user?.id || "").trim();

    if (!partnerId) return;

    Keyboard.dismiss();

    router.push({
      pathname: "/conversation/[id]",
      params: {
        id: partnerId,
        partnerId,
        partnerName: user.name,
        partnerAvatar: user.avatar,
        mode: "partner",
      },
    });
  }, []);

  const renderItem = useCallback(
    ({ item }) => (
      <Pressable
        onPress={() => handlePressUser(item)}
        style={({ pressed }) => [
          styles.userRow,
          pressed && styles.userRowPressed,
        ]}
      >
        <View style={styles.avatarWrap}>
          <UserAvatar uri={item?.avatar} size={42} />
        </View>

        <View style={styles.userTextWrap}>
          <Text numberOfLines={1} style={styles.userName}>
            {item.name}
          </Text>

          {item.handle || item.role ? (
            <Text numberOfLines={1} style={styles.userSubtitle}>
              {item.handle ? `@${item.handle.replace(/^@/, "")}` : ""}
              {item.handle && item.role ? " · " : ""}
              {item.role || ""}
            </Text>
          ) : null}
        </View>
      </Pressable>
    ),
    [handlePressUser],
  );

  const isInitialLoading =
    !trimmedKeyword && isLoadingSuggestions && suggestedUsers.length === 0;

  const isSearchLoading =
    trimmedKeyword && isSearching && searchUsers.length === 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={28} color="#050505" />
        </Pressable>

        <Text style={styles.headerTitle}>Tin nhắn mới</Text>

        <View style={styles.headerRightPlaceholder} />
      </View>

      <View style={styles.toRow}>
        <Text style={styles.toLabel}>Tới:</Text>

        <TextInput
          ref={inputRef}
          value={keyword}
          onChangeText={handleChangeKeyword}
          onSubmitEditing={handleSubmitSearch}
          placeholder="Hãy nhập tên hoặc nhóm"
          placeholderTextColor="#9CA3AF"
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          style={styles.toInput}
        />

        {keyword ? (
          <Pressable
            onPress={handleClearKeyword}
            hitSlop={10}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color="#8A8D91" />
          </Pressable>
        ) : null}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {trimmedKeyword ? "Kết quả" : "Gợi ý"}
        </Text>
      </View>

      {isInitialLoading || isSearchLoading ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={visibleUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {trimmedKeyword
                ? "Không tìm thấy người dùng nào"
                : "Chưa có gợi ý nào"}
            </Text>
          }
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator />
              </View>
            ) : null
          }
          onEndReached={() => {
            if (trimmedKeyword && hasMore && !isLoadingMore && !isSearching) {
              runSearch({
                append: true,
                index: nextIndex,
                value: trimmedKeyword,
              });
            }
          }}
          onEndReachedThreshold={0.35}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  header: {
    minHeight: 50,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },

  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    flex: 1,
    color: "#050505",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },

  headerRightPlaceholder: {
    width: 36,
    height: 36,
  },

  toRow: {
    minHeight: 54,
    paddingHorizontal: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
  },

  toLabel: {
    color: "#65676B",
    fontSize: 15,
    marginRight: 8,
  },

  toInput: {
    flex: 1,
    minHeight: 42,
    color: "#050505",
    fontSize: 15,
    paddingVertical: 8,
  },

  clearButton: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  errorText: {
    paddingHorizontal: 18,
    paddingTop: 10,
    color: "#DC2626",
    fontSize: 13,
  },

  sectionHeader: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 6,
  },

  sectionTitle: {
    color: "#8A8D91",
    fontSize: 13,
    fontWeight: "600",
  },

  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 24,
  },

  userRow: {
    minHeight: 58,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  userRowPressed: {
    backgroundColor: "#F0F2F5",
  },

  avatarWrap: {
    marginRight: 12,
  },

  userTextWrap: {
    flex: 1,
  },

  userName: {
    color: "#050505",
    fontSize: 14,
    fontWeight: "700",
  },

  userSubtitle: {
    marginTop: 2,
    color: "#65676B",
    fontSize: 13,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyText: {
    paddingTop: 26,
    color: "#65676B",
    fontSize: 14,
    textAlign: "center",
  },

  footerLoader: {
    paddingVertical: 16,
  },
});
