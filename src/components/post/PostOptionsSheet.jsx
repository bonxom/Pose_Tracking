import colors from "@/constants/colors";
import sizes from "@/constants/sizes";
import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

function OptionRow({ iconName, label, onPress, destructive }) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.optionRow,
        pressed && styles.optionRowPressed,
      ]}
      onPress={onPress}
    >
      <View
        style={[styles.iconCircle, destructive && styles.iconCircleDestructive]}
      >
        <Ionicons
          name={iconName}
          size={22}
          color={destructive ? colors.error : colors.text}
        />
      </View>
      <Text
        style={[styles.optionText, destructive && styles.optionTextDestructive]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function PostOptionsSheet({
  visible,
  onClose,
  isOwnPost,
  onTurnOffNotifications,
  onTurnOnNotifications,
  onDeletePost,
  onEditPost,
  onReportPost,
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
          <View style={styles.sheetHandle} />

          {isOwnPost ? (
            <>
              <OptionRow
                iconName="notifications-off-outline"
                label="Tắt thông báo về bài viết này"
                onPress={onTurnOffNotifications}
              />
              <OptionRow
                iconName="pencil-outline"
                label="Chỉnh sửa bài viết này"
                onPress={onEditPost}
              />
              <OptionRow
                iconName="trash-outline"
                label="Xóa bài viết này"
                onPress={onDeletePost}
                destructive
              />
            </>
          ) : (
            <>
              <OptionRow
                iconName="alert-circle-outline"
                label="Tìm hỗ trợ hoặc báo cáo bài viết"
                onPress={onReportPost}
              />
              <OptionRow
                iconName="notifications-outline"
                label="Bật thông báo về bài viết này"
                onPress={onTurnOnNotifications}
              />
            </>
          )}
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
    borderTopLeftRadius: sizes.lg,
    borderTopRightRadius: sizes.lg,
    paddingHorizontal: sizes.md,
    paddingBottom: sizes.xl + 20,
    paddingTop: sizes.sm,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: "center",
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
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircleDestructive: {
    backgroundColor: `${colors.error}15`,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
  },
  optionTextDestructive: {
    color: colors.error,
  },
});
