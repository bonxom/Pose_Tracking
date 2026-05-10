import Screen from "@/components/common/Screen";
import {
  deleteConversation,
  getConversationList,
  markConversationRead,
} from "@/repositories/conversationRepository";
import demoStyles from "@/styles/demo.styles";
import { redirectIfSessionExpired } from "@/utils/screenErrors";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function ConversationListScreen() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("");

  const load = useCallback(() => {
    getConversationList()
      .then(setItems)
      .catch(async (error) => {
        if (await redirectIfSessionExpired(error, router)) return;
        setStatus(error.message);
      });
  }, []);

  useFocusEffect(load);

  const open = async (item) => {
    try {
      await markConversationRead(item.id);
    } catch (error) {
      if (await redirectIfSessionExpired(error, router)) return;
      // Opening the thread is still useful if read-state is blocked by backend.
    }
    router.push(`/chat/${item.id}`);
  };

  const remove = async (item) => {
    try {
      await deleteConversation(item.id);
      load();
    } catch (error) {
      if (await redirectIfSessionExpired(error, router)) return;
      setStatus(error.message || "Không thể xóa cuộc trò chuyện.");
    }
  };

  return (
    <Screen style={demoStyles.screen}>
      <ScrollView contentContainerStyle={demoStyles.scrollContent}>
        <View style={demoStyles.header}>
          <Text style={demoStyles.title}>Tin nhắn</Text>
          <Text style={demoStyles.subtitle}>Danh sách hội thoại GV/HV.</Text>
        </View>

        {status ? <Text style={demoStyles.cardText}>{status}</Text> : null}
        {items.map((item) => (
          <Pressable key={item.id} onPress={() => open(item)}>
            <View style={demoStyles.card}>
              <View style={demoStyles.rowBetween}>
                <View style={{ flex: 1 }}>
                  <Text style={demoStyles.cardTitle}>{item.title}</Text>
                  <Text style={demoStyles.cardText}>{item.lastMessage}</Text>
                </View>
                <Text style={demoStyles.cardText} onPress={() => remove(item)}>Xóa</Text>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}
