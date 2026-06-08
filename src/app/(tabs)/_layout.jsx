import IconWithBadge from "@/components/common/IconWithBadge";
import BellIcon from "@/components/icons/BellIcon";
import ChatTwoBubbleIcon from "@/components/icons/ChatTwoBubbleIcon";
import CoursesIcon from "@/components/icons/CoursesIcon";
import HomeIcon from "@/components/icons/HomeIcon";
import MenuIcon from "@/components/icons/MenuIcon";
import SearchIcon from "@/components/icons/SearchIcon";
import colors from "@/constants/colors";
import {
  getConversationList,
  subscribeConversations,
} from "@/repositories/conversationRepository";
import {
  getNotificationBadge,
  getNotificationPage,
  subscribeNotificationBadge,
} from "@/repositories/notificationRepository";
import { resolveAvatarUri } from "@/utils/profile";
import { getAuthSession, subscribeAuthSession } from "@/utils/session";
import { FontAwesome } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, Tabs, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function HomeTopSection() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    getAuthSession().then(setSession).catch(console.warn);

    const unsubscribe = subscribeAuthSession(setSession);
    return unsubscribe;
  }, []);

  const role = String(session?.role || session?.user?.role || "").toUpperCase();
  const canCreatePost = role === "GV";

  return (
    <View style={styles.homeHeader}>
      <Text style={styles.homeTitle}>Pose Tracking</Text>
      <View style={styles.headerActions}>
        {canCreatePost ? (
          <Pressable
            style={styles.actionBtn}
            hitSlop={8}
            onPress={() => router.push("/post/create")}
          >
            <FontAwesome name="plus-square-o" size={24} color={colors.text} />
          </Pressable>
        ) : null}
        <Pressable
          style={styles.searchBtn}
          hitSlop={8}
          onPress={() => router.push("/search")}
        >
          <SearchIcon size={28} />
        </Pressable>
      </View>
    </View>
  );
}

function TabButton({ onPress, accessibilityState, children }) {
  const focused = accessibilityState?.selected;
  return (
    <Pressable onPress={onPress} style={styles.tabButton}>
      {children}
      <View style={[styles.indicator, focused && styles.indicatorActive]} />
    </Pressable>
  );
}

function ProfileTabAvatar({ focused, avatar, userId }) {
  return (
    <View
      style={[
        styles.profileAvatarWrap,
        focused && styles.profileAvatarWrapActive,
      ]}
    >
      <Image
        key={userId || "guest"}
        source={{ uri: avatar }}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={150}
        style={styles.profileAvatarImage}
      />
    </View>
  );
}

export default function TabsLayout() {
  const pathname = usePathname();
  const isHome = pathname === "/home" || pathname === "/";
  const [session, setSession] = useState(null);

  const [notificationBadge, setTabNotificationBadge] = useState(
    getNotificationBadge(),
  );
  const [conversationBadge, setConversationBadge] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeNotificationBadge(setTabNotificationBadge);

    getNotificationPage({
      index: 0,
      count: 20,
    }).catch((error) => {
      console.log("LOAD_NOTIFICATION_BADGE_ERROR", error?.message);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeConversations((cache) => {
      setConversationBadge(cache.numNewMessage);
    });

    getConversationList().catch((error) => {
      console.log("LOAD_CONVERSATION_BADGE_ERROR", error?.message);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    getAuthSession().then(setSession).catch(console.warn);

    const unsubscribe = subscribeAuthSession(setSession);
    return unsubscribe;
  }, []);
  const avatar = resolveAvatarUri(
    session?.avatar || session?.user?.avatar || "",
    session?.avatarVersion ||
      session?.profileSyncRequestedAt ||
      session?.loggedInAt ||
      "",
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {isHome && <HomeTopSection />}

      <Tabs
        screenOptions={{
          tabBarPosition: "top",
          tabBarShowLabel: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.text,
          tabBarIconStyle: {
            marginBottom: 0,
          },
          tabBarStyle: {
            height: 56,
            paddingTop: 4,
            paddingBottom: 4,
            backgroundColor: colors.background,
            borderTopWidth: 0,
            borderBottomWidth: 1,
            borderBottomColor: "#E4E6EB",
          },
          tabBarItemStyle: styles.tabItem,
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            tabBarButton: (props) => <TabButton {...props} />,
            tabBarIcon: ({ focused }) => (
              <HomeIcon focused={focused} size={28} />
            ),
          }}
        />
        <Tabs.Screen
          name="courses"
          options={{
            tabBarButton: (props) => <TabButton {...props} />,
            tabBarIcon: ({ focused }) => (
              <CoursesIcon focused={focused} size={28} />
            ),
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            tabBarButton: (props) => <TabButton {...props} />,
            tabBarIcon: ({ focused }) => (
              <IconWithBadge
                icon={<BellIcon focused={focused} size={28} />}
                badge={notificationBadge}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="conversation"
          options={{
            tabBarButton: (props) => <TabButton {...props} />,
            tabBarIcon: ({ focused }) => (
              <IconWithBadge
                icon={<ChatTwoBubbleIcon focused={focused} />}
                badge={conversationBadge}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            tabBarButton: (props) => <TabButton {...props} />,
            tabBarIcon: ({ focused }) => (
              <ProfileTabAvatar
                focused={focused}
                avatar={avatar}
                userId={session?.id}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="menu"
          options={{
            tabBarButton: (props) => <TabButton {...props} />,
            tabBarIcon: ({ focused }) => (
              <MenuIcon focused={focused} size={28} />
            ),
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  homeHeader: {
    height: 52,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  homeTitle: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  tabBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#CED0D4",
    elevation: 0,
    shadowOpacity: 0,
    height: 52,
    paddingTop: 0,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  notificationTabIcon: {
    width: 36,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  indicator: {
    position: "absolute",
    bottom: 0,
    width: 36,
    height: 3,
    borderRadius: 2,
    backgroundColor: "transparent",
  },
  indicatorActive: { backgroundColor: colors.primary },
  profileAvatarWrap: {
    width: 29,
    height: 29,
    borderRadius: 14.5,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#D8DADF",
    position: "relative",
  },
  profileAvatarWrapActive: {
    borderColor: colors.primary,
  },
  profileAvatarFallbackShell: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 14.5,
    padding: 1,
    backgroundColor: "#DCE8FF",
  },
  profileAvatarImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    borderRadius: 12.5,
  },
  profileAvatarFallback: {
    width: "100%",
    height: "100%",
    borderRadius: 13.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8EEF9",
  },
  profileAvatarFallbackText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "900",
  },
});
