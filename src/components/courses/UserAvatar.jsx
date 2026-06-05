import coursesStyles from "@/styles/courses.styles";
import { resolveAvatarUri } from "@/utils/profile";
import { Image } from "react-native";

export default function UserAvatar({ uri, name }) {
  const avatarUri = resolveAvatarUri(uri || "");

  if (avatarUri) {
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

  return <Image source={require("@/assets/images/defaultAvatar.png")} style={coursesStyles.avatar} />;
}
