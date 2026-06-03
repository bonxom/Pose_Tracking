import NoInternetView from "@/components/common/NoInternetView";
import SearchIcon from "@/components/icons/SearchIcon";
import { useInternetFetch } from "@/hooks/useNetInfo";
import {
  getNotificationCache,
  getNotificationPage,
  isNotificationAuthError,
  markNotificationRead,
  markNotificationReadLocal,
  setNotificationBadge,
} from "@/repositories/notificationRepository";
import styles from "@/styles/notifications.styles";
import { resolveAvatarUri } from "@/utils/profile";
import { clearAuthSession } from "@/utils/session";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";

const PAGE_SIZE = 20;

function isUnread(item) {
  if (item?.unread !== undefined) return Boolean(item.unread);
  if (item?.read !== undefined) return !Boolean(item.read);
  return true;
}

function formatTimeAgo(value) {
  const time = new Date(value).getTime();

  if (!Number.isFinite(time)) {
    return "";
  }

  const diffMs = Date.now() - time;
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) return "Vừa xong";
  if (diffMinutes < 60) return `${diffMinutes} phút`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} ngày`;

  return new Date(value).toLocaleDateString("vi-VN");
}

function getInitial(title = "") {
  const trimmed = String(title).trim();
  return trimmed ? trimmed[0].toUpperCase() : "N";
}

function NotificationTypeBadge({ type = "" }) {
  const normalizedType = String(type).toLowerCase();

  let icon = "notification";

  if (normalizedType.includes("like")) {
    icon = "like";
  } else if (normalizedType.includes("comment")) {
    icon = "comment";
  }

  return (
    <View style={styles.avatarBadge}>
      <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
        {icon === "like" ? (
          <Path
            d="M9.2 20H6.5A2.5 2.5 0 0 1 4 17.5v-5A2.5 2.5 0 0 1 6.5 10h2.1l2.14-5.02A1.7 1.7 0 0 1 12.3 4c1.18 0 2.02 1.16 1.65 2.28L13.4 8h4.1A2.5 2.5 0 0 1 20 10.5c0 .25-.04.5-.11.74l-1.67 5.5A4.5 4.5 0 0 1 13.91 20H9.2Z"
            fill="#FFFFFF"
          />
        ) : icon === "comment" ? (
          <Path
            d="M4 11.5C4 7.91 7.58 5 12 5s8 2.91 8 6.5S16.42 18 12 18c-.76 0-1.49-.09-2.18-.26L6.5 19.5c-.65.34-1.4-.31-1.14-1l1.05-2.82C4.9 14.56 4 13.09 4 11.5Z"
            fill="#FFFFFF"
          />
        ) : (
          <Path
            d="M12 3.5C8.7 3.5 6 6.2 6 9.5v3.15c0 .83-.26 1.64-.75 2.31l-.8 1.1A1.7 1.7 0 0 0 5.82 18.75h12.36a1.7 1.7 0 0 0 1.37-2.69l-.8-1.1A3.95 3.95 0 0 1 18 12.65V9.5c0-3.3-2.7-6-6-6Zm-2.25 16.25a2.25 2.25 0 0 0 4.5 0h-4.5Z"
            fill="#FFFFFF"
          />
        )}
      </Svg>
    </View>
  );
}

function NotificationItem({ item, onPress }) {
  const unread = isUnread(item);
  const avatarUri = resolveAvatarUri(item.avatar || "");

  return (
    <Pressable
      onPress={() => onPress(item)}
      style={({ pressed }) => [
        styles.notificationItem,
        unread && styles.notificationItemUnread,
        pressed && styles.notificationItemPressed,
      ]}
    >
      <View style={styles.avatarWrap}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
        ) : (
          <Text style={styles.avatarFallback}>{getInitial(item.title)}</Text>
        )}

        <NotificationTypeBadge type={item.type} />
      </View>

      <View style={styles.notificationBody}>
        <Text
          numberOfLines={2}
          style={[
            styles.notificationTitle,
            unread && styles.notificationTitleUnread,
          ]}
        >
          {item.title}
        </Text>

        <Text style={styles.notificationTime}>
          {formatTimeAgo(item.created || item.createdAt)}
        </Text>
      </View>

      {unread ? <View style={styles.unreadDot} /> : null}
    </Pressable>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>Chưa có thông báo</Text>
      <Text style={styles.emptyText}>
        Khi có lượt thích, bình luận hoặc cập nhật bài viết mới, chúng sẽ xuất
        hiện ở đây.
      </Text>
    </View>
  );
}

export default function NotificationsScreen() {
  const initialCache = getNotificationCache();

  const [items, setItems] = useState(initialCache.items);
  const [activeFilter, setActiveFilter] = useState("all");
  const [, setBadge] = useState(initialCache.unreadCount);
  const [hasMore, setHasMore] = useState(initialCache.hasMore);
  const [isLoading, setIsLoading] = useState(!initialCache.hasLoaded);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const { isNoInternet, executeWithInternetCheck } = useInternetFetch();
  const [, setLastUpdate] = useState(initialCache.lastUpdate);

  const visibleItems = useMemo(() => {
    if (activeFilter === "unread") {
      return items.filter((item) => isUnread(item));
    }

    return items;
  }, [activeFilter, items]);

  const loadPage = useCallback(async ({ refresh = false } = {}) => {
    try {
      setError("");
      const cache = getNotificationCache();

      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      let page;
      await executeWithInternetCheck(async () => {
        page = await getNotificationPage({
          index: 0,
          count: PAGE_SIZE,
          lastUpdate: refresh ? cache.lastUpdate : "",
        });
      });

      setItems(page.items);
      setBadge(page.unreadCount);
      setNotificationBadge(page.unreadCount);
      setHasMore(page.hasMore);
      setLastUpdate(page.lastUpdate);
    } catch (err) {
      if (await handleNotificationAuthError(err)) {
        setItems([]);
        setBadge(0);
        setHasMore(false);
        return;
      }

      setError(err?.message || "Không tải được thông báo.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [executeWithInternetCheck]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || isLoading || isRefreshing || !hasMore) {
      return;
    }

    try {
      setIsLoadingMore(true);
      let page;
      await executeWithInternetCheck(async () => {
        page = await getNotificationPage({
          index: items.length,
          count: PAGE_SIZE,
        });
      });

      setItems(page.items);
      setBadge(page.unreadCount);
      setNotificationBadge(page.unreadCount);
      setHasMore(page.hasMore);
      setLastUpdate(page.lastUpdate);
    } catch (err) {
      if (await handleNotificationAuthError(err)) {
        setItems([]);
        setBadge(0);
        setHasMore(false);
        return;
      }

      setError(err?.message || "Không tải thêm được thông báo.");
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    executeWithInternetCheck,
    hasMore,
    isLoading,
    isRefreshing,
    isLoadingMore,
    items.length,
  ]);

  useFocusEffect(
    useCallback(() => {
      const cache = getNotificationCache();

      if (cache.hasLoaded) {
        setItems(cache.items);
        setBadge(cache.unreadCount);
        setNotificationBadge(cache.unreadCount);
        setHasMore(cache.hasMore);
        setLastUpdate(cache.lastUpdate);
        setIsLoading(false);
        return;
      }

      loadPage({
        refresh: true,
      });
    }, [loadPage]),
  );

  async function handleNotificationAuthError(error) {
    if (!isNotificationAuthError(error)) {
      return false;
    }

    await clearAuthSession();

    router.replace("/login");

    return true;
  }

  const handlePressNotification = useCallback(
    async (item) => {
      const notificationId = item.notificationId || item.id;
      const unread = isUnread(item);

      if (unread) {
        const cache = markNotificationReadLocal(notificationId);

        setItems(cache.items);
        setBadge(cache.unreadCount);
        setNotificationBadge(cache.unreadCount);

        try {
          await markNotificationRead(notificationId);
        } catch (err) {
          if (await handleNotificationAuthError(err)) {
            return;
          }

          console.warn("Failed to mark notification read:", err);
        }
      }

      const type = String(item.type || item.raw?.type || "").toLowerCase();

      const postId = String(
        item.objectId ||
          item.targetId ||
          item.postId ||
          item.raw?.object_id ||
          item.raw?.post_id ||
          item.raw?.postId ||
          item.raw?.id ||
          "",
      ).trim();

      if (
        !postId ||
        postId === "0" ||
        postId === "undefined" ||
        postId === "null"
      ) {
        console.warn("Notification missing post id", item);
        return;
      }

      if (type.includes("comment")) {
        router.push({
          pathname: "/post/comment/[postId]",
          params: { postId },
        });
        return;
      }

      router.push({
        pathname: "/post/[id]",
        params: { id: postId },
      });
    },
    [],
  );

  if (isLoading && items.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.title}>Thông báo</Text>
          <Pressable
            onPress={() => router.push("/search")}
            hitSlop={8}
            style={styles.searchButton}
          >
            <SearchIcon size={24} />
          </Pressable>
        </View>

        <View style={styles.filterRow}>
          <Pressable
            onPress={() => setActiveFilter("all")}
            style={[
              styles.filterChip,
              activeFilter === "all" && styles.filterChipActive,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === "all" && styles.filterTextActive,
              ]}
            >
              Tất cả
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveFilter("unread")}
            style={[
              styles.filterChip,
              activeFilter === "unread" && styles.filterChipActive,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === "unread" && styles.filterTextActive,
              ]}
            >
              Chưa đọc
            </Text>
          </Pressable>
        </View>
      </View>

      {isNoInternet ? (
        <NoInternetView
          onRefresh={() => loadPage({ refresh: true })}
          refreshing={isRefreshing}
          style={{ minHeight: 300, flex: 1 }}
        />
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={() => loadPage()}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={visibleItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationItem item={item} onPress={handlePressNotification} />
          )}
          contentContainerStyle={[
            styles.listContent,
            visibleItems.length === 0 && { flexGrow: 1 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadPage({ refresh: true })}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.35}
          ListEmptyComponent={<EmptyState />}
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator />
                <Text style={styles.footerLoaderText}>Đang tải thêm...</Text>
              </View>
            ) : !hasMore && items.length > 0 ? (
              <Text style={styles.endText}>Không còn thông báo cũ hơn</Text>
            ) : null
          }
        />
      )}
    </View>
  );
}
