import colors from "@/constants/colors";
import postStyles from "@/styles/post.styles";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import UserAvatar from "../common/UserAvatar";

export default function PostUploadingCard({ avatarUri = "" }) {
  return (
    <View style={[postStyles.card, localStyles.card]}>
      <View style={localStyles.leftSection}>
        <UserAvatar uri={avatarUri} size={44} />
        <Text style={localStyles.text}>Đang đăng</Text>
      </View>

      <ActivityIndicator size="small" color={colors.primary} />
    </View>
  );
}

const localStyles = StyleSheet.create({
  card: {
    borderRadius: 0,
    borderWidth: 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  text: {
    fontSize: 16,
    color: colors.text,
    fontWeight: "600",
  },
});
