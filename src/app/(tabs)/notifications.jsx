import Screen from "@/components/common/Screen";
import { getNotificationPage, markNotificationRead } from "@/repositories/notificationRepository";
import demoStyles from "@/styles/demo.styles";
import { redirectIfSessionExpired } from "@/utils/screenErrors";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";

export default function NotificationsScreen() {
  const [items, setItems] = useState([]);
  const [lastUpdate, setLastUpdate] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusText, setStatusText] = useState("");
  const unreadCount = useMemo(() => items.filter((item) => item.unread).length, [items]);

  const loadNotifications = useCallback(async ({ refresh = false, append = false, index = 0 } = {}) => {
    try {
      setIsRefreshing(refresh);
      const page = await getNotificationPage({
        index: append ? index : 0,
        count: 20,
        lastUpdate: refresh ? "" : lastUpdate,
      });
      setItems((current) => append ? [...current, ...page.items] : page.items);
      setLastUpdate(page.lastUpdate || lastUpdate);
      setHasMore(Boolean(page.hasMore));
    } catch (error) {
      if (await redirectIfSessionExpired(error, router)) return;
      setStatusText(error.message || "Không thể tải thông báo.");
    } finally {
      setIsRefreshing(false);
    }
  }, [lastUpdate]);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications]),
  );

  const openNotification = async (item) => {
    setItems((current) =>
      current.map((notification) =>
        notification.id === item.id ? { ...notification, unread: false } : notification,
      ),
    );

    try {
      await markNotificationRead(item.notificationId || item.id);
    } catch (error) {
      if (await redirectIfSessionExpired(error, router)) return;
      console.warn("Failed to mark notification as read:", error);
    }

    if (item.targetType === "post") {
      router.push(`/post/${item.targetId}`);
      return;
    }

    if (item.targetType === "course") {
      router.push("/(tabs)/courses");
    }
  };

  return (
    <Screen style={demoStyles.screen}>
      <ScrollView
        contentContainerStyle={demoStyles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => loadNotifications({ refresh: true })} />
        }
      >
        <View style={demoStyles.header}>
          <Text style={demoStyles.title}>Thông báo</Text>
          <Text style={demoStyles.subtitle}>{unreadCount} thông báo chưa đọc · last_update: {lastUpdate || "none"}</Text>
          {statusText ? <Text style={demoStyles.cardText}>{statusText}</Text> : null}
        </View>

        {items.map((item) => (
          <Pressable key={item.id} onPress={() => openNotification(item)}>
            <View style={demoStyles.card}>
              <View style={demoStyles.rowBetween}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={demoStyles.cardTitle}>{item.title}</Text>
                  <Text style={demoStyles.cardText}>{item.body}</Text>
                  <Text style={demoStyles.statLabel}>
                    {item.type} · object_id: {item.objectId || item.targetId || "none"} · badge: {item.badge}
                  </Text>
                  <Text style={demoStyles.statLabel}>
                    {new Date(item.createdAt).toLocaleString("vi-VN")}
                  </Text>
                </View>
                {item.unread ? <View style={demoStyles.unreadDot} /> : null}
              </View>
            </View>
          </Pressable>
        ))}
        {hasMore ? (
          <Pressable style={demoStyles.card} onPress={() => loadNotifications({ append: true, index: items.length })}>
            <Text style={demoStyles.cardTitle}>Tải thêm thông báo</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
