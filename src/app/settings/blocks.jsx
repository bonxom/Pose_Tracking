import AppButton from "@/components/common/AppButton";
import AppInput from "@/components/common/AppInput";
import Screen from "@/components/common/Screen";
import { getBlocks, setBlock } from "@/repositories/blockRepository";
import demoStyles from "@/styles/demo.styles";
import { resolveAvatarUri } from "@/utils/profile";
import { router, useFocusEffect } from "expo-router";
import { redirectIfSessionExpired } from "@/utils/screenErrors";
import { useCallback, useState } from "react";
import { Image, ScrollView, Text, View } from "react-native";

export default function BlocksScreen() {
  const [blocks, setBlocks] = useState([]);
  const [userId, setUserId] = useState("");
  const [status, setStatus] = useState("");

  const loadBlocks = useCallback(() => {
    getBlocks()
      .then(setBlocks)
      .catch(async (error) => {
        if (await redirectIfSessionExpired(error, router)) return;
        setStatus(error.message);
      });
  }, []);

  useFocusEffect(loadBlocks);

  const blockUser = async () => {
    if (!userId.trim()) {
      setStatus("Nhập user_id cần chặn.");
      return;
    }

    try {
      await setBlock(userId.trim(), "block");
      setStatus("Đã gửi yêu cầu chặn.");
      setUserId("");
      loadBlocks();
    } catch (error) {
      if (await redirectIfSessionExpired(error, router)) return;
      setStatus(error.message || "Không thể chặn người dùng.");
    }
  };

  const unblockUser = async (item) => {
    try {
      await setBlock(item.id, "unblock");
      setBlocks((current) => current.filter((block) => block.id !== item.id));
      setStatus("Đã bỏ chặn người dùng.");
    } catch (error) {
      if (await redirectIfSessionExpired(error, router)) return;
      setStatus(error.message || "Không thể bỏ chặn.");
    }
  };

  return (
    <Screen style={demoStyles.screen}>
      <ScrollView contentContainerStyle={demoStyles.scrollContent}>
        <View style={demoStyles.header}>
          <Text style={demoStyles.title}>Danh sách chặn</Text>
          <Text style={demoStyles.subtitle}>Quản lý quan hệ chặn GV/HV theo API get_list_blocks và set_block.</Text>
        </View>

        <View style={demoStyles.card}>
          <AppInput label="User ID" value={userId} onChangeText={setUserId} />
          <AppButton title="Chặn người dùng" onPress={blockUser} />
          {status ? <Text style={demoStyles.cardText}>{status}</Text> : null}
        </View>

        <View style={demoStyles.card}>
          <Text style={demoStyles.cardTitle}>{blocks.length} người dùng bị chặn</Text>
          {blocks.map((item) => (
              <View key={item.id} style={demoStyles.resultRow}>
              <View style={demoStyles.row}>
                <Image
                  source={{
                    uri: resolveAvatarUri(
                      item.avatar || "",
                      item.avatarVersion || item.profileSyncRequestedAt || "",
                    ),
                  }}
                  style={demoStyles.avatar}
                />
                <View style={{ flex: 1 }}>
                  <Text style={demoStyles.cardTitle}>{item.username}</Text>
                  <Text style={demoStyles.cardText}>{item.role || "Không rõ vai trò"} · {item.id}</Text>
                </View>
              </View>
              <AppButton title="Bỏ chặn" onPress={() => unblockUser(item)} />
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
