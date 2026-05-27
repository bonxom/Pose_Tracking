import ProfileActionSheet from "@/components/profile/ProfileActionSheet";
import {
  SearchHeader,
  SearchPostRow,
  SearchSkeletonRow,
} from "@/components/search/SearchScreenParts";
import { SearchUserCard } from "@/components/search/SearchScreenParts";
import colors from "@/constants/colors";
import { toggleLike } from "@/repositories/postRepository";
import {
  clearSavedSearches,
  deleteSavedSearch,
  getSavedSearches,
  searchScreenSearch,
} from "@/repositories/searchRepository";
import searchStyles from "@/styles/search.styles";
import {
  PAGE_SIZE,
  SEARCH_TABS,
  getSearchScreenCache,
  persistSearchScreenCache,
  resetSearchScreenCache,
} from "@/utils/search";
import { router, useFocusEffect } from "expo-router";
import {
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const searchScreenCache = getSearchScreenCache();
const PROFILE_OR_POST_TABS = SEARCH_TABS;

function normalizeSearchTab(tab) {
  return tab === "people" || tab === "posts" || tab === "all" ? tab : "all";
}

function getBestSearchTab(keyword = "", users = [], posts = []) {
  if (users.length && !posts.length) {
    return "people";
  }

  const normalizedKeyword = String(keyword || "").trim().toLowerCase();
  if (!normalizedKeyword) {
    return posts.length ? "posts" : "people";
  }

  const matchedUser = users.some((user) => {
    const values = [user?.name, user?.handle]
      .map((value) => String(value || "").trim().toLowerCase())
      .filter(Boolean);

    return values.some((value) => value.includes(normalizedKeyword) || normalizedKeyword.includes(value));
  });

  if (matchedUser && users.length) {
    return "people";
  }

  return posts.length ? "posts" : "people";
}

function buildSavedSearchEntry(keyword = "", currentItems = []) {
  const trimmedKeyword = String(keyword || "").trim();
  if (!trimmedKeyword) {
    return currentItems;
  }

  const normalizedKeyword = trimmedKeyword.toLowerCase();
  const nextItem = {
    id: `local_saved_${normalizedKeyword.replace(/[^a-z0-9]+/g, "_") || Date.now()}`,
    keyword: trimmedKeyword,
    createdAt: new Date().toISOString(),
  };

  return [
    nextItem,
    ...currentItems.filter(
      (item) => String(item.keyword || "").trim().toLowerCase() !== normalizedKeyword,
    ),
  ].slice(0, 20);
}

export default function SearchScreen() {
  const [keyword, setKeyword] = useState(searchScreenCache.keyword);
  const [posts, setPosts] = useState(searchScreenCache.posts);
  const [users, setUsers] = useState(searchScreenCache.users);
  const [savedSearches, setSavedSearches] = useState(
    searchScreenCache.savedSearches,
  );
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(
    searchScreenCache.hasSearched,
  );
  const [nextIndex, setNextIndex] = useState(searchScreenCache.nextIndex);
  const [hasMore, setHasMore] = useState(searchScreenCache.hasMore);
  const [activeTab, setActiveTab] = useState(
    normalizeSearchTab(searchScreenCache.activeTab),
  );
  const [historyMenuItem, setHistoryMenuItem] = useState(null);

  const deferredKeyword = useDeferredValue(keyword);

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
    persistSearchScreenCache({
      keyword,
      posts,
      users,
      savedSearches,
      activeTab,
      hasSearched,
      nextIndex,
      hasMore,
    });
  }, [
    activeTab,
    hasMore,
    hasSearched,
    keyword,
    nextIndex,
    posts,
    savedSearches,
    users,
  ]);

  const loadSavedSearches = useCallback(async () => {
    try {
      setLoadingHistory(true);
      setError("");
      const history = await getSavedSearches();
      setSavedSearches(history);
    } catch (loadError) {
      setError(loadError.message || "Không thể tải lịch sử tìm kiếm.");
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSavedSearches().catch((bootstrapError) => {
        setError(bootstrapError.message || "Không thể khởi tạo tìm kiếm.");
      });
    }, [loadSavedSearches]),
  );

  const runSearch = useCallback(
    async ({ append = false, index = 0, value = keyword } = {}) => {
      const trimmedKeyword = String(value || "").trim();

      if (!trimmedKeyword) {
        setHasSearched(false);
        setPosts([]);
        setUsers([]);
        setHasMore(false);
        setNextIndex(0);
        setActiveTab("posts");
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
        }

        const result = await searchScreenSearch(trimmedKeyword, {
          index,
          count: PAGE_SIZE,
          append,
        });

        startTransition(() => {
          setPosts((current) => {
            if (!append) return result.posts;
            const map = new Map(current.map((item) => [item.id, item]));
            result.posts.forEach((item) => map.set(item.id, item));
            return Array.from(map.values());
          });

          setUsers((current) => {
            if (!append) return result.users;
            const map = new Map(current.map((item) => [item.id, item]));
            result.users.forEach((item) => map.set(item.id, item));
            return Array.from(map.values());
          });
        });

        if (!append) {
          setActiveTab(getBestSearchTab(trimmedKeyword, result.users, result.posts));
        }

        if (!append && index === 0) {
          setSavedSearches((current) =>
            buildSavedSearchEntry(trimmedKeyword, current),
          );
          loadSavedSearches().catch(() => {});
        }

        setNextIndex(result.nextIndex);
        setHasMore(result.hasMore);
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
    [keyword, loadSavedSearches],
  );

  const handleDeleteSavedSearch = useCallback(async (item) => {
    try {
      await deleteSavedSearch(item.id);

      setSavedSearches((current) =>
        current.filter((saved) => saved.id !== item.id),
      );
    } catch (deleteError) {
      setError(deleteError.message || "Không thể xóa lịch sử tìm kiếm.");
    }
  }, []);

  const handleClearAllSavedSearches = useCallback(async () => {
    try {
      await clearSavedSearches();

      setSavedSearches([]);
    } catch (deleteError) {
      setError(deleteError.message || "Không thể xóa toàn bộ lịch sử tìm kiếm.");
    }
  }, []);

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

  const handlePressUser = useCallback((user) => {
    const normalizedUserId = String(user?.id || "").trim();
    if (!normalizedUserId) return;

    router.push({
      pathname: "/profile/[userId]",
      params: { userId: normalizedUserId },
    });
  }, []);

  const handlePressPost = useCallback(
    (post) => {
      router.push(`/post/${post.id}`);
    },
    [],
  );

  const handlePressPostComment = useCallback(
    (post) => {
      router.push(`/post/comment/${post.id}`);
    },
    [],
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
    loadSavedSearches();
  }, [loadSavedSearches]);

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
  const showProfiles = hasSearched && (activeTab === "all" || activeTab === "people");

  return (
    <SafeAreaView style={searchStyles.safeArea}>
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
        searchTabs={PROFILE_OR_POST_TABS}
      />

      {loadingSearch && !posts.length && !users.length ? (
        <View style={searchStyles.loadingScreen}>
          {showProfiles ? (
            <View style={searchStyles.panel}>
              <View style={searchStyles.suggestionLoadingRow}>
                <ActivityIndicator size="small" color={colors.brand} />
              </View>
              <View style={searchStyles.skeletonGroup}>
                <SearchSkeletonRow />
                <SearchSkeletonRow />
              </View>
            </View>
          ) : null}

          {showPosts ? (
            <View style={searchStyles.loadingPosts}>
              <View style={searchStyles.postSkeletonCard}>
                <SearchSkeletonRow />
                <View style={searchStyles.postSkeletonBlock} />
                <View
                  style={[
                    searchStyles.postSkeletonBlock,
                    searchStyles.postSkeletonBlockShort,
                  ]}
                />
              </View>
              <View style={searchStyles.postSkeletonCard}>
                <SearchSkeletonRow />
                <View style={searchStyles.postSkeletonBlock} />
                <View
                  style={[
                    searchStyles.postSkeletonBlock,
                    searchStyles.postSkeletonBlockShort,
                  ]}
                />
              </View>
            </View>
          ) : null}
        </View>
      ) : showProfiles && showPosts ? (
        <FlatList
          data={posts}
          keyExtractor={keyExtractor}
          renderItem={renderPostItem}
          ListHeaderComponent={() =>
            users.length ? (
              <View style={searchStyles.peopleListContent}>
                {users.map((user) => (
                  <SearchUserCard
                    key={user.id}
                    user={user}
                    onPress={() => handlePressUser(user)}
                  />
                ))}
              </View>
            ) : null
          }
          ListEmptyComponent={
            !users.length ? (
              <View style={searchStyles.emptyState}>
                <Text style={searchStyles.emptyTitle}>
                  Không tìm thấy kết quả nào
                </Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={searchStyles.footerLoader}>
                <ActivityIndicator color={colors.brand} />
              </View>
            ) : null
          }
          contentContainerStyle={searchStyles.listContent}
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
      ) : showProfiles ? (
        users.length ? (
          <View style={searchStyles.peopleListContent}>
            {users.map((user) => (
              <SearchUserCard
                key={user.id}
                user={user}
                onPress={() => handlePressUser(user)}
              />
            ))}
          </View>
        ) : (
          <View style={searchStyles.emptyState}>
            <Text style={searchStyles.emptyTitle}>Không tìm thấy người dùng nào</Text>
          </View>
        )
      ) : showPosts ? (
        <FlatList
          data={posts}
          keyExtractor={keyExtractor}
          renderItem={renderPostItem}
          ListEmptyComponent={
            <View style={searchStyles.emptyState}>
              <Text style={searchStyles.emptyTitle}>
                Không tìm thấy kết quả nào
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={searchStyles.footerLoader}>
                <ActivityIndicator color={colors.brand} />
              </View>
            ) : null
          }
          contentContainerStyle={searchStyles.listContent}
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
      ) : (
        <View style={searchStyles.idleSpacer} />
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