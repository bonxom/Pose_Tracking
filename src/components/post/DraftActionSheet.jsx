import colors from "@/constants/colors";
import sizes from "@/constants/sizes";
import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

export default function DraftActionSheet({
  visible,
  onClose,
  onSaveDraft,
  onDiscard,
  onContinue,
  discardIconName = "trash-outline",
  discardLabel = "Bỏ bài viết",
}) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.bottomSheet}>
          <Text style={styles.sheetTitle}>Bạn muốn hoàn thành bài viết của mình sau?</Text>
          <Text style={styles.sheetSubtitle}>Lưu làm bản nháp hoặc bạn có thể tiếp tục chỉnh sửa.</Text>

          <Pressable style={styles.optionRow} className="active:opacity-70 active:bg-[#f0f0f0]" onPress={onSaveDraft}>
            <View style={styles.iconContainer}>
              <Ionicons name="bookmark-outline" size={24} color={colors.text} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.optionTitle}>Lưu làm bản nháp</Text>
              <Text style={styles.optionDesc}>Bạn sẽ nhận được thông báo về bản nháp.</Text>
            </View>
          </Pressable>

          <Pressable style={styles.optionRow} className="active:opacity-70 active:bg-[#f0f0f0]" onPress={onDiscard}>
            <View style={styles.iconContainer}>
              <Ionicons name={discardIconName} size={24} color={colors.text} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.optionTitle}>{discardLabel}</Text>
            </View>
          </Pressable>

          <Pressable style={styles.optionRow} className="active:opacity-70 active:bg-[#f0f0f0]" onPress={onContinue}>
            <View style={styles.iconContainer}>
              <Ionicons name="checkmark-outline" size={28} color="#2196F3" />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.optionTitle, { color: "#2196F3" }]}>Tiếp tục chỉnh sửa</Text>
            </View>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  bottomSheet: {
    backgroundColor: colors.white,
    paddingHorizontal: sizes.md,
    paddingBottom: sizes.xl + 20,
    paddingTop: sizes.md,
  },
  sheetTitle: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: sizes.lg,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: sizes.sm,
    gap: sizes.md,
  },
  optionRowPressed: {
    opacity: 0.7,
    backgroundColor: "#f0f0f0"
  },
  iconContainer: {
    width: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    color: colors.text,
  },
  optionDesc: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
});
