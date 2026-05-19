import ProfileIcon from "@/components/icons/ProfileIcon";
import colors from "@/constants/colors";
import profileStyles from "@/styles/profile.styles";
import { Image, Modal, Pressable, View } from "react-native";

export default function ProfileImagePreviewModal({ uri, visible, onClose }) {
  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={profileStyles.imagePreviewRoot}>
        <Pressable style={profileStyles.imagePreviewClose} onPress={onClose}>
          <ProfileIcon name="close" size={24} color={colors.white} />
        </Pressable>
        {uri ? (
          <Image source={{ uri }} style={profileStyles.imagePreview} resizeMode="contain" />
        ) : null}
      </View>
    </Modal>
  );
}