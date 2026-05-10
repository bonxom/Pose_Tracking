import Screen from "@/components/common/Screen";
import { getNotifications } from "@/repositories/notificationRepository";
import demoStyles from "@/styles/demo.styles";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function NotificationsScreen() {
  const [items, setItems] = useState([]);
  const unreadCount = useMemo(() => items.filter((item) => item.unread).length, [items]);

  useFocusEffect(
    useCallback(() => {
      const loadNotifications = async () => {
        try {
          setItems(await getNotifications());
        } catch (error) {
          console.warn("Failed to load notifications:", error);
        }
      };
      loadNotifications();
    }, []),
  );

  const openNotification = (item) => {
    setItems((current) =>
      current.map((notification) =>
        notification.id === item.id ? { ...notification, unread: false } : notification,
      ),
    );

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
      <ScrollView contentContainerStyle={demoStyles.scrollContent}>
        <View style={demoStyles.header}>
          <Text style={demoStyles.title}>Thông báo</Text>
          <Text style={demoStyles.subtitle}>{unreadCount} thông báo chưa đọc trong demo</Text>
        </View>

        {items.map((item) => (
          <Pressable key={item.id} onPress={() => openNotification(item)}>
            <View style={demoStyles.card}>
              <View style={demoStyles.rowBetween}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={demoStyles.cardTitle}>{item.title}</Text>
                  <Text style={demoStyles.cardText}>{item.body}</Text>
                  <Text style={demoStyles.statLabel}>
                    {new Date(item.createdAt).toLocaleString("vi-VN")}
                  </Text>
                </View>
                {item.unread ? <View style={demoStyles.unreadDot} /> : null}
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}
