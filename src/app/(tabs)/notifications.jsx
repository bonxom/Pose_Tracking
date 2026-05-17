import {
  getNotificationCache,
  getNotificationsPage,
  markNotificationRead,
  markNotificationReadLocal,
  setNotificationBadge,
} from "@/services/notificationStore";
import styles from "@/styles/notifications.styles";
import { redirectIfSessionExpired } from "@/utils/screenErrors";
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

const FILTERS = [
  { key: "all", label: "Tất cả" },
  { key: "unread", label: "Chưa đọc" },
];

function getInitial(title = "") {
  const trimmed = title.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "N";
}

function formatTime(value) {
  if (!value) return "Vừa xong";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) return "Vừa xong";
  if (diffMinutes < 60) return `${diffMinutes} phút`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} ngày`;

  return date.toLocaleDateString("vi-VN");
}

function navigateFromNotification(item) {
  const type = String(item.type || "").toLowerCase();
  const group = String(item.group ?? "0");
  const objectId = item.objectId;

  if (group !== "1") {
    return;
  }

  if (!objectId || objectId === "0") {
    return;
  }

  if (type.includes("comment")) {
    router.push(`/comment/${objectId}`);
    return;
  }

  if (type.includes("like") || type.includes("post")) {
    router.push(`/post/${objectId}`);
    return;
  }

  // type lỗi/default theo yêu cầu thầy: về trang chủ
  router.replace("/(tabs)/home");
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
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
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
  return (
    <Pressable
      onPress={() => onPress(item)}
      style={({ pressed }) => [
        styles.card,
        !item.read && styles.cardUnread,
        pressed && { opacity: 0.82 },
      ]}
    >
      <View style={styles.avatarWrap}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        ) : (
          <Text style={styles.avatarFallback}>{getInitial(item.title)}</Text>
        )}

        <NotificationTypeBadge type={item.type} />
      </View>

      <View style={styles.body}>
        <Text
          style={[styles.message, !item.read && styles.messageUnread]}
          numberOfLines={3}
        >
          {item.title}
        </Text>

        <View style={styles.metaRow}>
          <Text style={[styles.meta, item.read && styles.metaRead]}>
            {formatTime(item.created)}
          </Text>
        </View>
      </View>

      {!item.read ? <View style={styles.unreadDot} /> : null}
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const initialCache = getNotificationCache();

  const [items, setItems] = useState(initialCache.items);
  const [badge, setBadge] = useState(initialCache.badge);
  const [hasMore, setHasMore] = useState(initialCache.hasMore);
  const [isLoading, setIsLoading] = useState(!initialCache.hasLoaded);
  const [activeFilter, setActiveFilter] = useState("all");

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [error, setError] = useState("");

  const visibleItems = useMemo(() => {
    if (activeFilter === "unread") {
      return items.filter((item) => !item.read);
    }

    return items;
  }, [activeFilter, items]);

  const loadPage = useCallback(
    async ({ refresh = false, silent = false } = {}) => {
      try {
        setError("");

        if (!silent && refresh) {
          setIsRefreshing(true);
        }

        if (!silent && !refresh) {
          setIsLoading(true);
        }

        const result = await getNotificationsPage({
          index: 0,
          count: PAGE_SIZE,
        });

        setItems(result.items);
        setBadge(result.badge);
        setNotificationBadge(result.badge);
        setHasMore(result.hasMore);
      } catch (err) {
        if (await redirectIfSessionExpired(err, router)) return;
        setError(err?.message || "Không tải được thông báo.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [],
  );

  const loadMore = useCallback(async () => {
    if (isLoadingMore || isLoading || isRefreshing || !hasMore) {
      return;
    }

    try {
      setIsLoadingMore(true);

      const result = await getNotificationsPage({
        index: items.length,
        count: PAGE_SIZE,
      });

      setItems((prev) => {
        const existingIds = new Set(prev.map((item) => item.id));

        const nextItems = result.items.filter((item) => {
          if (!item.id) return false;
          if (existingIds.has(item.id)) return false;
          existingIds.add(item.id);
          return true;
        });

        return [...prev, ...nextItems];
      });

      setBadge(result.badge);
      setNotificationBadge(result.badge);
      setHasMore(result.hasMore);
    } catch (err) {
      if (await redirectIfSessionExpired(err, router)) return;
      setError(err?.message || "Không tải thêm được thông báo.");
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoading, isRefreshing, isLoadingMore, items.length]);

  useFocusEffect(
    useCallback(() => {
      const cache = getNotificationCache();

      if (cache.hasLoaded) {
        setItems(cache.items);
        setBadge(cache.badge);
        setNotificationBadge(cache.badge);
        setHasMore(cache.hasMore);
        setIsLoading(false);
        return;
      }

      loadPage({ silent: false });
    }, [loadPage]),
  );

  const handlePressNotification = useCallback(
    async (item) => {
      if (!item.read) {
        const cache = markNotificationReadLocal(item.notificationId);

        setItems(cache.items);
        setBadge(cache.badge);
        setNotificationBadge(cache.badge);

        try {
          const result = await markNotificationRead(item.notificationId);

          if (Number.isFinite(Number(result.badge))) {
            const serverBadge = Number(result.badge);
            setBadge(serverBadge);
            setNotificationBadge(serverBadge);
          }
        } catch (err) {
          console.warn("Failed to mark notification read:", err);

          if (await redirectIfSessionExpired(err, router)) {
            return;
          }

          // Theo yêu cầu thầy: server lỗi cũng không rollback trạng thái đã đọc.
        }
      }

      navigateFromNotification(item);
    },
    [],
  );

  if (isLoading && items.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      </View>
    );
  }

  if (error && items.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>

          <Pressable
            style={styles.retryButton}
            onPress={() => loadPage({ refresh: true })}
          >
            <Text style={styles.retryText}>Thử lại</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Thông báo</Text>
        </View>

        <View style={styles.filterRow}>
          {FILTERS.map((filter) => {
            const active = activeFilter === filter.key;

            return (
              <Pressable
                key={filter.key}
                onPress={() => setActiveFilter(filter.key)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text
                  style={[styles.filterText, active && styles.filterTextActive]}
                >
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <FlatList
        data={visibleItems}
        keyExtractor={(item, index) => item.id || `notification-${index}`}
        renderItem={({ item }) => (
          <NotificationItem item={item} onPress={handlePressNotification} />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadPage({ refresh: true })}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.35}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Chưa có thông báo</Text>
            <Text style={styles.emptyText}>
              Khi có lượt thích, bình luận hoặc cập nhật bài viết mới, chúng sẽ
              xuất hiện ở đây.
            </Text>
          </View>
        }
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.footerLoading}>
              <ActivityIndicator />
            </View>
          ) : null
        }
      />
    </View>
  );
}
