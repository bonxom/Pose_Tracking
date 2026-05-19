import AccountIcon from "@/components/icons/AccountIcon";
import BellIcon from "@/components/icons/BellIcon";
import CoursesIcon from "@/components/icons/CoursesIcon";
import HomeIcon from "@/components/icons/HomeIcon";
import MenuIcon from "@/components/icons/MenuIcon";
import SearchIcon from "@/components/icons/SearchIcon";
import colors from "@/constants/colors";
import {
  getNotificationBadge,
  getNotificationsPage,
  subscribeNotificationBadge,
} from "@/services/notificationStore";
import { getAuthSession } from "@/utils/session";
import { FontAwesome } from "@expo/vector-icons";
import { router, Tabs, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const LayoutBellIcon = ({ focused, badge = 0 }) => (
  <View style={styles.notificationIconWrap}>
    <BellIcon focused={focused} size={24} />
    {badge > 0 ? (
      <View style={styles.notificationBadge}>
        <Text style={styles.notificationBadgeText}>
          {badge > 99 ? "99+" : badge}
        </Text>
      </View>
    ) : null}
  </View>
);

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
        <Pressable style={styles.searchBtn} hitSlop={8}>
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

export default function TabsLayout() {
  const pathname = usePathname();
  const isHome = pathname === "/home" || pathname === "/";

  const [notificationBadge, setTabNotificationBadge] = useState(
    getNotificationBadge(),
  );

  useEffect(() => {
    const unsubscribe = subscribeNotificationBadge(setTabNotificationBadge);

    getNotificationsPage({
      index: 0,
      count: 20,
    }).catch((error) => {
      console.log("LOAD_NOTIFICATION_BADGE_ERROR", error?.message);
    });

    return unsubscribe;
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {isHome && <HomeTopSection />}
      <Tabs
        screenOptions={{
          tabBarPosition: "top",
          tabBarShowLabel: true,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.text,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
            marginTop: 2,
          },
          tabBarIconStyle: {
            marginBottom: 0,
          },
          tabBarStyle: {
            height: 64,
            paddingTop: 6,
            paddingBottom: 6,
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
              <LayoutBellIcon focused={focused} badge={notificationBadge} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            tabBarButton: (props) => <TabButton {...props} />,
            tabBarIcon: ({ focused }) => <AccountIcon focused={focused} />,
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
