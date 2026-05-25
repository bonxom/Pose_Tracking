import { backendApi } from "@/api/client";
import BackIcon from "@/components/icons/BackIcon";
import ProfileIcon from "@/components/icons/ProfileIcon";
import ProfileActionSheet from "@/components/profile/ProfileActionSheet";
import SearchIcon from "@/components/icons/SearchIcon";
import PostCard from "@/components/post/PostCard";
import colors from "@/constants/colors";
import sizes from "@/constants/sizes";
import { extractList, normalizePost } from "@/repositories/normalizers";
import { toggleLike } from "@/repositories/postRepository";
import { getAuthSession } from "@/utils/session";
import { router, useFocusEffect } from "expo-router";
import {
  memo,
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PAGE_SIZE = 20;
const SEARCH_TABS = [
  { id: "all", label: "Tất cả" },
  { id: "people", label: "Mọi người" },
  { id: "posts", label: "Bài viết" },
];

let searchScreenCache = {
  keyword: "",
  posts: [],
  users: [],
  savedSearches: [],
  activeTab: "all",
  hasSearched: false,
  nextIndex: 0,
  hasMore: false,
};

function resetSearchScreenCache() {
  searchScreenCache = {
    keyword: "",
    posts: [],
    users: [],
    savedSearches: [],
    activeTab: "all",
    hasSearched: false,
    nextIndex: 0,
    hasMore: false,
  };
}

function mapSavedSearches(response) {
  const data = response?.data || {};
  const items = Array.isArray(data.saved_searches)
    ? data.saved_searches
    : Array.isArray(data.items)
      ? data.items
      : [];

  return items
    .map((item, index) => ({
      id: String(item.search_id || item.id || `saved_${index}`),
      keyword: String(item.keyword || item.value || item.text || "").trim(),
      createdAt: String(item.created_at || item.createdAt || ""),
    }))
    .filter((item) => item.keyword);
}

function mapPosts(response) {
  return extractList(response)
    .map((item) => normalizePost(item))
    .filter((item) => item?.id);
}

function mapUsersFromResponse(response, fallbackPosts = []) {
  const rawUsers = Array.isArray(response?.data?.users) ? response.data.users : [];
  const seen = new Set();
  const mappedUsers = rawUsers
    .map((item, index) => ({
      id: String(item.id || item.user_id || item._id || `search_user_${index}`),
      name: String(
        item.name ||
          item.fullname ||
          item.fullName ||
          item.username ||
          item.user_name ||
          "Người dùng",
      ),
      handle: String(item.username || item.user_name || item.handle || ""),
      role: String(item.role || item.type || "HV"),
      avatar: String(item.avatar || item.avatar_url || item.image || ""),
      description: String(item.description || item.described || item.bio || ""),
    }))
    .filter((item) => {
      if (!item.id || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });

  if (mappedUsers.length) {
    return mappedUsers;
  }

  return dedupeUsers(fallbackPosts);
}

function dedupeUsers(posts = []) {
  const seen = new Set();
  return posts
    .map((post) => ({
      id: String(post.author?.id || ""),
      name:
        post.author?.name ||
        post.author?.username ||
        post.author?.handle ||
        "Người dùng",
      handle: post.author?.handle || post.author?.username || "",
      role: post.author?.role || "HV",
      avatar: post.author?.avatar || "",
      description: "",
    }))
    .filter((user) => {
      if (!user.id || seen.has(user.id)) return false;
      seen.add(user.id);
      return true;
    });
}

function persistCache(nextState) {
  searchScreenCache = {
    ...searchScreenCache,
    ...nextState,
  };
}

const SearchTabButton = memo(function SearchTabButton({
  label,
  active,
  onPress,
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tabButton, active && styles.tabButtonActive]}
    >
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
});

const HistoryRow = memo(function HistoryRow({
  item,
  active,
  onPress,
  onOpenMenu,
}) {
  return (
    <View style={styles.historyRow}>
      <Pressable style={styles.historyMain} onPress={onPress}>
        <View style={styles.historyIconWrap}>
          <ProfileIcon name="time-outline" size={16} color={colors.ink} />
        </View>
        <View style={styles.historyBody}>
          <Text style={styles.historyTitle} numberOfLines={1}>
            {item.keyword}
          </Text>
        </View>
      </Pressable>
      <Pressable
        onPress={onOpenMenu}
        hitSlop={8}
        style={[
          styles.historyMenuButton,
          active && styles.historyMenuButtonActive,
        ]}
      >
        <ProfileIcon
          name="ellipsis-horizontal"
          size={20}
          color={active ? colors.brand : colors.inkSoft}
        />
      </Pressable>
    </View>
  );
});

const SkeletonRow = memo(function SkeletonRow({
  avatar = true,
  subtitle = true,
  compact = false,
}) {
  return (
    <View style={[styles.skeletonRow, compact && styles.skeletonRowCompact]}>
      {avatar ? <View style={styles.skeletonAvatar} /> : null}
      <View style={styles.skeletonBody}>
        <View style={[styles.skeletonLine, styles.skeletonLinePrimary]} />
        {subtitle ? <View style={[styles.skeletonLine, styles.skeletonLineSecondary]} /> : null}
      </View>
    </View>
  );
});

const UserResultCard = memo(function UserResultCard({ user, onPress }) {
  const subtitle = user.description || "Có bài viết mới";

  return (
    <Pressable style={styles.userCard} onPress={onPress}>
      {user.avatar ? (
        <Image source={{ uri: user.avatar }} style={styles.userAvatar} />
      ) : (
        <View style={[styles.userAvatar, styles.userAvatarFallback]}>
          <Text style={styles.userAvatarText}>
            {String(user.name).trim()[0]?.toUpperCase() || "U"}
          </Text>
        </View>
      )}
      <View style={styles.userInfo}>
        <Text style={styles.userName} numberOfLines={1}>
          {user.name}
        </Text>
        <Text style={styles.userMeta} numberOfLines={1}>
          {user.handle ? `@${user.handle.replace(/^@/, "")}` : user.role}
          {user.handle ? ` · ${user.role}` : ""}
        </Text>
        <Text style={styles.userDescription} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
      <ProfileIcon name="chevron-forward" size={18} color={colors.subtext} />
    </Pressable>
  );
});

const SuggestionRow = memo(function SuggestionRow({ label, icon, onPress }) {
  return (
    <Pressable style={styles.suggestionRow} onPress={onPress}>
      <View style={styles.suggestionIconWrap}>
        <ProfileIcon name={icon} size={16} color={colors.ink} />
      </View>
      <Text style={styles.suggestionText} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
});

const SearchPostRow = memo(function SearchPostRow({
  item,
  onPressPost,
  onToggleLike,
  onPressComment,
}) {
  return (
    <PostCard
      post={item}
      onPress={() => onPressPost(item)}
      onToggleLike={() => onToggleLike(item)}
      onPressComment={() => onPressComment(item)}
    />
  );
});

const SearchHeader = memo(function SearchHeader({
  keyword,
  activeTab,
  hasSearched,
  error,
  loadingSearch,
  loadingHistory,
  suggestions,
  users,
  savedSearches,
  activeHistoryItem,
  onBack,
  onChangeKeyword,
  onFocusInput,
  onSubmitSearch,
  onClearKeyword,
  onSelectSuggestion,
  onSelectHistory,
  onOpenHistoryMenu,
  onClearAllHistory,
  onChangeTab,
  onPressUser,
}) {
  const showSuggestions = Boolean(keyword.trim()) && !hasSearched;
  const showHistory = !keyword.trim() && !hasSearched;

  return (
    <View style={styles.headerShell}>
      <View style={styles.headerBar}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <BackIcon size={22} color={colors.text} />
        </Pressable>
        <View style={styles.searchInputWrap}>
          <SearchIcon size={18} color={colors.subtext} />
          <TextInput
            value={keyword}
            onChangeText={onChangeKeyword}
            placeholder="Tìm kiếm"
            placeholderTextColor={colors.placeholder}
            style={styles.searchInput}
            returnKeyType="search"
            onSubmitEditing={onSubmitSearch}
            onFocus={onFocusInput}
            autoFocus
          />
          {keyword ? (
            <Pressable style={styles.clearButton} onPress={onClearKeyword}>
              <ProfileIcon name="close" size={18} color={colors.subtext} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {showSuggestions ? (
        <View style={styles.panel}>
          {loadingSearch ? (
            <View style={styles.suggestionLoadingRow}>
              <ActivityIndicator size="small" color={colors.brand} />
            </View>
          ) : null}
          {suggestions.length ? (
            suggestions.map((item) => (
              <SuggestionRow
                key={item}
                label={item}
                icon="search-outline"
                onPress={() => onSelectSuggestion(item)}
              />
            ))
          ) : (
            <Text style={styles.emptyInlineText}>Chưa có gợi ý phù hợp.</Text>
          )}
        </View>
      ) : null}

      {showHistory ? (
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Mới đây</Text>
            {savedSearches.length ? (
              <Pressable onPress={onClearAllHistory}>
                <Text style={styles.headerLink}>Xóa tất cả</Text>
              </Pressable>
            ) : null}
          </View>

          {loadingHistory ? (
            <View style={styles.skeletonGroup}>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow subtitle={false} />
            </View>
          ) : savedSearches.length ? (
            savedSearches.map((item) => (
              <HistoryRow
                key={item.id}
                item={item}
                active={activeHistoryItem?.id === item.id}
                onPress={() => onSelectHistory(item.keyword)}
                onOpenMenu={() => onOpenHistoryMenu(item)}
              />
            ))
          ) : (
            <Text style={styles.emptyInlineText}>Chưa có lịch sử tìm kiếm.</Text>
          )}
        </View>
      ) : null}

      {hasSearched ? (
        <View style={styles.tabRow}>
          {SEARCH_TABS.map((tab) => (
            <SearchTabButton
              key={tab.id}
              label={tab.label}
              active={activeTab === tab.id}
              onPress={() => onChangeTab(tab.id)}
            />
          ))}
        </View>
      ) : null}

      {hasSearched && activeTab === "all" ? (
        <>
          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Mọi người</Text>
              {users.length > 3 ? (
                <Pressable onPress={() => onChangeTab("people")}>
                  <Text style={styles.headerLink}>Xem tất cả</Text>
                </Pressable>
              ) : null}
            </View>

            {users.length ? (
              users.slice(0, 3).map((user) => (
                <UserResultCard
                  key={user.id}
                  user={user}
                  onPress={() => onPressUser(user)}
                />
              ))
            ) : loadingSearch ? (
              <View style={styles.skeletonGroup}>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </View>
            ) : (
              <Text style={styles.emptyInlineText}>Không có người dùng phù hợp.</Text>
            )}
          </View>

          <View style={styles.postsHeader}>
            <Text style={styles.postsHeaderTitle}>Bài viết</Text>
          </View>
        </>
      ) : null}
    </View>
  );
});

export default function SearchScreen() {
  const [token, setToken] = useState("");
  const [keyword, setKeyword] = useState(searchScreenCache.keyword);
  const [posts, setPosts] = useState(searchScreenCache.posts);
  const [users, setUsers] = useState(searchScreenCache.users);
  const [savedSearches, setSavedSearches] = useState(searchScreenCache.savedSearches);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(searchScreenCache.hasSearched);
  const [nextIndex, setNextIndex] = useState(searchScreenCache.nextIndex);
  const [hasMore, setHasMore] = useState(searchScreenCache.hasMore);
  const [activeTab, setActiveTab] = useState(searchScreenCache.activeTab);
  const [historyMenuItem, setHistoryMenuItem] = useState(null);

  const deferredKeyword = useDeferredValue(keyword);

  useEffect(() => {
    return () => {
      resetSearchScreenCache();
    };
  }, []);

  const suggestions = useMemo(() => {
    const normalizedKeyword = deferredKeyword.trim().toLowerCase();
    const suggestionPool = [
      ...savedSearches.map((item) => item.keyword),
      ...users.map((item) => item.name),
      ...users.map((item) => item.handle),
    ]
      .map((item) => String(item || "").trim())
      .filter(Boolean);

    const uniqueSuggestions = [...new Set(suggestionPool)];

    if (!normalizedKeyword) {
      return uniqueSuggestions.slice(0, 8);
    }

    return uniqueSuggestions
      .filter((item) => item.toLowerCase().includes(normalizedKeyword))
      .slice(0, 8);
  }, [deferredKeyword, savedSearches, users]);

  useEffect(() => {
    persistCache({
      keyword,
      posts,
      users,
      savedSearches,
      activeTab,
      hasSearched,
      nextIndex,
      hasMore,
    });
  }, [activeTab, hasMore, hasSearched, keyword, nextIndex, posts, savedSearches, users]);

  const loadSavedSearches = useCallback(async (sessionToken) => {
    if (!sessionToken) return;

    try {
      setLoadingHistory(true);
      const response = await backendApi.getSavedSearch({
        token: sessionToken,
        index: "0",
        count: "20",
      });

      if (String(response?.code || "") !== "1000") {
        throw new Error(response?.message || "Không thể tải lịch sử tìm kiếm.");
      }

      const mapped = mapSavedSearches(response);
      setSavedSearches(mapped);
    } catch (loadError) {
      setError(loadError.message || "Không thể tải lịch sử tìm kiếm.");
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let alive = true;

      const bootstrap = async () => {
        const session = await getAuthSession();
        if (!alive) return;

        const sessionToken = String(session?.token || "");
        setToken(sessionToken);
        await loadSavedSearches(sessionToken);
      };

      bootstrap().catch((bootstrapError) => {
        if (alive) {
          setError(bootstrapError.message || "Không thể khởi tạo tìm kiếm.");
        }
      });

      return () => {
        alive = false;
      };
    }, [loadSavedSearches]),
  );

  const runSearch = useCallback(
    async ({ append = false, index = 0, value = keyword } = {}) => {
      const trimmedKeyword = String(value || "").trim();

      if (!token) {
        setError("Thiếu token đăng nhập.");
        return;
      }

      if (!trimmedKeyword) {
        setHasSearched(false);
        setPosts([]);
        setUsers([]);
        setHasMore(false);
        setNextIndex(0);
        setActiveTab("all");
        setError("");
        return;
      }

      try {
        setError("");
        setHasSearched(true);
        if (append) {
          setLoadingMore(true);
        } else {
          setLoadingSearch(true);
          setActiveTab("all");
        }

        const response = await backendApi.search({
          token,
          keyword: trimmedKeyword,
          index: String(index),
          count: String(PAGE_SIZE),
        });

        if (String(response?.code || "") !== "1000") {
          throw new Error(response?.message || "Không thể tìm kiếm.");
        }

        const nextPostsChunk = mapPosts(response);
        const nextUsersChunk = mapUsersFromResponse(response, nextPostsChunk);

        startTransition(() => {
          setPosts((current) => {
            if (!append) return nextPostsChunk;
            const map = new Map(current.map((item) => [item.id, item]));
            nextPostsChunk.forEach((item) => map.set(item.id, item));
            return Array.from(map.values());
          });

          setUsers((current) => {
            if (!append) return nextUsersChunk;
            const map = new Map(current.map((item) => [item.id, item]));
            nextUsersChunk.forEach((item) => map.set(item.id, item));
            return Array.from(map.values());
          });
        });

        setNextIndex(index + PAGE_SIZE);
        setHasMore(nextPostsChunk.length >= PAGE_SIZE);
      } catch (searchError) {
        setError(searchError.message || "Không thể tìm kiếm.");
        if (!append) {
          setPosts([]);
          setUsers([]);
          setHasMore(false);
        }
      } finally {
        setLoadingSearch(false);
        setLoadingMore(false);
      }
    },
    [keyword, token],
  );

  const openProfilePreview = useCallback((userId) => {
    const normalizedUserId = String(userId || "").trim();
    if (!normalizedUserId) return;

    router.push({
      pathname: "/profile/[userId]",
      params: { userId: normalizedUserId },
    });
  }, []);

  const handleDeleteSavedSearch = useCallback(
    async (item) => {
      if (!token) return;

      try {
        const response = await backendApi.deleteSavedSearch({
          token,
          search_id: item.id,
          all: "0",
        });

        if (String(response?.code || "") !== "1000") {
          throw new Error(response?.message || "Không thể xóa lịch sử.");
        }

        setSavedSearches((current) =>
          current.filter((saved) => saved.id !== item.id),
        );
      } catch (deleteError) {
        setError(deleteError.message || "Không thể xóa lịch sử.");
      }
    },
    [token],
  );

  const handleClearAllSavedSearches = useCallback(async () => {
    if (!token) return;

    try {
      const response = await backendApi.deleteSavedSearch({
        token,
        all: "1",
      });

      if (String(response?.code || "") !== "1000") {
        throw new Error(response?.message || "Không thể xóa toàn bộ lịch sử.");
      }

      setSavedSearches([]);
    } catch (deleteError) {
      setError(deleteError.message || "Không thể xóa toàn bộ lịch sử.");
    }
  }, [token]);

  const handleToggleLike = useCallback(async (post) => {
    try {
      const updated = await toggleLike(post);
      setPosts((current) =>
        current.map((item) => (item.id === post.id ? updated : item)),
      );
    } catch (likeError) {
      setError(likeError.message || "Không thể thích bài viết.");
    }
  }, []);

  const handlePressUser = useCallback(
    (user) => {
      openProfilePreview(user.id);
    },
    [openProfilePreview],
  );

  const handlePressPost = useCallback(
    (post) => {
      openProfilePreview(post.author?.id);
    },
    [openProfilePreview],
  );

  const handlePressPostComment = useCallback(
    (post) => {
      openProfilePreview(post.author?.id);
    },
    [openProfilePreview],
  );

  const handleChangeKeyword = useCallback((value) => {
    setKeyword(value);
    setHasSearched(false);
    setActiveTab("all");
    setError("");
  }, []);

  const handleClearKeyword = useCallback(() => {
    setKeyword("");
    setError("");
    setHasSearched(false);
    setPosts([]);
    setUsers([]);
    setHasMore(false);
    setNextIndex(0);
    setActiveTab("all");
  }, []);

  const handleFocusInput = useCallback(() => {
    loadSavedSearches(token);
  }, [loadSavedSearches, token]);

  const handleSubmitSearch = useCallback(() => {
    runSearch({ index: 0, append: false });
  }, [runSearch]);

  const handleSelectKeyword = useCallback(
    (value) => {
      setKeyword(value);
      runSearch({ index: 0, append: false, value });
    },
    [runSearch],
  );

  const renderPostItem = useCallback(
    ({ item }) => (
      <SearchPostRow
        item={item}
        onPressPost={handlePressPost}
        onToggleLike={handleToggleLike}
        onPressComment={handlePressPostComment}
      />
    ),
    [handlePressPost, handlePressPostComment, handleToggleLike],
  );

  const keyExtractor = useCallback((item) => item.id, []);
  const showPosts = hasSearched && (activeTab === "all" || activeTab === "posts");

  return (
    <SafeAreaView style={styles.safeArea}>
      <SearchHeader
        keyword={keyword}
        activeTab={activeTab}
        hasSearched={hasSearched}
        error={error}
        loadingSearch={loadingSearch}
        loadingHistory={loadingHistory}
        suggestions={suggestions}
        users={users}
        savedSearches={savedSearches}
        activeHistoryItem={historyMenuItem}
        onBack={() => router.back()}
        onChangeKeyword={handleChangeKeyword}
        onFocusInput={handleFocusInput}
        onSubmitSearch={handleSubmitSearch}
        onClearKeyword={handleClearKeyword}
        onSelectSuggestion={handleSelectKeyword}
        onSelectHistory={handleSelectKeyword}
        onOpenHistoryMenu={setHistoryMenuItem}
        onClearAllHistory={handleClearAllSavedSearches}
        onChangeTab={setActiveTab}
        onPressUser={handlePressUser}
      />

      {loadingSearch && !posts.length && !users.length ? (
        <View style={styles.loadingScreen}>
          <View style={styles.panel}>
            <View style={styles.suggestionLoadingRow}>
              <ActivityIndicator size="small" color={colors.brand} />
            </View>
            <View style={styles.skeletonGroup}>
              <SkeletonRow />
              <SkeletonRow />
            </View>
          </View>
          <View style={styles.postsHeader}>
            <Text style={styles.postsHeaderTitle}>Bài viết</Text>
          </View>
          <View style={styles.loadingPosts}>
            <View style={styles.postSkeletonCard}>
              <SkeletonRow />
              <View style={styles.postSkeletonBlock} />
              <View style={[styles.postSkeletonBlock, styles.postSkeletonBlockShort]} />
            </View>
            <View style={styles.postSkeletonCard}>
              <SkeletonRow />
              <View style={styles.postSkeletonBlock} />
              <View style={[styles.postSkeletonBlock, styles.postSkeletonBlockShort]} />
            </View>
          </View>
        </View>
      ) : showPosts ? (
        <FlatList
          data={posts}
          keyExtractor={keyExtractor}
          renderItem={renderPostItem}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Không tìm thấy kết quả nào</Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator color={colors.brand} />
              </View>
            ) : null
          }
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews
          initialNumToRender={4}
          maxToRenderPerBatch={4}
          windowSize={5}
          onEndReached={() => {
            if (hasMore && !loadingMore && !loadingSearch) {
              runSearch({ append: true, index: nextIndex });
            }
          }}
          onEndReachedThreshold={0.35}
        />
      ) : hasSearched && activeTab === "people" ? (
        <FlatList
          data={users}
          keyExtractor={keyExtractor}
          renderItem={({ item }) => (
            <View style={styles.peopleListRow}>
              <UserResultCard
                user={item}
                onPress={() => handlePressUser(item)}
              />
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Không tìm thấy kết quả nào</Text>
            </View>
          }
          contentContainerStyle={styles.peopleListContent}
          keyboardShouldPersistTaps="handled"
        />
      ) : (
        <View style={styles.idleSpacer} />
      )}

      <ProfileActionSheet
        visible={Boolean(historyMenuItem)}
        onClose={() => setHistoryMenuItem(null)}
        rows={[
          {
            label: historyMenuItem?.keyword || "Mở tìm kiếm này",
            icon: "search-outline",
            onPress: () => {
              if (historyMenuItem?.keyword) {
                handleSelectKeyword(historyMenuItem.keyword);
              }
            },
          },
          {
            label: "Xóa khỏi lịch sử tìm kiếm",
            icon: "trash-outline",
            onPress: () => {
              if (historyMenuItem) {
                handleDeleteSavedSearch(historyMenuItem);
              }
            },
          },
        ]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  headerShell: {
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderStrong,
    gap: 10,
    paddingBottom: 12,
  },
  headerBar: {
    paddingHorizontal: sizes.md,
    paddingTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  searchInputWrap: {
    flex: 1,
    minHeight: 46,
    borderRadius: 23,
    paddingHorizontal: 16,
    backgroundColor: "#EFF2F5",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    position: "relative",
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    paddingRight: 26,
  },
  clearButton: {
    position: "absolute",
    right: 12,
    top: 13,
  },
  errorText: {
    paddingHorizontal: sizes.md,
    color: colors.error,
    fontSize: 13,
  },
  panel: {
    marginHorizontal: sizes.md,
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 0,
    backgroundColor: colors.white,
    borderWidth: 0,
    gap: sizes.sm,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: sizes.sm,
    paddingHorizontal: 0,
  },
  panelTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: colors.text,
  },
  headerLink: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.brand,
  },
  suggestionLoadingRow: {
    minHeight: 26,
    justifyContent: "center",
  },
  suggestionRow: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: sizes.sm,
  },
  suggestionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#E9EEF5",
    alignItems: "center",
    justifyContent: "center",
  },
  suggestionText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 68,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  historyMain: {
    flex: 1,
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  historyIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E9EEF5",
    alignItems: "center",
    justifyContent: "center",
  },
  historyBody: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
  },
  historyMenuButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F2F4F7",
  },
  historyMenuButtonActive: {
    backgroundColor: "#E7F0FF",
  },
  emptyInlineText: {
    fontSize: 14,
    color: colors.subtext,
  },
  tabRow: {
    paddingHorizontal: sizes.md,
    flexDirection: "row",
    gap: 8,
    paddingTop: 2,
  },
  tabButton: {
    minHeight: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF2F5",
  },
  tabButtonActive: {
    backgroundColor: "#DCEBFF",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.subtext,
  },
  tabTextActive: {
    color: colors.brand,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: sizes.sm,
    minHeight: 72,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  userAvatarFallback: {
    backgroundColor: "#E7F0FF",
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatarText: {
    color: colors.brand,
    fontSize: 18,
    fontWeight: "900",
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
  },
  userMeta: {
    fontSize: 13,
    color: colors.subtext,
  },
  userDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.inkSoft,
  },
  postsHeader: {
    paddingHorizontal: sizes.md,
    paddingTop: 4,
  },
  postsHeaderTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: colors.text,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: sizes.md,
    paddingTop: 10,
    paddingBottom: sizes.xl,
    gap: sizes.md,
  },
  idleSpacer: {
    flex: 1,
  },
  loadingScreen: {
    flex: 1,
    paddingTop: 12,
    gap: 12,
  },
  loadingPosts: {
    paddingHorizontal: sizes.md,
    gap: sizes.md,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  peopleListContent: {
    flexGrow: 1,
    paddingHorizontal: sizes.md,
    paddingTop: 10,
    paddingBottom: sizes.xl,
  },
  peopleListRow: {
    marginBottom: sizes.md,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: sizes.xl,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: colors.text,
    textAlign: "center",
  },
  footerLoader: {
    paddingVertical: sizes.md,
    alignItems: "center",
    justifyContent: "center",
  },
  skeletonGroup: {
    gap: 10,
  },
  skeletonRow: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: sizes.sm,
  },
  skeletonRowCompact: {
    minHeight: 48,
  },
  skeletonAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E9EEF5",
  },
  skeletonBody: {
    flex: 1,
    gap: 8,
  },
  skeletonLine: {
    borderRadius: 999,
    backgroundColor: "#E9EEF5",
  },
  skeletonLinePrimary: {
    width: "68%",
    height: 14,
  },
  skeletonLineSecondary: {
    width: "42%",
    height: 12,
  },
  postSkeletonCard: {
    borderRadius: 16,
    backgroundColor: colors.white,
    padding: sizes.md,
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
  },
  postSkeletonBlock: {
    height: 160,
    borderRadius: 14,
    backgroundColor: "#E9EEF5",
  },
  postSkeletonBlockShort: {
    height: 18,
    width: "55%",
  },
});
