import { backendApi } from "@/api/client";
import ProfileActionSheet from "@/components/profile/ProfileActionSheet";
import {
  SearchHeader,
  SearchPostRow,
  SearchSkeletonRow,
  SearchUserCard,
} from "@/components/search/SearchScreenParts";
import colors from "@/constants/colors";
import { toggleLike } from "@/repositories/postRepository";
import { API_TYPE, API_TYPES } from "@/config/env";
import { assertBackendOk } from "@/repositories/serverResponse";
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
  const [token, setToken] = useState("");
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
  const [activeTab, setActiveTab] = useState(searchScreenCache.activeTab);
  const [historyMenuItem, setHistoryMenuItem] = useState(null);

  const deferredKeyword = useDeferredValue(keyword);

  useEffect(() => () => resetSearchScreenCache(), []);

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

  const loadSavedSearches = useCallback(async (sessionToken) => {
    if (!sessionToken) return;

    try {
      setLoadingHistory(true);
      setError("");
      const response = await backendApi.getSavedSearch({
        token: sessionToken,
        index: "0",
        count: "20",
      });

      await assertBackendOk(response, {
        allowNoData: true,
        message: "Không thể tải lịch sử tìm kiếm.",
      });

      setSavedSearches(mapSavedSearches(response));
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

        await assertBackendOk(response, {
          allowNoData: true,
          message: "Không thể tìm kiếm.",
        });

        const nextPostsChunk = mapPosts(response);
        let nextUsersChunk = mapUsersFromResponse(response, nextPostsChunk);

        if (
          API_TYPE === API_TYPES.BACKEND &&
          !append &&
          nextUsersChunk.length &&
          !response?.data?.users
        ) {
          const enrichedUsers = await Promise.all(
            nextUsersChunk.slice(0, 8).map(async (user) => {
              try {
                const profileResponse = await backendApi.getUserInfo({
                  token,
                  userId: user.id,
                });

                await assertBackendOk(profileResponse, {
                  allowNoData: true,
                  message: "Không thể tải thông tin người dùng.",
                });

                const data =
                  profileResponse?.data && !Array.isArray(profileResponse.data)
                    ? profileResponse.data
                    : Array.isArray(profileResponse?.data)
                      ? profileResponse.data[0]
                      : null;

                if (!data) return user;

                return {
                  ...user,
                  id: String(
                    data.id ||
                      data.user_id ||
                      data._id ||
                      data.uuid ||
                      user.id,
                  ),
                  name: String(
                    data.name ||
                      data.fullname ||
                      data.fullName ||
                      data.username ||
                      data.user_name ||
                      user.name,
                  ),
                  handle: String(
                    data.username || data.user_name || data.handle || user.handle || "",
                  ),
                  avatar: String(
                    data.avatar || data.avatar_url || data.image || data.picture || user.avatar || "",
                  ),
                  description: String(
                    data.description || data.described || data.bio || user.description || "",
                  ),
                  role: String(data.role || data.type || user.role || "HV"),
                };
              } catch {
                return user;
              }
            }),
          );

          const existingIds = new Set(enrichedUsers.map((item) => item.id));
          nextUsersChunk = [
            ...enrichedUsers,
            ...nextUsersChunk.filter((item) => !existingIds.has(item.id)),
          ];
        }

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

        if (!append && index === 0) {
          setSavedSearches((current) =>
            buildSavedSearchEntry(trimmedKeyword, current),
          );
          loadSavedSearches(token).catch(() => {});
        }

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
    [keyword, loadSavedSearches, token],
  );

  const openProfilePreview = useCallback((userId) => {
    const normalizedUserId = String(userId || "").trim();
    if (!normalizedUserId || normalizedUserId === "server_user") return;

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

        await assertBackendOk(response, {
          message: "Không thể xóa lịch sử tìm kiếm.",
        });

        setSavedSearches((current) =>
          current.filter((saved) => saved.id !== item.id),
        );
      } catch (deleteError) {
        setError(deleteError.message || "Không thể xóa lịch sử tìm kiếm.");
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

      await assertBackendOk(response, {
        message: "Không thể xóa toàn bộ lịch sử tìm kiếm.",
      });

      setSavedSearches([]);
    } catch (deleteError) {
      setError(deleteError.message || "Không thể xóa toàn bộ lịch sử tìm kiếm.");
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
      openProfilePreview(user.id || user.handle || user.name);
    },
    [openProfilePreview],
  );

  const handlePressPost = useCallback(
    (post) => {
      openProfilePreview(post.author?.id || post.author?.handle || post.author?.name);
    },
    [openProfilePreview],
  );

  const handlePressPostComment = useCallback(
    (post) => {
      openProfilePreview(post.author?.id || post.author?.handle || post.author?.name);
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
  const showPosts =
    hasSearched && (activeTab === "all" || activeTab === "posts");

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
        </View>
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
              <Text style={searchStyles.emptyTitle}>
                Không tìm thấy kết quả nào
              </Text>
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
