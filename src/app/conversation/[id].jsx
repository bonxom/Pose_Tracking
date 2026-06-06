import Screen from "@/components/common/Screen";
import {
  deleteMessage,
  getConversation,
  sendLocalMessage,
} from "@/repositories/conversationRepository";
import demoStyles from "@/styles/demo.styles";
import { redirectIfSessionExpired } from "@/utils/screenErrors";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";

export default function ConversationDetailScreen() {
  const params = useLocalSearchParams();
  const conversationId = typeof params.id === "string" ? params.id : "";
  const [conversation, setConversation] = useState(null);
  const [text, setText] = useState("");
  const [status, setStatus] = useState("");

  const load = useCallback(() => {
    const loadConversation = async () => {
      try {
        setConversation(await getConversation(conversationId));
      } catch (error) {
        if (await redirectIfSessionExpired(error, router)) return;
        setStatus(error.message);
      }
    };
    loadConversation();
  }, [conversationId]);

  useFocusEffect(load);

  const send = async () => {
    if (!text.trim()) return;

    const message = await sendLocalMessage(conversationId, text.trim());
    setConversation((current) => ({
      ...(current || {
        id: conversationId,
        title: "Cuộc trò chuyện",
        messages: [],
      }),
      messages: [...(current?.messages || []), message],
    }));
    setText("");
  };

  const removeMessage = async (messageId) => {
    try {
      await deleteMessage(messageId);
      setConversation((current) => ({
        ...current,
        messages: (current?.messages || []).filter(
          (message) => message.messageId !== messageId,
        ),
      }));
    } catch (error) {
      if (await redirectIfSessionExpired(error, router)) return;
      setStatus(error.message || "Không thể xóa tin nhắn.");
    }
  };

  return (
    <Screen style={demoStyles.screen}>
      <ScrollView contentContainerStyle={demoStyles.scrollContent}>
        <View style={demoStyles.header}>
          <Text style={demoStyles.title}>
            {conversation?.title || "Tin nhắn"}
          </Text>
          <Text style={demoStyles.subtitle}>
            Danh sách, đọc và xóa tin nhắn dùng API server khi có session thật.
          </Text>
        </View>

        {status ? <Text style={demoStyles.cardText}>{status}</Text> : null}
        {(conversation?.messages || []).map((message) => (
          <View key={message.id} style={demoStyles.card}>
            <Text style={demoStyles.cardTitle}>{message.sender.username}</Text>
            <Text>{message.text}</Text>
            <Text style={demoStyles.statLabel}>
              {new Date(message.createdAt).toLocaleString("vi-VN")}
            </Text>
            <Text
              style={demoStyles.cardText}
              onPress={() => removeMessage(message.messageId)}
            >
              Xóa tin nhắn
            </Text>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}
