import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function ModalConfirm({
  visible,
  title = "Xác nhận",
  message,
  onConfirm,
  onCancel,
  isProcessing = false,
  confirmText = "Xác nhận",
  cancelText = "Huỷ",
}) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
          </View>
          <View style={styles.modalBody}>
            {typeof message === "string" ? (
              <Text style={styles.modalMessage}>{message}</Text>
            ) : (
              // If message is a React element (like a Text component with nested bold text)
              <Text style={styles.modalMessage}>{message}</Text>
            )}
          </View>
          <View style={styles.modalFooter}>
            <Pressable
              style={({ pressed }) => [
                styles.modalBtnCancel,
                { opacity: pressed || isProcessing ? 0.7 : 1 },
              ]}
              onPress={onCancel}
              disabled={isProcessing}
            >
              <Text style={styles.modalBtnCancelText}>{cancelText}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.modalBtnConfirm,
                { opacity: pressed || isProcessing ? 0.7 : 1 },
              ]}
              onPress={onConfirm}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.modalBtnConfirmText}>{confirmText}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 384,
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
  },
  modalHeader: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  modalBody: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  modalMessage: {
    fontSize: 15,
    color: "#4b5563",
    lineHeight: 24,
  },
  modalFooter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f9fafb",
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  modalBtnConfirm: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
    alignItems: "center",
  },
  modalBtnConfirmText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  modalBtnCancel: {
    backgroundColor: "#e5e7eb",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
    alignItems: "center",
  },
  modalBtnCancelText: {
    color: "#1f2937",
    fontSize: 14,
    fontWeight: "500",
  },
});
