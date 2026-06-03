import { Text, View } from "react-native";
import { Image } from "expo-image";
import coursesStyles from "@/styles/courses.styles";
import { resolveAvatarUri } from "@/utils/profile";

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

  const initial = (name || "?").charAt(0).toUpperCase();
  return (
    <View style={coursesStyles.avatarPlaceholder}>
      <Text style={coursesStyles.avatarPlaceholderText}>{initial}</Text>
    </View>
  );
}
