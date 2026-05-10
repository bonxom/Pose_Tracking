import AppButton from "@/components/common/AppButton";
import AppInput from "@/components/common/AppInput";
import Screen from "@/components/common/Screen";
import { getBlocks, setBlock } from "@/repositories/blockRepository";
import demoStyles from "@/styles/demo.styles";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";

export default function BlocksScreen() {
  const [blocks, setBlocks] = useState([]);
  const [userId, setUserId] = useState("");
  const [status, setStatus] = useState("");

  const loadBlocks = useCallback(() => {
    getBlocks()
      .then(setBlocks)
      .catch((error) => setStatus(error.message));
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
      setStatus(error.message || "Không thể chặn người dùng.");
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
              <Text style={demoStyles.cardTitle}>{item.username}</Text>
              <Text style={demoStyles.cardText}>{item.role || "Không rõ vai trò"} · {item.id}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
