import profileStyles from "@/styles/profile.styles";
import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, Text, View } from "react-native";

export default function ProfileHeader({
  avatarUri,
  displayName,
  onPressCamera,
}) {
  return (
    <View style={profileStyles.topSection}>
      <View style={profileStyles.coverBlock} />

      <View style={profileStyles.avatarBox}>
        <View style={profileStyles.avatarWrap}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={profileStyles.avatarImage} />
          ) : (
            <View style={profileStyles.avatarPlaceholder}>
              <Ionicons name="person" size={140} color="#FFFFFF" />
            </View>
          )}
        </View>

        <Pressable onPress={onPressCamera} style={profileStyles.cameraButton}>
          <Ionicons name="camera" size={22} color="#111827" />
        </Pressable>
      </View>

      <Text style={profileStyles.nameText}>{displayName}</Text>
    </View>
  );
}
