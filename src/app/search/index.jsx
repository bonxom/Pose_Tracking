import { backendApi } from "@/api/client";
import colors from "@/constants/colors";
import ProfileActionSheet from "@/components/profile/ProfileActionSheet";
import {
  SearchHeader,
  SearchPostRow,
  SearchSkeletonRow,
  SearchUserCard,
} from "@/components/search/SearchScreenParts";
import searchStyles from "@/styles/search.styles";
import {
  PAGE_SIZE,
  SEARCH_TABS,
  getSearchScreenCache,
  mapPosts,
  mapSavedSearches,
  mapUsersFromResponse,
  persistSearchScreenCache,
  resetSearchScreenCache,
} from "@/utils/search";
import { toggleLike } from "@/repositories/postRepository";
import { getAuthSession } from "@/utils/session";
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
        searchTabs={SEARCH_TABS}
      />

      {loadingSearch && !posts.length && !users.length ? (
        <View style={searchStyles.loadingScreen}>
          <View style={searchStyles.panel}>
            <View style={searchStyles.suggestionLoadingRow}>
              <ActivityIndicator size="small" color={colors.brand} />
            </View>
            <View style={searchStyles.skeletonGroup}>
              <SearchSkeletonRow />
              <SearchSkeletonRow />
            </View>
          </View>
          <View style={searchStyles.postsHeader}>
            <Text style={searchStyles.postsHeaderTitle}>Bài viết</Text>
          </View>
          <View style={searchStyles.loadingPosts}>
            <View style={searchStyles.postSkeletonCard}>
              <SearchSkeletonRow />
              <View style={searchStyles.postSkeletonBlock} />
              <View style={[searchStyles.postSkeletonBlock, searchStyles.postSkeletonBlockShort]} />
            </View>
            <View style={searchStyles.postSkeletonCard}>
              <SearchSkeletonRow />
              <View style={searchStyles.postSkeletonBlock} />
              <View style={[searchStyles.postSkeletonBlock, searchStyles.postSkeletonBlockShort]} />
            </View>
          </View>
        </View>
      ) : showPosts ? (
        <FlatList
          data={posts}
          keyExtractor={keyExtractor}
          renderItem={renderPostItem}
          ListEmptyComponent={
            <View style={searchStyles.emptyState}>
              <Text style={searchStyles.emptyTitle}>Không tìm thấy kết quả nào</Text>
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
      ) : hasSearched && activeTab === "people" ? (
        <FlatList
          data={users}
          keyExtractor={keyExtractor}
          renderItem={({ item }) => (
            <View style={searchStyles.peopleListRow}>
              <SearchUserCard user={item} onPress={() => handlePressUser(item)} />
            </View>
          )}
          ListEmptyComponent={
            <View style={searchStyles.emptyState}>
              <Text style={searchStyles.emptyTitle}>Không tìm thấy kết quả nào</Text>
            </View>
          }
          contentContainerStyle={searchStyles.peopleListContent}
          keyboardShouldPersistTaps="handled"
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
