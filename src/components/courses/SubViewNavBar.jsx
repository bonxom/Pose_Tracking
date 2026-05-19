import BackIcon from "@/components/icons/BackIcon";
import coursesStyles from "@/styles/courses.styles";
import { Pressable, Text, View } from "react-native";

export default function SubViewNavBar({ title, onBack }) {
  return (
    <View style={coursesStyles.navBar}>
      <View style={coursesStyles.navLeft}>
        <Pressable style={coursesStyles.backBtn} onPress={onBack} hitSlop={8}>
          <BackIcon />
        </Pressable>
        <Text style={coursesStyles.navTitle}>{title}</Text>
      </View>
    </View>
  );
}
