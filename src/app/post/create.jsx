import AppButton from "@/components/common/AppButton";
import AppInput from "@/components/common/AppInput";
import Screen from "@/components/common/Screen";
import { createPost } from "@/services/postStore";
import postStyles from "@/styles/post.styles";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";

export default function CreatePostScreen() {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreatePost = async () => {
    if (!content.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập nội dung bài viết");
      return;
    }

    try {
      setIsSubmitting(true);
      const newPost = await createPost({
        content: content.trim(),
        videos: [],
      });

      if (newPost) {
        Alert.alert("Thành công", "Bài viết đã được tạo");
        router.back();
      }
    } catch (error) {
      console.warn("Failed to create post:", error);
      Alert.alert("Lỗi", "Không thể tạo bài viết. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen style={postStyles.screen}>
      <ScrollView
        contentContainerStyle={postStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={postStyles.title}>Tạo bài viết mới</Text>
        <Text style={postStyles.subtitle}>
          Chia sẻ suy nghĩ của bạn với cộng đồng
        </Text>

        <View style={postStyles.inputCard}>
          <Text style={postStyles.slotLabel}>Nội dung</Text>
          <AppInput
            placeholder="Viết nội dung bài viết của bạn..."
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={6}
            style={postStyles.textArea}
          />
          <Text style={postStyles.slotHint}>
            {content.length} ký tự
          </Text>
        </View>

        <View style={{ height: 16 }} />

        <AppButton
          title={isSubmitting ? "Đang tạo..." : "Đăng bài"}
          onPress={handleCreatePost}
          disabled={isSubmitting || !content.trim()}
        />

        <View style={{ height: 12 }} />

        <AppButton
          title="Hủy"
          onPress={() => router.back()}
          style={[postStyles.actionButton, postStyles.secondaryButton]}
          textStyle={postStyles.secondaryButtonText}
        />
      </ScrollView>
    </Screen>
  );
}