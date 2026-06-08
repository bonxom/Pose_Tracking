import postStyles from "@/styles/post.styles";
import { resolveAvatarUri } from "@/utils/profile";
import { Image } from "expo-image";

export default function UserAvatar({ uri, size = 44 }) {
  const avatarUri = resolveAvatarUri(uri || "");

  const dynamicStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  if (avatarUri) {
    return (
      <Image
        source={{ uri: avatarUri }}
        style={[postStyles.avatar, dynamicStyle]}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={150}
      />
    );
  }

  return (
    <Image
      source={require("@/assets/images/defaultAvatar.png")}
      style={[postStyles.avatar, dynamicStyle]}
      contentFit="cover"
    />
  );
}
