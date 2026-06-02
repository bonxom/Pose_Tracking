import AppButton from "@/components/common/AppButton";
import Screen from "@/components/common/Screen";
import {
  getPushSettings,
  normalizePushSettings,
  setPushSettings,
} from "@/repositories/settingsRepository";
import { loadAndApplyPushSettings } from "@/services/pushNotifications";
import demoStyles from "@/styles/demo.styles";
import { redirectIfSessionExpired } from "@/utils/screenErrors";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, Switch, Text, View } from "react-native";

const CONTENT_SETTINGS = [
  {
    key: "likeComment",
    title: "Bình luận và lượt thích",
    description: "Thông báo khi có người thích hoặc bình luận bài viết.",
  },
  {
    key: "fromFriends",
    title: "Cập nhật từ bạn bè",
    description: "Thông báo khi bạn bè có hoạt động mới.",
  },
  {
    key: "requestedFriend",
    title: "Lời mời kết bạn",
    description: "Thông báo khi có lời mời kết bạn hoặc quan hệ mới.",
  },
  {
    key: "suggestedFriend",
    title: "Những người bạn có thể biết",
    description: "Gợi ý kết nối người dùng trong hệ thống.",
  },
  {
    key: "birthday",
    title: "Sinh nhật",
    description: "Thông báo sinh nhật khi hệ thống có dữ liệu phù hợp.",
  },
  {
    key: "video",
    title: "Video",
    description: "Thông báo khi video/bài tập được đăng hoặc duyệt.",
  },
  {
    key: "report",
    title: "Phản hồi báo cáo",
    description: "Thông báo liên quan đến xử lý báo cáo nội dung.",
  },
];

const DELIVERY_SETTINGS = [
  {
    key: "notificationOn",
    title: "Thông báo đẩy",
    description: "Bật/tắt nhận thông báo đẩy trên thiết bị.",
  },
  {
    key: "soundOn",
    title: "Âm thanh",
    description: "Bật/tắt âm báo khi có thông báo.",
  },
  {
    key: "vibrantOn",
    title: "Rung",
    description: "Rung thiết bị nếu nền tảng hỗ trợ.",
  },
  {
    key: "ledOn",
    title: "Đèn LED điện thoại",
    description: "Bật LED thông báo nếu thiết bị hỗ trợ.",
  },
];

export default function PushSettingsScreen() {
  const [settings, setSettings] = useState(normalizePushSettings({}));
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [savingKey, setSavingKey] = useState("");

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
    saveSettings(
      {
        ...settings,
        [key]: !settings[key],
      },
      key,
    );
  };

  const renderSetting = (item, disabled = false) => (
    <View key={item.key} style={demoStyles.menuRow}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={demoStyles.cardTitle}>{item.title}</Text>
        <Text style={demoStyles.cardText}>{item.description}</Text>
        {savingKey === item.key ? (
          <Text style={demoStyles.cardText}>Đang lưu...</Text>
        ) : null}
      </View>
      <Switch
        value={Boolean(settings[item.key])}
        disabled={disabled || Boolean(savingKey)}
        onValueChange={() => toggle(item.key)}
      />
    </View>
  );

  return (
    <Screen style={demoStyles.screen}>
      <ScrollView contentContainerStyle={demoStyles.scrollContent}>
        <View style={demoStyles.header}>
          <Text style={demoStyles.title}>Thông báo đẩy</Text>
          <Text style={demoStyles.subtitle}>
            Chọn nhóm thông báo và cách thiết bị báo khi có cập nhật mới.
          </Text>
        </View>

        {isLoading ? <ActivityIndicator size="large" /> : null}

        <View style={demoStyles.card}>
          <Text style={demoStyles.cardTitle}>Bạn nhận thông báo về</Text>
          {CONTENT_SETTINGS.map((item) =>
            renderSetting(item, !settings.notificationOn),
          )}
        </View>

        <View style={demoStyles.card}>
          <Text style={demoStyles.cardTitle}>Cách nhận thông báo</Text>
          {DELIVERY_SETTINGS.map((item) =>
            renderSetting(
              item,
              item.key !== "notificationOn" && !settings.notificationOn,
            ),
          )}
        </View>

        {status ? (
          <View style={demoStyles.card}>
            <Text style={demoStyles.cardText}>{status}</Text>
            <AppButton title="Tải lại cài đặt" onPress={loadSettings} />
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
