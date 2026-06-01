import NoInternetIcon from "@/components/icons/NoInternetIcon";
import colors from "@/constants/colors";
import {
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

/**
 * Inline "no internet" block — replaces a FlatList or content area.
 * Not full-screen; meant to be embedded inside a page layout.
 *
 * @param {{ style?: object, onRefresh?: () => void, refreshing?: boolean }} props
 */
export default function NoInternetView({
  style,
  onRefresh,
  refreshing = false,
}) {
  const handleOpenSettings = () => {
    try {
      if (Platform.OS === "android")
        Linking.sendIntent("android.settings.WIFI_SETTINGS");
      else Linking.openURL("App-Prefs:WIFI");
    } catch {
      Linking.openSettings();
    }
  };

  const content = (
    <View style={[styles.container, style]}>
      <NoInternetIcon size={112} />

      <View style={styles.textBlock}>
        <Text style={styles.title}>Không có kết nối Internet</Text>
        <Text style={styles.body}>
          Hãy kiểm tra dịch vụ Internet của bạn hoặc làm mới để thử lại
        </Text>
      </View>

      <Pressable
        style={styles.button}
        className="active:opacity-[0.88]"
        onPress={handleOpenSettings}
      >
        <Text style={styles.buttonText}>Mở cài đặt mạng</Text>
      </Pressable>
    </View>
  );

  if (onRefresh) {
    return (
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {content}
      </ScrollView>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 32,
    gap: 24,
  },
  textBlock: {
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 28,
    color: colors.ink,
    textAlign: "center",
    paddingHorizontal: 16,
  },
  body: {
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 20,
    color: colors.inkMuted,
    textAlign: "center",
    maxWidth: 280,
  },
  button: {
    backgroundColor: colors.blue,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonPressed: {
    opacity: 0.88,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 18,
  },
});
