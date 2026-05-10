import AppButton from "@/components/common/AppButton";
import Screen from "@/components/common/Screen";
import { getPushSettings, setPushSettings } from "@/repositories/settingsRepository";
import demoStyles from "@/styles/demo.styles";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

const PUSH_KEYS = ["notification_on", "like_comment", "from_friends", "requested_friend", "video", "sound_on"];

export default function PushSettingsScreen() {
  const [settings, setSettings] = useState({});
  const [status, setStatus] = useState("");

  useFocusEffect(
    useCallback(() => {
      getPushSettings()
        .then(setSettings)
        .catch((error) => setStatus(error.message));
    }, []),
  );

  const toggle = (key) => {
    setSettings((current) => ({ ...current, [key]: !current[key] }));
  };

  const save = async () => {
    try {
      await setPushSettings(settings);
      setStatus("Đã lưu cài đặt thông báo.");
    } catch (error) {
      setStatus(error.message || "Không thể lưu cài đặt thông báo.");
    }
  };

  return (
    <Screen style={demoStyles.screen}>
      <ScrollView contentContainerStyle={demoStyles.scrollContent}>
        <View style={demoStyles.header}>
          <Text style={demoStyles.title}>Thông báo đẩy</Text>
          <Text style={demoStyles.subtitle}>Bật/tắt các nhóm thông báo theo spec.</Text>
        </View>

        <View style={demoStyles.card}>
          {PUSH_KEYS.map((key) => (
            <Pressable key={key} onPress={() => toggle(key)} style={demoStyles.menuRow}>
              <Text style={demoStyles.cardTitle}>{key}</Text>
              <Text style={demoStyles.cardText}>{settings[key] ? "Bật" : "Tắt"}</Text>
            </Pressable>
          ))}
          <AppButton title="Lưu cài đặt" onPress={save} />
          {status ? <Text style={demoStyles.cardText}>{status}</Text> : null}
        </View>
      </ScrollView>
    </Screen>
  );
}
