import coursesStyles from "@/styles/courses.styles";
import { resolveAvatarUri } from "@/utils/profile";
import { Image } from "react-native";

export default function UserAvatar({ uri, name }) {
  const avatarUri = resolveAvatarUri(uri || "");
  return (
    <Image
      source={{ uri: avatarUri }}
      style={coursesStyles.avatar}
      contentFit="cover"
      cachePolicy="memory-disk"
      transition={150}
    />
  );
}
