import { backendApi } from "@/api/client";
import ReportPostFlow from "@/components/post/ReportPostFlow";
import colors from "@/constants/colors";
import sizes from "@/constants/sizes";
import { assertBackendOk } from "@/repositories/serverResponse";
import { getAuthSession } from "@/utils/session";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function OptionRow({
  iconName,
  label,
  onPress,
  destructive,
  disabled = false,
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.optionRow,
        (pressed || disabled) && styles.optionRowPressed,
      ]}
      onPress={onPress}
      disabled={disabled}
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
  onPostUnavailable,
  post,
  postId,
}) {
  const insets = useSafeAreaInsets();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReporting, setIsReporting] = useState(false);

  useEffect(() => {
    if (!visible) {
      setIsReporting(false);
    }
  }, [visible]);

  const handleEditPost = () => {
    if (onEditPost) {
      onEditPost();
      return;
    }

    if (!postId) return;
    onClose?.();
    router.push({
      pathname: "/post/edit",
      params: { id: postId },
    });
  };

  const handleDeletePost = async () => {
    if (!postId || isDeleting) return;

    Alert.alert("Xóa bài viết", "Bạn có chắc muốn xóa bài viết này?", [
      {
        text: "Hủy",
        style: "cancel",
      },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            setIsDeleting(true);
            const session = await getAuthSession();
            if (!session?.token) {
              throw new Error("Không tìm thấy phiên đăng nhập.");
            }

            const response = await backendApi.deletePost({
              token: session.token,
              id: postId,
            });
            await assertBackendOk(response, {
              message: "Backend delete_post failed",
            });

            onClose?.();
            onDeletePost?.(postId);
            Alert.alert("Thành công", "Đã xóa bài viết thành công.");
          } catch (_error) {
            Alert.alert("Lỗi", "Hệ thống đang lỗi, vui lòng thử lại sau");
          } finally {
            setIsDeleting(false);
          }
        },
      },
    ]);
  };

  const handleStartReport = () => {
    if (!post) return;
    setIsReporting(true);
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardAvoiding}
          pointerEvents="box-none"
        >
          <View
            style={[
              styles.bottomSheet,
              { paddingBottom: insets.bottom > 0 ? insets.bottom : sizes.md },
            ]}
          >
            <View style={styles.sheetHandle} />

            {isReporting ? (
              <ReportPostFlow
                post={post}
                onCancel={() => setIsReporting(false)}
                onClose={onClose}
                onSubmitted={onReportPost}
                onPostUnavailable={onPostUnavailable}
              />
            ) : isOwnPost ? (
              <>
                <OptionRow
                  iconName="notifications-off-outline"
                  label="Tắt thông báo về bài viết này"
                  onPress={onTurnOffNotifications}
                />
                <OptionRow
                  iconName="pencil-outline"
                  label="Chỉnh sửa bài viết này"
                  onPress={handleEditPost}
                />
                <OptionRow
                  iconName="trash-outline"
                  label="Xóa bài viết này"
                  onPress={handleDeletePost}
                  destructive
                  disabled={isDeleting}
                />
              </>
            ) : (
              <>
                <OptionRow
                  iconName="alert-circle-outline"
                  label="Báo cáo bài viết"
                  onPress={handleStartReport}
                  disabled={!post}
                />
                <OptionRow
                  iconName="notifications-outline"
                  label="Bật thông báo về bài viết này"
                  onPress={onTurnOnNotifications}
                />
              </>
            )}
          </View>
        </KeyboardAvoidingView>
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
  keyboardAvoiding: {
    width: "100%",
  },
  bottomSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: sizes.lg,
    borderTopRightRadius: sizes.lg,
    paddingHorizontal: sizes.md,
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
