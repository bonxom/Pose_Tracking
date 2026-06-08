import coursesStyles from "@/styles/courses.styles";
import globalStyles from "@/styles/global.styles";
import { Pressable, Text, View } from "react-native";

export default function SectionHeader({ count, rightLabel, onRightPress }) {
  return (
    <View style={globalStyles.headerTopRow}>
      <View style={coursesStyles.sectionLeft}>
        <Text style={coursesStyles.sectionTitle}>Yêu cầu học</Text>
        <Text style={coursesStyles.sectionCount}>{count}</Text>
      </View>
      {rightLabel ? (
        <Pressable onPress={onRightPress} hitSlop={8}>
          <Text style={coursesStyles.sectionLink}>{rightLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
