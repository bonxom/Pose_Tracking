import colors from "@/constants/colors";
import postStyles from "@/styles/post.styles";
import { resolveAvatarUri } from "@/utils/profile";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";

export default function PostUploadingCard({ avatarUri = "" }) {
  const resolvedAvatar = resolveAvatarUri(avatarUri);

  return (
    <View style={[postStyles.card, localStyles.card]}>
      <View style={localStyles.leftSection}>
        <Image
          source={{ uri: resolvedAvatar }}
          style={postStyles.avatar}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={150}
        />
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
