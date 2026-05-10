import AppButton from "@/components/common/AppButton";
import AppInput from "@/components/common/AppInput";
import Screen from "@/components/common/Screen";
import {
  deleteMessage,
  getConversation,
  sendLocalMessage,
} from "@/repositories/conversationRepository";
import demoStyles from "@/styles/demo.styles";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";

export default function ConversationDetailScreen() {
  const params = useLocalSearchParams();
  const conversationId = typeof params.id === "string" ? params.id : "";
  const [conversation, setConversation] = useState(null);
  const [text, setText] = useState("");
  const [status, setStatus] = useState("");

  const load = useCallback(() => {
    getConversation(conversationId)
      .then(setConversation)
      .catch((error) => setStatus(error.message));
  }, [conversationId]);

  useFocusEffect(load);

  const send = async () => {
    if (!text.trim()) return;

    const message = await sendLocalMessage(conversationId, text.trim());
    setConversation((current) => ({
      ...(current || { id: conversationId, title: "Cuộc trò chuyện", messages: [] }),
      messages: [...(current?.messages || []), message],
    }));
    setText("");
  };

  const removeMessage = async (messageId) => {
    try {
      await deleteMessage(messageId);
      setConversation((current) => ({
        ...current,
        messages: (current?.messages || []).filter((message) => message.id !== messageId),
      }));
    } catch (error) {
      setStatus(error.message || "Không thể xóa tin nhắn.");
    }
  };

  return (
    <Screen style={demoStyles.screen}>
      <ScrollView contentContainerStyle={demoStyles.scrollContent}>
        <View style={demoStyles.header}>
          <Text style={demoStyles.title}>{conversation?.title || "Tin nhắn"}</Text>
          <Text style={demoStyles.subtitle}>HTTP chat flow; gửi mới tạm thời local cho đến khi API gửi tin nhắn được xác nhận.</Text>
        </View>

        {status ? <Text style={demoStyles.cardText}>{status}</Text> : null}
        {(conversation?.messages || []).map((message) => (
          <View key={message.id} style={demoStyles.card}>
            <Text style={demoStyles.cardTitle}>{message.sender}</Text>
            <Text style={demoStyles.cardText}>{message.text}</Text>
            <Text style={demoStyles.statLabel}>{new Date(message.createdAt).toLocaleString("vi-VN")}</Text>
            <Text style={demoStyles.cardText} onPress={() => removeMessage(message.id)}>Xóa tin nhắn</Text>
          </View>
        ))}

        <View style={demoStyles.card}>
          <AppInput placeholder="Nhập tin nhắn..." value={text} onChangeText={setText} />
          <AppButton title="Gửi local" onPress={send} />
        </View>
      </ScrollView>
    </Screen>
  );
}
