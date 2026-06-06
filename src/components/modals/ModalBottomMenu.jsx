import { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";

export default function ModalBottomMenu({ visible, onClose, buttons = [] }) {
  const slideAnim = useRef(
    new Animated.Value(Dimensions.get("window").height),
  ).current;

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(Dimensions.get("window").height);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.sheetContainer,
                { transform: [{ translateY: slideAnim }] },
              ]}
            >
              <View style={styles.handleBar} />

              <View style={styles.itemsContainer}>
                {buttons.map((btn, index) => (
                  <Pressable
                    key={index}
                    style={({ pressed }) => [
                      styles.itemRow,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                    onPress={() => {
                      onClose();
                      if (btn.onPress) btn.onPress();
                    }}
                  >
                    <View style={styles.iconContainer}>{btn.icon}</View>
                    <View style={styles.textContainer}>
                      <Text style={[styles.itemTitle, btn.color && { color: btn.color }]}>{btn.title}</Text>
                      {btn.description ? (
                        <Text style={[styles.itemDescription, btn.color && { color: btn.color, opacity: 0.8 }]}>
                          {btn.description}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                ))}
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    backgroundColor: "#fff",
    width: "100%",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    paddingBottom: 32, // Extra padding for safe area
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: "#d1d5db",
    borderRadius: 999,
    alignSelf: "center",
    marginBottom: 20,
  },
  itemsContainer: {
    gap: 24,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  iconContainer: {
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 22,
  },
  itemDescription: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
    lineHeight: 20,
  },
});
