import BellIcon from "@/components/icons/BellIcon";
import CoursesIcon from "@/components/icons/CoursesIcon";
import HomeIcon from "@/components/icons/HomeIcon";
import MenuIcon from "@/components/icons/MenuIcon";
import SearchIcon from "@/components/icons/SearchIcon";
import colors from "@/constants/colors";
import {
  formatNotificationBadge,
  getNotificationBadge,
  subscribeNotificationBadge,
} from "@/repositories/notificationRepository";

import { getInitials } from "@/utils/formatters";
import { getAuthSession } from "@/utils/session";
import { FontAwesome } from "@expo/vector-icons";
import { router, Tabs, usePathname } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function HomeTopSection() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    getAuthSession().then(setSession).catch(console.warn);
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

function ProfileTabAvatar({ focused, avatar, name }) {
  const initials = getInitials(name || "Người dùng");

  return (
    <View
      style={[
        styles.profileAvatarWrap,
        focused && styles.profileAvatarWrapActive,
      ]}
    >
      {avatar ? (
        <Image source={{ uri: avatar }} style={styles.profileAvatarImage} />
      ) : (
        <View style={styles.profileAvatarFallback}>
          <Text style={styles.profileAvatarFallbackText}>{initials}</Text>
        </View>
      )}
    </View>
  );
}

export default function TabsLayout() {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);
  const isHome = pathname === "/home" || pathname === "/";
  const [session, setSession] = useState(null);
  const [notificationBadge, setTabNotificationBadge] = useState(
    getNotificationBadge(),
  );

  useEffect(() => {
    const unsubscribeBadge = subscribeNotificationBadge(setTabNotificationBadge);

    return () => {
      unsubscribeBadge?.();
    };
  }, []);

  useEffect(() => {
    getAuthSession().then(setSession).catch(console.warn);
  }, []);

  const displayName = session?.displayName || session?.username || "Người dùng";
  const avatar = session?.avatar || session?.user?.avatar || "";

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
            backgroundColor: "#FFFFFF",
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
              <HomeIcon focused={focused} size={24} />
            ),
          }}
        />
        <Tabs.Screen
          name="courses"
          options={{
            tabBarButton: (props) => <TabButton {...props} />,
            tabBarIcon: ({ focused }) => <CoursesIcon focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            tabBarButton: (props) => <TabButton {...props} />,
            tabBarIcon: ({ focused }) => (
              <View style={styles.notificationTabIcon}>
                <BellIcon focused={focused} />

                {notificationBadge > 0 ? (
                  <View style={styles.notificationTabBadge}>
                    <Text style={styles.notificationTabBadgeText}>
                      {formatNotificationBadge(notificationBadge)}
                    </Text>
                  </View>
                ) : null}
              </View>
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
                name={displayName}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="menu"
          options={{
            tabBarButton: (props) => <TabButton {...props} />,
            tabBarIcon: ({ focused }) => <MenuIcon focused={focused} />,
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
    backgroundColor: "#fff",
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
    backgroundColor: "#fff",
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
    backgroundColor: "#fff",
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
  notificationTabBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    backgroundColor: "#E41E3F",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  notificationTabBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "800",
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
  notificationIconWrap: {
    width: 36,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
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
  profileAvatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12.5,
  },
  profileAvatarFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8EEF9",
  },
  profileAvatarFallbackText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "900",
  },
  notificationBadge: {
    position: "absolute",
    top: -4,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    backgroundColor: "#E41E3F",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  notificationBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "800",
  },
});
