import {
  getPushSettings,
  normalizePushSettings,
  setPushSettings,
} from "@/repositories/settingsRepository";
import { loadAndApplyPushSettings } from "@/services/pushNotifications";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";

const CONTENT_NOTIFICATION_KEYS = [
  {
    key: "likeComment",
    title: "Lượt thích và bình luận",
    description: "Thông báo khi có người thích hoặc bình luận bài viết.",
    icon: "💬",
  },
  {
    key: "video",
    title: "Bài viết / video / bài tập",
    description: "Thông báo khi có bài viết, video hoặc bài tập mới.",
    icon: "🎬",
  },
  {
    key: "report",
    title: "Báo cáo",
    description: "Thông báo liên quan đến báo cáo nội dung.",
    icon: "⚠️",
  },
];

const DELIVERY_NOTIFICATION_KEYS = [
  {
    key: "soundOn",
    title: "Âm thanh",
    description: "Bật: giọng nói. Tắt: âm báo SMS.",
    icon: "🔊",
  },
  {
    key: "vibrantOn",
    title: "Rung",
    description: "Rung thiết bị khi nhận thông báo.",
    icon: "📳",
  },
  {
    key: "ledOn",
    title: "Đèn LED điện thoại",
    description: "Nháy đèn LED khi có thông báo nếu thiết bị hỗ trợ.",
    icon: "⚡",
  },
];

export default function PushSettingsScreen() {
  const [settings, setSettings] = useState(normalizePushSettings({}));
  const [status, setStatus] = useState("");
  const toastTimerRef = useRef(null);

  const showToast = (message) => {
    setStatus(message);

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = setTimeout(() => {
      setStatus("");
    }, 1800);
  };

  useFocusEffect(
    useCallback(() => {
      getPushSettings()
        .then((data) => setSettings(normalizePushSettings(data)))
        .catch((error) => showToast(error.message || "Không thể tải cài đặt."));
    }, []),
  );

  const toggle = async (key) => {
    const nextSettings = {
      ...settings,
      [key]: !settings[key],
    };

    setSettings(nextSettings);

    // clear transient status before attempting network update
    setStatus("");

    try {
      await setPushSettings(nextSettings);
      await loadAndApplyPushSettings();
      // success: silently apply without toast (optimistic UX)
    } catch (error) {
      setSettings(settings);
      showToast(error.message || "Không thể cập nhật cài đặt.");
    }
  };

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>Thông báo đẩy</Text>
          <Text style={styles.headerText}>
            Quản lý thông báo liên quan đến bài viết, bình luận, video và âm thanh.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Quản lý thông báo</Text>

        <View style={styles.sectionCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingTextWrap}>
              <Text style={styles.settingTitle}>Tắt thông báo đẩy</Text>
              <Text style={styles.settingSubtitle}>
                {settings.notificationOn ? "Tắt" : "Đang tắt"}
              </Text>
            </View>

            <Switch
              value={!settings.notificationOn}
              onValueChange={() => toggle("notificationOn")}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Bạn nhận thông báo về</Text>

        <Text style={styles.sectionDescription}>
          Quản lý các nhóm thông báo liên quan đến bài viết, bình luận và bài tập.
        </Text>

        <View style={styles.sectionCard}>
          {CONTENT_NOTIFICATION_KEYS.map((item) => {
            const disabled = !settings.notificationOn;

            return (
              <View
                key={item.key}
                style={[styles.settingRow, disabled && styles.settingRowDisabled]}
              >
                <Text style={styles.settingIcon}>{item.icon}</Text>

                <View style={styles.settingTextWrap}>
                  <Text style={styles.settingTitle}>{item.title}</Text>
                  <Text style={styles.settingSubtitle}>
                    {settings[item.key] ? "Thông báo đẩy" : "Đã tắt"}
                  </Text>
                </View>

                <Switch
                  value={Boolean(settings[item.key])}
                  disabled={disabled}
                  onValueChange={() => toggle(item.key)}
                />
              </View>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Cách nhận thông báo</Text>

        <View style={styles.sectionCard}>
          {DELIVERY_NOTIFICATION_KEYS.map((item) => {
            const disabled = !settings.notificationOn;

            return (
              <View
                key={item.key}
                style={[styles.settingRow, disabled && styles.settingRowDisabled]}
              >
                <Text style={styles.settingIcon}>{item.icon}</Text>

                <View style={styles.settingTextWrap}>
                  <Text style={styles.settingTitle}>{item.title}</Text>
                  <Text style={styles.settingSubtitle}>{item.description}</Text>
                </View>

                <Switch
                  value={Boolean(settings[item.key])}
                  disabled={disabled}
                  onValueChange={() => toggle(item.key)}
                />
              </View>
            );
          })}
        </View>

      </ScrollView>

    {status ? (
      <View style={styles.toast}>
        <Text style={styles.toastText}>{status}</Text>
      </View>
    ) : null}
    
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#F0F2F5",
  },
  content: {
    padding: 16,
    gap: 12,
  },
  headerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
  },
  headerText: {
    marginTop: 6,
    fontSize: 14,
    color: "#6B7280",
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  settingRow: {
    minHeight: 76,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#EEF0F3",
  },
  settingRowDisabled: {
    opacity: 0.45,
  },
  settingTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  settingDescription: {
    marginTop: 4,
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
  },
  settingSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    marginTop: 18,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 8,
  },
  settingIcon: {
    width: 38,
    fontSize: 24,
    marginRight: 10,
    textAlign: "center",
  },
  
  toast: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 28,
    backgroundColor: "rgba(17, 24, 39, 0.92)",
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  toastText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
