import ProfileActionSheet from "@/components/profile/ProfileActionSheet";
import {
  SearchHeader,
  SearchUserCard,
} from "@/components/search/SearchScreenParts";
import { searchScreenSearch } from "@/repositories/searchRepository";
import searchStyles from "@/styles/search.styles";
import { getAuthSession } from "@/utils/session";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import {
  startTransition,
  useCallback,
  useDeferredValue,
  useMemo,
  useState,
} from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PAGE_SIZE = 20;
const MESSAGE_SEARCH_HISTORY_KEY_PREFIX = "message_partner_search_history";

async function getMessageSearchHistoryKey() {
  const session = await getAuthSession();

  const userId = String(
    session?.id ||
      session?.user_id ||
      session?.userId ||
      session?.user?.id ||
      "",
  ).trim();

  return `${MESSAGE_SEARCH_HISTORY_KEY_PREFIX}:${userId || "guest"}`;
}

async function getMessageSearchHistory() {
  const key = await getMessageSearchHistoryKey();
  const raw = await AsyncStorage.getItem(key);

  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveMessageSearchHistory(items = []) {
  const key = await getMessageSearchHistoryKey();

  await AsyncStorage.setItem(key, JSON.stringify(items.slice(0, 20)));
}

async function deleteMessageSearchHistoryItem(itemId) {
  const items = await getMessageSearchHistory();
  const nextItems = items.filter((item) => item.id !== itemId);

  await saveMessageSearchHistory(nextItems);

  return nextItems;
}

async function clearMessageSearchHistory() {
  const key = await getMessageSearchHistoryKey();

  await AsyncStorage.removeItem(key);
}

function buildSavedSearchEntry(keyword = "", currentItems = []) {
  const trimmedKeyword = String(keyword || "").trim();

  if (!trimmedKeyword) {
    return currentItems;
  }

  const normalizedKeyword = trimmedKeyword.toLowerCase();

  const existingItem = currentItems.find(
    (item) =>
      String(item.keyword || "").trim().toLowerCase() === normalizedKeyword,
  );

  const nextItem = existingItem
    ? existingItem
    : {
        id: `local_saved_${normalizedKeyword.replace(/[^a-z0-9]+/g, "_") || Date.now()}`,
        keyword: trimmedKeyword,
        createdAt: new Date().toISOString(),
      };

  return [
    nextItem,
    ...currentItems.filter(
      (item) =>
        String(item.keyword || "").trim().toLowerCase() !== normalizedKeyword,
    ),
  ].slice(0, 20);
}

function mergeSavedSearchEntries(preferredItems = [], fallbackItems = []) {
  const seenKeywords = new Set();

  return [...preferredItems, ...fallbackItems]
    .filter((item) => {
      const normalizedKeyword = String(item?.keyword || "")
        .trim()
        .toLowerCase();

      if (!normalizedKeyword || seenKeywords.has(normalizedKeyword)) {
        return false;
      }

      seenKeywords.add(normalizedKeyword);
      return true;
    })
    .slice(0, 20);
}

export default function NewConversationScreen() {
  const [keyword, setKeyword] = useState("");
  const [users, setUsers] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [nextIndex, setNextIndex] = useState(0);
  const [hasMore, setHasMore] = useState(false);
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

  const loadSavedSearches = useCallback(async () => {
    try {
      setLoadingHistory(true);
      setError("");

      const history = await getMessageSearchHistory();

      setSavedSearches((current) => mergeSavedSearchEntries(current, history));
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
        setUsers([]);
        setHasMore(false);
        setNextIndex(0);
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
          setUsers([]);
          setHasMore(false);
          setNextIndex(0);
        }

        const result = await searchScreenSearch(trimmedKeyword, {
          index,
          count: PAGE_SIZE,
          append,
        });

        startTransition(() => {
          setUsers((current) => {
            if (!append) return result.users;

            const map = new Map(current.map((item) => [item.id, item]));
            result.users.forEach((item) => map.set(item.id, item));

            return Array.from(map.values());
          });
        });

        if (!append && index === 0) {
          setSavedSearches((current) => {
            const nextHistory = buildSavedSearchEntry(trimmedKeyword, current);
            saveMessageSearchHistory(nextHistory).catch(() => {});
            return nextHistory;
          });
        }

        setNextIndex(result.nextIndex);
        setHasMore(result.hasMore);
      } catch (searchError) {
        setError(searchError.message || "Không thể tìm kiếm người dùng.");

        if (!append) {
          setUsers([]);
          setHasMore(false);
        }
      } finally {
        setLoadingSearch(false);
        setLoadingMore(false);
      }
    },
    [keyword],
  );

  const handleDeleteSavedSearch = useCallback(async (item) => {
    try {
      const nextHistory = await deleteMessageSearchHistoryItem(item.id);
      setSavedSearches(nextHistory);
    } catch (deleteError) {
      setError(deleteError.message || "Không thể xóa lịch sử tìm kiếm.");
    }
  }, []);

  const handleClearAllSavedSearches = useCallback(async () => {
    try {
      await clearMessageSearchHistory();
      setSavedSearches([]);
    } catch (deleteError) {
      setError(
        deleteError.message || "Không thể xóa toàn bộ lịch sử tìm kiếm.",
      );
    }
  }, []);

  const handleChangeKeyword = useCallback((value) => {
    setKeyword(value);
    setHasSearched(false);
    setUsers([]);
    setHasMore(false);
    setNextIndex(0);
    setError("");
  }, []);

  const handleClearKeyword = useCallback(() => {
    setKeyword("");
    setError("");
    setHasSearched(false);
    setUsers([]);
    setHasMore(false);
    setNextIndex(0);
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

  const handlePressUser = useCallback((user) => {
    const partnerId = String(user?.id || "").trim();

    console.log("PRESS_CONVERSATION_PARTNER", {
      partnerId,
      user,
    });

    if (!partnerId) return;

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
      <SearchUserCard user={item} onPress={() => handlePressUser(item)} />
    ),
    [handlePressUser],
  );

  return (
    <SafeAreaView style={searchStyles.safeArea}>
      <SearchHeader
        keyword={keyword}
        activeTab="people"
        hasSearched={hasSearched}
        error={error}
        loadingSearch={loadingSearch}
        loadingHistory={loadingHistory}
        suggestions={suggestions}
        users={[]}
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
        onChangeTab={() => {}}
        onPressUser={handlePressUser}
        searchTabs={[]}
      />

      {loadingSearch && !users.length ? (
        <View style={searchStyles.loadingScreen}>
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={searchStyles.listContent}
          ListEmptyComponent={
            hasSearched ? (
              <Text style={searchStyles.emptyText}>
                Không tìm thấy người dùng nào
              </Text>
            ) : (
              <Text style={searchStyles.emptyText}>
                Tìm người dùng để bắt đầu cuộc trò chuyện
              </Text>
            )
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={searchStyles.footerLoader}>
                <ActivityIndicator />
              </View>
            ) : null
          }
          removeClippedSubviews
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={7}
          onEndReached={() => {
            if (hasMore && !loadingMore && !loadingSearch) {
              runSearch({ append: true, index: nextIndex });
            }
          }}
          onEndReachedThreshold={0.35}
        />
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
