import { Tabs, usePathname } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";

const FB_BLUE = "#0866ff";
const INK = "#050505";

const HomeIcon = ({ focused }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d={
        focused
          ? "M9.464 1.286C10.294.803 11.092.5 12 .5c.908 0 1.707.303 2.537.786.795.462 1.7 1.142 2.815 1.977l2.232 1.675c1.391 1.042 2.359 1.766 2.888 2.826.53 1.059.53 2.268.528 4.006v4.3c0 1.355 0 2.471-.119 3.355-.124.928-.396 1.747-1.052 2.403-.657.657-1.476.928-2.404 1.053-.884.119-2 .119-3.354.119H7.93c-1.354 0-2.471 0-3.355-.119-.928-.125-1.747-.396-2.403-1.053-.656-.656-.928-1.475-1.053-2.403C1 18.541 1 17.425 1 16.07v-4.3c0-1.738-.002-2.947.528-4.006.53-1.06 1.497-1.784 2.888-2.826L6.65 3.263c1.114-.835 2.02-1.515 2.815-1.977zM10.5 13A1.5 1.5 0 0 0 9 14.5V21h6v-6.5a1.5 1.5 0 0 0-1.5-1.5h-3z"
          : "M8.99 23H7.93c-1.354 0-2.471 0-3.355-.119-.928-.125-1.747-.396-2.403-1.053-.656-.656-.928-1.475-1.053-2.403C1 18.541 1 17.425 1 16.07v-4.3c0-1.738-.002-2.947.528-4.006.53-1.06 1.497-1.784 2.888-2.826L6.65 3.263c1.114-.835 2.02-1.515 2.815-1.977C10.294.803 11.092.5 12 .5c.908 0 1.707.303 2.537.786.795.462 1.7 1.142 2.815 1.977l2.232 1.675c1.391 1.042 2.359 1.766 2.888 2.826.53 1.059.53 2.268.528 4.006v4.3c0 1.355 0 2.471-.119 3.355-.124.928-.396 1.747-1.052 2.403-.657.657-1.476.928-2.404 1.053-.884.119-2 .119-3.354.119H8.99zM7.8 4.9l-2 1.5C4.15 7.638 3.61 8.074 3.317 8.658 3.025 9.242 3 9.937 3 12v4c0 1.442.002 2.424.101 3.159.095.706.262 1.033.485 1.255.223.223.55.39 1.256.485.734.099 1.716.1 3.158.1V14.5a2.5 2.5 0 0 1 2.5-2.5h3a2.5 2.5 0 0 1 2.5 2.5V21c1.443 0 2.424-.002 3.159-.101.706-.095 1.033-.262 1.255-.485.223-.222.39-.55.485-1.256.099-.734.101-1.716.101-3.158v-4c0-2.063-.025-2.758-.317-3.342-.291-.584-.832-1.02-2.483-2.258l-2-1.5c-1.174-.881-1.987-1.489-2.67-1.886C12.87 2.63 12.425 2.5 12 2.5c-.425 0-.87.13-1.53.514-.682.397-1.495 1.005-2.67 1.886zM14 21v-6.5a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5V21h4z"
      }
      fill={focused ? FB_BLUE : INK}
    />
  </Svg>
);

const FriendsIcon = ({ focused }) => (
  <Svg width={24} height={24} viewBox="0 0 20 20" fill="none">
    <Path
      d="M13.762 1a3.25 3.25 0 1 0 0 6.5 3.25 3.25 0 0 0 0-6.5zM6.25 5a3.25 3.25 0 1 0 0 6.5 3.25 3.25 0 0 0 0-6.5zm-1.667 7.5A4.083 4.083 0 0 0 .5 16.583 2.417 2.417 0 0 0 2.917 19h6.666A2.417 2.417 0 0 0 12 16.583 4.083 4.083 0 0 0 7.917 12.5H4.583zm7.512-4-.098.001c-.625.015-1.03.487-1.148.943a4.712 4.712 0 0 1-.299.827 1.326 1.326 0 0 0 .46 1.664 5.61 5.61 0 0 1 1.982 2.316c.198.431.634.749 1.154.749h2.949a2.417 2.417 0 0 0 2.417-2.417A4.083 4.083 0 0 0 15.428 8.5h-3.333z"
      fill={focused ? FB_BLUE : INK}
    />
  </Svg>
);

const BellIcon = ({ focused }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 9.5a9 9 0 1 1 18 0v2.927c0 1.69.475 3.345 1.37 4.778a1.5 1.5 0 0 1-1.272 2.295h-4.625a4.5 4.5 0 0 1-8.946 0H2.902a1.5 1.5 0 0 1-1.272-2.295A9.01 9.01 0 0 0 3 12.43V9.5zm6.55 10a2.5 2.5 0 0 0 4.9 0h-4.9z"
      fill={focused ? FB_BLUE : INK}
    />
  </Svg>
);

const AccountIcon = ({ focused }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={8} r={4} fill={focused ? FB_BLUE : INK} />
    <Path
      d="M4 20a8 8 0 0 1 16 0v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-1Z"
      fill={focused ? FB_BLUE : INK}
    />
  </Svg>
);

const SearchIcon = ({ color = INK, size = 28 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={11} cy={11} r={7} stroke={color} strokeWidth={2} />
    <Path
      d="M20 20L16.65 16.65"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

function HomeTopSection() {
  return (
    <View style={styles.homeHeader}>
      <Text style={styles.homeTitle}>Pose Tracking</Text>
      <Pressable style={styles.searchBtn} hitSlop={8}>
        <SearchIcon />
      </Pressable>
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

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {isHome && <HomeTopSection />}
      <Tabs
        screenOptions={{
          tabBarPosition: "top",
          tabBarShowLabel: false,
          tabBarStyle: styles.tabBar,
          tabBarItemStyle: styles.tabItem,
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            tabBarButton: (props) => <TabButton {...props} />,
            tabBarIcon: ({ focused }) => <HomeIcon focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="friends"
          options={{
            tabBarButton: (props) => <TabButton {...props} />,
            tabBarIcon: ({ focused }) => <FriendsIcon focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            tabBarButton: (props) => <TabButton {...props} />,
            tabBarIcon: ({ focused }) => <BellIcon focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            tabBarButton: (props) => <TabButton {...props} />,
            tabBarIcon: ({ focused }) => <AccountIcon focused={focused} />,
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
    color: FB_BLUE,
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.4,
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
  indicator: {
    position: "absolute",
    bottom: 0,
    width: 36,
    height: 3,
    borderRadius: 2,
    backgroundColor: "transparent",
  },
  indicatorActive: { backgroundColor: FB_BLUE },
});
