import Screen from "@/components/common/Screen";
import ProfileIcon from "@/components/icons/ProfileIcon";
import colors from "@/constants/colors";
import sizes from "@/constants/sizes";
import {
  getPushSettings,
  normalizePushSettings,
  setPushSettings,
} from "@/repositories/settingsRepository";
import { loadAndApplyPushSettings } from "@/services/pushNotifications";
import { redirectIfSessionExpired } from "@/utils/screenErrors";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

const CONTENT_SETTINGS = [
  {
    key: "likeComment",
    icon: "chatbubble-ellipses-outline",
    title: "Bình luận và lượt thích",
    description:
      "Khi có người thích, bình luận hoặc phản hồi trong bài viết liên quan đến bạn.",
    example: "Một học viên vừa bình luận về bài nộp của bạn.",
  },
  {
    key: "fromFriends",
    icon: "people-outline",
    title: "Cập nhật từ bạn bè",
    description: "Bài viết, video và tương tác mới từ những người bạn theo dõi.",
    example: "Bạn bè của bạn vừa đăng một bài tập mới.",
  },
  {
    key: "requestedFriend",
    icon: "person-add-outline",
    title: "Lời mời kết bạn / học viên",
    description:
      "Lời mời kết nối hoặc yêu cầu tham gia khóa học cần được xử lý.",
    example: "Có học viên gửi yêu cầu tham gia khóa học của bạn.",
  },
  {
    key: "suggestedFriend",
    icon: "sparkles-outline",
    title: "Những người bạn có thể biết",
    description: "Gợi ý kết nối với người dùng phù hợp trong hệ thống.",
    example: "Hệ thống gợi ý một học viên cùng khóa với bạn.",
  },
  {
    key: "birthday",
    icon: "gift-outline",
    title: "Sinh nhật",
    description: "Nhắc sinh nhật của người dùng trong danh sách kết nối.",
    example: "Hôm nay là sinh nhật của một người bạn biết.",
  },
  {
    key: "video",
    icon: "videocam-outline",
    title: "Video / bài tập",
    description: "Video, bài tập hoặc bài nộp của bạn có cập nhật mới.",
    example: "Video bài tập của bạn đã được ghi nhận.",
  },
  {
    key: "report",
    icon: "flag-outline",
    title: "Phản hồi báo cáo",
    description: "Kết quả xử lý khi bạn báo cáo một bài viết không phù hợp.",
    example: "Báo cáo bài viết của bạn đã có phản hồi.",
  },
];

const DELIVERY_SETTINGS = [
  {
    key: "notificationOn",
    icon: "notifications-outline",
    title: "Thông báo đẩy",
    description: "Nhận thông báo trực tiếp từ ứng dụng.",
  },
  {
    key: "soundOn",
    icon: "volume-high-outline",
    title: "Âm thanh",
    description: "Phát âm báo khi có thông báo mới.",
  },
  {
    key: "vibrantOn",
    icon: "phone-portrait-outline",
    title: "Rung",
    description: "Báo rung khi có thông báo mới.",
  },
  {
    key: "ledOn",
    icon: "flashlight-outline",
    title: "Đèn LED",
    description: "Hiển thị đèn báo khi có thông báo mới.",
  },
];

function SwitchControl({ disabled, value, onChange }) {
  return (
    <Switch
      value={Boolean(value)}
      disabled={disabled}
      onValueChange={onChange}
      trackColor={{ false: colors.surfaceOverlay, true: "#A7C7FF" }}
      thumbColor={value ? colors.blue : colors.white}
      ios_backgroundColor={colors.surfaceOverlay}
    />
  );
}

function StatusText({ enabled, disabled }) {
  if (disabled) {
    return <Text style={styles.rowMeta}>Tạm dừng</Text>;
  }

  return (
    <Text style={styles.rowMeta}>
      Thông báo đẩy · {enabled ? "Bật" : "Tắt"}
    </Text>
  );
}

