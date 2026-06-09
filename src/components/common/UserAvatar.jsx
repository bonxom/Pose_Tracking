import colors from "@/constants/colors";
import postStyles from "@/styles/post.styles";
import { resolveAvatarUri } from "@/utils/profile";
import { Image } from "expo-image";
import { View } from "react-native";

export default function UserAvatar({
  uri,
  size = 44,
  bordered = false,
  borderColor = colors.background,
}) {
  const avatarUri = resolveAvatarUri(uri || "");

  const dynamicStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  const ring = bordered ? 4 : 0;
  const shellSize = size + ring * 2;
  const shellStyle = bordered
    ? {
        width: shellSize,
        height: shellSize,
        borderRadius: shellSize / 2,
        padding: ring,
        backgroundColor: borderColor,
        overflow: "hidden",
      }
    : "";

  if (avatarUri) {
    return (
      <View style={shellStyle}>
        <Image
          source={{ uri: avatarUri }}
          style={[postStyles.avatar, dynamicStyle]}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={150}
        />
      </View>
    );
  }

  return (
    <View style={shellStyle}>
      <Image
        source={require("@/assets/images/defaultAvatar.png")}
        style={[postStyles.avatar, dynamicStyle]}
        contentFit="cover"
      />
    </View>
  );
}
