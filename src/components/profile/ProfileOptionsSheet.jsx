import profileStyles from "@/styles/profile.styles";
import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, Text, View } from "react-native";

function OptionRow({ iconName, label, onPress }) {
  return (
    <Pressable style={profileStyles.optionRow} onPress={onPress}>
      <View style={profileStyles.iconCircle}>
        <Ionicons name={iconName} size={22} color="#111827" />
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

        <View style={profileStyles.bottomSheet}>
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