function SettingsSection({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.list}>{children}</View>
    </View>
  );
}

export default function PushSettingsScreen() {
  const [settings, setSettings] = useState(normalizePushSettings({}));
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [savingKey, setSavingKey] = useState("");
  const [selectedSettingKey, setSelectedSettingKey] = useState("");

  const selectedSetting = useMemo(
    () => CONTENT_SETTINGS.find((item) => item.key === selectedSettingKey),
    [selectedSettingKey],
  );

  const loadSettings = useCallback(() => {
    setIsLoading(true);
    getPushSettings()
      .then((data) => {
        setSettings((current) => normalizePushSettings(data, current));
        setStatus("");
      })
      .catch(async (error) => {
        if (await redirectIfSessionExpired(error, router)) return;
        setStatus(error.message || "Không thể tải cài đặt thông báo.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  useFocusEffect(loadSettings);

  const saveSettings = async (nextSettings, key) => {
    const previousSettings = settings;
    setSettings(nextSettings);
    setSavingKey(key);
    setStatus("");

    try {
      const saved = await setPushSettings(nextSettings);
      setSettings(normalizePushSettings(saved, previousSettings));
      await loadAndApplyPushSettings();
      setStatus("Đã lưu cài đặt thông báo.");
    } catch (error) {
      setSettings(previousSettings);
      if (await redirectIfSessionExpired(error, router)) return;
      setStatus(error.message || "Không thể lưu cài đặt thông báo.");
    } finally {
      setSavingKey("");
    }
  };

  const toggle = (key) => {
    if (key !== "notificationOn" && !settings.notificationOn) {
      setStatus("Bật Thông báo đẩy để chỉnh các mục bên dưới.");
      return;
    }

    saveSettings(
      {
        ...settings,
        [key]: !settings[key],
      },
      key,
    );
  };

  const goBackToSettings = () => {
    if (router.canGoBack?.()) {
      router.back();
      return;
    }

    router.replace("/settings");
  };

  const closeDetail = () => setSelectedSettingKey("");

  const renderContentRow = (item) => {
    const disabled = !settings.notificationOn;
    const isSaving = savingKey === item.key;

    return (
      <View
        key={item.key}
        style={[styles.row, disabled ? styles.rowDisabled : null]}
      >
        <View style={styles.iconBox}>
          <ProfileIcon
            name={item.icon}
            size={24}
            color={disabled ? colors.placeholder : colors.inkMuted}
          />
        </View>
        <Pressable
          style={styles.rowBody}
          disabled={disabled}
          onPress={() => setSelectedSettingKey(item.key)}
        >
          <Text style={[styles.rowTitle, disabled ? styles.disabledText : null]}>
            {item.title}
          </Text>
          <StatusText enabled={settings[item.key]} disabled={disabled} />
          {isSaving ? <Text style={styles.savingText}>Đang lưu...</Text> : null}
        </Pressable>
        <SwitchControl
          value={settings[item.key]}
          disabled={disabled || Boolean(savingKey)}
          onChange={() => toggle(item.key)}
        />
        <ProfileIcon
          name="chevron-forward"
          size={18}
          color={disabled ? colors.placeholder : colors.inkMuted}
        />
      </View>
    );
  };

  const renderDeliveryRow = (item) => {
    const disabled = item.key !== "notificationOn" && !settings.notificationOn;
    const isSaving = savingKey === item.key;

    return (
      <View
        key={item.key}
        style={[styles.row, disabled ? styles.rowDisabled : null]}
      >
        <View style={styles.iconBox}>
          <ProfileIcon
            name={item.icon}
            size={24}
            color={disabled ? colors.placeholder : colors.inkMuted}
          />
        </View>
        <View style={styles.rowBody}>
          <Text style={[styles.rowTitle, disabled ? styles.disabledText : null]}>
            {item.title}
          </Text>
          <Text style={styles.rowMeta}>
            {disabled ? "Tạm dừng" : item.description}
          </Text>
          {isSaving ? <Text style={styles.savingText}>Đang lưu...</Text> : null}
        </View>
        <SwitchControl
          value={settings[item.key]}
          disabled={disabled || Boolean(savingKey)}
          onChange={() => toggle(item.key)}
        />
      </View>
    );
  };

  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={goBackToSettings}>
            <ProfileIcon name="arrow-back" size={28} color={colors.black} />
          </Pressable>
          <Text style={styles.title}>Cài đặt thông báo</Text>
        </View>

        <Text style={styles.intro}>
          Chọn nội dung bạn muốn nhận và cách ứng dụng báo cho bạn khi có cập
          nhật mới.
        </Text>

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={colors.blue} />
            <Text style={styles.loadingText}>Đang tải cài đặt...</Text>
          </View>
        ) : null}

        {!settings.notificationOn ? (
          <View style={styles.pauseBanner}>
            <ProfileIcon
              name="notifications-off-outline"
              size={22}
              color={colors.inkMuted}
            />
            <Text style={styles.pauseText}>
              Thông báo đẩy đang tắt. Các mục bên dưới sẽ được giữ nguyên và mở
              lại khi bạn bật thông báo.
            </Text>
          </View>
        ) : null}

        <SettingsSection title="Bạn nhận thông báo về">
          {CONTENT_SETTINGS.map(renderContentRow)}
        </SettingsSection>

        <SettingsSection title="Bạn nhận thông báo qua">
          {DELIVERY_SETTINGS.map(renderDeliveryRow)}
        </SettingsSection>

        {status ? (
          <View style={styles.statusBox}>
            <Text style={styles.statusText}>{status}</Text>
            <Pressable style={styles.reloadButton} onPress={loadSettings}>
              <Text style={styles.reloadText}>Tải lại</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      <Modal
        transparent
        animationType="fade"
        visible={Boolean(selectedSetting)}
        onRequestClose={closeDetail}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailPanel}>
            <View style={styles.detailHeader}>
              <Pressable style={styles.backButton} onPress={closeDetail}>
                <ProfileIcon name="arrow-back" size={26} color={colors.black} />
              </Pressable>
              <Text style={styles.detailTitle}>{selectedSetting?.title}</Text>
            </View>

            <Text style={styles.detailDescription}>
              {selectedSetting?.description}
            </Text>

            <View style={styles.exampleBox}>
              <View style={styles.exampleAvatar}>
                <ProfileIcon name="person" size={22} color={colors.white} />
              </View>
              <Text style={styles.exampleText}>{selectedSetting?.example}</Text>
            </View>

            <Text style={styles.detailSectionTitle}>
              Nơi bạn nhận các thông báo này
            </Text>

            {selectedSetting ? (
              <View
                style={[
                  styles.detailToggleRow,
                  !settings.notificationOn ? styles.rowDisabled : null,
                ]}
              >
                <View style={styles.iconBox}>
                  <ProfileIcon
                    name="notifications-outline"
                    size={24}
                    color={
                      settings.notificationOn
                        ? colors.inkMuted
                        : colors.placeholder
                    }
                  />
                </View>
                <View style={styles.rowBody}>
                  <Text
                    style={[
                      styles.rowTitle,
                      !settings.notificationOn ? styles.disabledText : null,
                    ]}
                  >
                    Thông báo đẩy
                  </Text>
                  {!settings.notificationOn ? (
                    <Text style={styles.rowMeta}>
                      Bật Thông báo đẩy để chỉnh mục này.
                    </Text>
                  ) : null}
                </View>
                <SwitchControl
                  value={settings[selectedSetting.key]}
                  disabled={!settings.notificationOn || Boolean(savingKey)}
                  onChange={() => toggle(selectedSetting.key)}
                />
              </View>
            ) : null}
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.white,
    paddingHorizontal: 0,
  },
  content: {
    paddingBottom: sizes.xxl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: sizes.lg,
    minHeight: 64,
    paddingHorizontal: sizes.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderMuted,
    backgroundColor: colors.white,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "800",
    color: colors.black,
  },
  intro: {
    paddingHorizontal: sizes.lg,
    paddingTop: sizes.lg,
    paddingBottom: sizes.md,
    fontSize: 16,
    lineHeight: 23,
    color: colors.inkMuted,
  },
  loadingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: sizes.sm,
    paddingHorizontal: sizes.lg,
    paddingVertical: sizes.md,
  },
  loadingText: {
    fontSize: 14,
    color: colors.inkMuted,
  },
  pauseBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: sizes.sm,
    marginHorizontal: sizes.lg,
    marginBottom: sizes.md,
    padding: sizes.md,
    borderRadius: sizes.radiusMd,
    backgroundColor: colors.surface,
  },
  pauseText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: colors.inkMuted,
  },
  section: {
    marginTop: sizes.md,
  },
  sectionTitle: {
    paddingHorizontal: sizes.lg,
    paddingBottom: sizes.sm,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "900",
    color: colors.black,
  },
  list: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderMuted,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderMuted,
    backgroundColor: colors.white,
  },
  row: {
    minHeight: 82,
    flexDirection: "row",
    alignItems: "center",
    gap: sizes.md,
    paddingVertical: sizes.md,
    paddingLeft: sizes.lg,
    paddingRight: sizes.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderMuted,
  },
  rowDisabled: {
    opacity: 0.48,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "800",
    color: colors.black,
  },
  rowMeta: {
    marginTop: sizes.xs,
    fontSize: 14,
    lineHeight: 19,
    color: colors.inkMuted,
  },
  disabledText: {
    color: colors.inkMuted,
  },
  savingText: {
    marginTop: sizes.xs,
    fontSize: 13,
    color: colors.blue,
  },
  statusBox: {
    marginHorizontal: sizes.lg,
    marginTop: sizes.lg,
    padding: sizes.md,
    borderRadius: sizes.radiusMd,
    backgroundColor: colors.surface,
  },
  statusText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.inkMuted,
  },
  reloadButton: {
    alignSelf: "flex-start",
    marginTop: sizes.md,
    paddingHorizontal: sizes.lg,
    paddingVertical: sizes.sm,
    borderRadius: 20,
    backgroundColor: colors.surfaceMuted,
  },
  reloadText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.black,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: colors.overlayBlack40,
  },
  detailPanel: {
    maxHeight: "88%",
    paddingBottom: sizes.xxl,
    borderTopLeftRadius: sizes.radiusLg,
    borderTopRightRadius: sizes.radiusLg,
    backgroundColor: colors.white,
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: sizes.md,
    minHeight: 64,
    paddingHorizontal: sizes.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderMuted,
  },
  detailTitle: {
    flex: 1,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
    color: colors.black,
  },
  detailDescription: {
    paddingHorizontal: sizes.lg,
    paddingTop: sizes.lg,
    fontSize: 16,
    lineHeight: 23,
    color: colors.inkMuted,
  },
  exampleBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: sizes.md,
    marginHorizontal: sizes.lg,
    marginTop: sizes.lg,
    padding: sizes.md,
    borderRadius: sizes.radiusMd,
    backgroundColor: colors.surface,
  },
  exampleAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.blue,
  },
  exampleText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
    color: colors.inkMuted,
  },
  detailSectionTitle: {
    paddingHorizontal: sizes.lg,
    paddingTop: sizes.xl,
    paddingBottom: sizes.sm,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
    color: colors.black,
  },
  detailToggleRow: {
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
    gap: sizes.md,
    paddingHorizontal: sizes.lg,
    paddingVertical: sizes.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderMuted,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderMuted,
  },
});
