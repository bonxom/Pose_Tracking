import AppButton from "@/components/common/AppButton";
import colors from "@/constants/colors";
import sizes from "@/constants/sizes";
import {
  PostUnavailableError,
  reportPost,
} from "@/repositories/postRepository";
import { redirectIfSessionExpired } from "@/utils/screenErrors";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const REPORT_REASONS = [
  "Ảnh khỏa thân",
  "Bạo lực",
  "Quấy rối",
  "Tự tử/Tự gây thương tích",
  "Tin giả",
  "Spam",
  "Bán hàng trái phép",
  "Ngôn từ gây thù ghét",
  "Khủng bố",
  "Vấn đề khác",
];

export default function ReportPostFlow({
  post,
  onCancel,
  onClose,
  onSubmitted,
  onPostUnavailable,
}) {
  const [step, setStep] = useState("select");
  const [selectedReason, setSelectedReason] = useState("");
  const [details, setDetails] = useState("");
  const [errorText, setErrorText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trimmedDetails = useMemo(() => details.trim(), [details]);
  const canContinue = Boolean(selectedReason);
  const canSubmit = Boolean(selectedReason && trimmedDetails);

  const handleContinue = () => {
    if (!canContinue) {
      setErrorText("Vui lòng chọn lý do báo cáo.");
      return;
    }

    setErrorText("");
    setStep("details");
  };

  const handleBackToReasons = () => {
    setErrorText("");
    setStep("select");
  };

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) {
      setErrorText("Vui lòng nhập nội dung chi tiết trước khi gửi.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorText("");
      const result = await reportPost(post, {
        subject: selectedReason,
        details: trimmedDetails,
      });
      onSubmitted?.(result);
      setStep("success");
    } catch (error) {
      if (await redirectIfSessionExpired(error, router)) return;

      if (error instanceof PostUnavailableError || error?.postUnavailable) {
        onPostUnavailable?.(post?.id);
        setStep("unavailable");
        return;
      }

      setErrorText("Không thể gửi báo cáo. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === "success") {
    return (
      <View style={styles.statePane}>
        <View style={[styles.stateIcon, styles.stateIconSuccess]}>
          <Ionicons name="checkmark" size={32} color={colors.white} />
        </View>
        <Text style={styles.stateTitle}>Đã gửi báo cáo</Text>
        <Text style={styles.stateText}>
          Cảm ơn bạn đã gửi báo cáo. Chúng tôi sẽ xem xét bài viết này.
        </Text>
        <AppButton title="Xong" onPress={onClose} style={styles.fullButton} />
      </View>
    );
  }

  if (step === "unavailable") {
    return (
      <View style={styles.statePane}>
        <View style={[styles.stateIcon, styles.stateIconWarning]}>
          <Ionicons name="alert" size={32} color={colors.white} />
        </View>
        <Text style={styles.stateTitle}>Bài viết không còn khả dụng</Text>
        <Text style={styles.stateText}>
          Bài viết đã bị khóa hoặc không còn tồn tại. Vui lòng quay lại để tiếp
          tục.
        </Text>
        <AppButton title="Xong" onPress={onClose} style={styles.fullButton} />
      </View>
    );
  }

  return (
    <View style={styles.flow}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={step === "details" ? handleBackToReasons : onCancel}
          style={styles.iconButton}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={step === "details" ? "Quay lại" : "Đóng"}
        >
          <Ionicons
            name={step === "details" ? "arrow-back" : "close"}
            size={24}
            color={colors.text}
          />
        </Pressable>
        <Text style={styles.headerTitle}>Báo cáo bài viết</Text>
        <View style={styles.iconButton} />
      </View>

      {step === "select" ? (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.reasonContent}
          >
            <Text style={styles.title}>Vui lòng chọn vấn đề để tiếp tục</Text>
            <Text style={styles.subtitle}>
              Bạn có thể báo cáo bài viết sau khi chọn vấn đề.
            </Text>

            <View style={styles.reasonGrid}>
              {REPORT_REASONS.map((reason) => {
                const isSelected = selectedReason === reason;
                return (
                  <Pressable
                    key={reason}
                    onPress={() => {
                      setSelectedReason(reason);
                      setErrorText("");
                    }}
                    style={({ pressed }) => [
                      styles.reasonChip,
                      isSelected && styles.reasonChipSelected,
                      pressed && styles.reasonChipPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                  >
                    {isSelected ? (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={colors.white}
                      />
                    ) : null}
                    <Text
                      style={[
                        styles.reasonText,
                        isSelected && styles.reasonTextSelected,
                      ]}
                    >
                      {reason}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.helperText}>
              Hãy chọn lý do phù hợp nhất với nội dung bạn muốn báo cáo.
            </Text>
          </ScrollView>

          {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
          <AppButton
            title="Tiếp"
            onPress={handleContinue}
            disabled={!canContinue}
            style={styles.fullButton}
          />
        </>
      ) : (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.detailsContent}
          >
            <Text style={styles.title}>Mô tả chi tiết báo cáo</Text>
            <Text style={styles.subtitle}>
              Nội dung này giúp chúng tôi hiểu rõ vấn đề hơn.
            </Text>

            <View style={styles.selectedReasonPill}>
              <Ionicons name="checkmark" size={18} color={colors.white} />
              <Text style={styles.selectedReasonText}>{selectedReason}</Text>
            </View>

            <TextInput
              value={details}
              onChangeText={(nextValue) => {
                setDetails(nextValue);
                if (errorText) setErrorText("");
              }}
              placeholder="Nhập nội dung chi tiết..."
              placeholderTextColor={colors.placeholder}
              multiline
              textAlignVertical="top"
              style={styles.detailsInput}
              maxLength={500}
              accessibilityLabel="Nội dung chi tiết báo cáo"
            />
            <Text style={styles.characterCount}>{details.length}/500 ký tự</Text>
          </ScrollView>

          {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
          <AppButton
            title="Gửi báo cáo"
            onPress={handleSubmit}
            disabled={isSubmitting}
            loading={isSubmitting}
            style={styles.fullButton}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flow: {
    maxHeight: "88%",
    gap: sizes.md,
  },
  headerRow: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: sizes.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  reasonContent: {
    gap: sizes.sm,
    paddingBottom: sizes.sm,
  },
  detailsContent: {
    gap: sizes.sm,
    paddingBottom: sizes.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.subtext,
  },
  reasonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: sizes.sm,
    paddingVertical: sizes.sm,
  },
  reasonChip: {
    minHeight: 44,
    borderRadius: 999,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: sizes.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: sizes.xs,
  },
  reasonChipSelected: {
    backgroundColor: colors.blue,
  },
  reasonChipPressed: {
    opacity: 0.78,
  },
  reasonText: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
  },
  reasonTextSelected: {
    color: colors.white,
  },
  helperText: {
    borderRadius: sizes.radiusMd,
    borderWidth: sizes.borderWidth,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
    padding: sizes.md,
    fontSize: 14,
    lineHeight: 20,
    color: colors.subtext,
  },
  selectedReasonPill: {
    alignSelf: "flex-start",
    minHeight: 44,
    borderRadius: 999,
    backgroundColor: colors.blue,
    paddingHorizontal: sizes.md,
    flexDirection: "row",
    alignItems: "center",
    gap: sizes.sm,
  },
  selectedReasonText: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.white,
  },
  detailsInput: {
    minHeight: 132,
    borderRadius: sizes.radiusMd,
    borderWidth: sizes.borderWidth,
    borderColor: colors.borderInput,
    backgroundColor: colors.surface,
    padding: sizes.md,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },
  characterCount: {
    alignSelf: "flex-end",
    fontSize: 12,
    color: colors.subtext,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.error,
  },
  fullButton: {
    width: "100%",
  },
  statePane: {
    alignItems: "center",
    gap: sizes.md,
    paddingVertical: sizes.xl,
  },
  stateIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  stateIconSuccess: {
    backgroundColor: colors.success,
  },
  stateIconWarning: {
    backgroundColor: colors.error,
  },
  stateTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
  },
  stateText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.subtext,
    textAlign: "center",
  },
});
