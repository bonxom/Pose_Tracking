import colors from "@/constants/colors";
import postStyles from "@/styles/post.styles";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";

const DEFAULT_AVATAR_URL =
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS5FBH-i9W2GYVsE4y3QPE9QT1JRImQD9QkPg&s";

export default function PostUploadingCard({ avatarUri = "" }) {
  const resolvedAvatar =
    typeof avatarUri === "string" && avatarUri.trim()
      ? avatarUri.trim()
      : DEFAULT_AVATAR_URL;

  return (
    <View style={[postStyles.card, localStyles.card]}>
      <View style={localStyles.leftSection}>
        <Image source={{ uri: resolvedAvatar }} style={postStyles.avatar} />
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
