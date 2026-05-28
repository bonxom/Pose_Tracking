import ProfileIcon from "@/components/icons/ProfileIcon";
import colors from "@/constants/colors";
import profileStyles from "@/styles/profile.styles";
import { Modal, Pressable, Text, View } from "react-native";

export default function ProfileActionSheet({ visible, onClose, rows = [] }) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={profileStyles.modalRoot}>
        <Pressable style={profileStyles.backdrop} onPress={onClose} />
        <View style={profileStyles.menuSheet}>
          <View style={profileStyles.sheetHandle} />
          {rows.map((row) => (
            <Pressable
              key={row.label}
              style={profileStyles.menuRow}
              onPress={() => {
                onClose();
                row.onPress?.();
              }}
            >
              <View style={profileStyles.menuIcon}>
                <ProfileIcon name={row.icon} size={21} color={colors.ink} />
              </View>
              <Text style={profileStyles.menuText}>{row.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}