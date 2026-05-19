import ProfileIcon from "@/components/icons/ProfileIcon";
import colors from "@/constants/colors";
import profileStyles from "@/styles/profile.styles";
import { Modal, Pressable, Text, View } from "react-native";

function OptionRow({ iconName, label, onPress }) {
  return (
    <Pressable style={profileStyles.optionRow} onPress={onPress}>
      <View style={profileStyles.iconCircle}>
        <ProfileIcon name={iconName} size={22} color={colors.inkStrong} />
      </View>
      <Text style={profileStyles.optionText}>{label}</Text>
    </Pressable>
  );
}

export default function ProfileOptionsSheet({
  visible,
  onClose,
  onPressPickImage,
}) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={profileStyles.modalRoot}>
        <Pressable style={profileStyles.backdrop} onPress={onClose} />

        <View style={profileStyles.bottomMenu}>
          <View style={profileStyles.sheetHandle} />

          <OptionRow
            iconName="images"
            label="Chọn ảnh đại diện"
            onPress={onPressPickImage}
          />
        </View>
      </View>
    </Modal>
  );
}
