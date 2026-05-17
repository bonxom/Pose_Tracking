import { Pressable, Text, View } from "react-native";
import coursesStyles from "@/styles/courses.styles";
import Svg, { Path } from "react-native-svg";

const ChevronLeftIcon = ({ color = "#050505", size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 19l-7-7 7-7"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default function SubViewNavBar({ title, onBack }) {
  return (
    <View style={coursesStyles.navBar}>
      <View style={coursesStyles.navLeft}>
        <Pressable style={coursesStyles.backBtn} onPress={onBack} hitSlop={8}>
          <ChevronLeftIcon />
        </Pressable>
        <Text style={coursesStyles.navTitle}>{title}</Text>
      </View>
    </View>
  );
}
