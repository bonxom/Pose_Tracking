import demoStyles from "@/styles/demo.styles";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

const INK = "#050505";

const SearchIcon = ({ color = INK, size = 26 }) => (
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

export default function FriendsScreen() {
  return (
    <View style={demoStyles.screen}>
      <ScrollView contentContainerStyle={demoStyles.scrollContent}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchTitle}>Bạn bè</Text>
          <Pressable hitSlop={8} onPress={() => router.push("/search")}>
            <SearchIcon />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    height: 38,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
  },
  searchTitle: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
});
