import ProfileIcon from "@/components/icons/ProfileIcon";
import colors from "@/constants/colors";
import profileStyles from "@/styles/profile.styles";
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
              <ProfileIcon name="person" size={140} color={colors.white} />
            </View>
          )}
        </View>

        <Pressable onPress={onPressCamera} style={profileStyles.cameraButton}>
          <ProfileIcon name="camera" size={22} color={colors.inkStrong} />
        </Pressable>
      </View>

      <Text style={profileStyles.nameText}>{displayName}</Text>
    </View>
  );
}
