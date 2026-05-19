import { Image, Text, View } from "react-native";
import coursesStyles from "@/styles/courses.styles";

export default function UserAvatar({ uri, name }) {
  if (uri) {
    return <Image source={{ uri }} style={coursesStyles.avatar} />;
  }

  const initial = (name || "?").charAt(0).toUpperCase();
  return (
    <View style={coursesStyles.avatarPlaceholder}>
      <Text style={coursesStyles.avatarPlaceholderText}>{initial}</Text>
    </View>
  );
}
