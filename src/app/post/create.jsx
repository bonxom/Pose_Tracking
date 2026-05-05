import AppButton from "@/components/common/AppButton";
import AppInput from "@/components/common/AppInput";
import Screen from "@/components/common/Screen";
import { DEMO_COURSE, DEMO_EXERCISES, DEMO_VIDEO_PLACEHOLDERS } from "@/constants/demo";
import { createExerciseSubmission, createPost, getPostById } from "@/services/postStore";
import postStyles from "@/styles/post.styles";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";

export default function CreatePostScreen() {
  const params = useLocalSearchParams();
  const isSubmissionMode = params.mode === "submission";
  const [content, setContent] = useState("");
  const [sourcePost, setSourcePost] = useState(null);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const exercise = useMemo(() => {
    return (
      DEMO_EXERCISES.find((item) => item.id === params.exerciseId) ||
      DEMO_EXERCISES[0]
    );
  }, [params.exerciseId]);

  useEffect(() => {
    const loadSourcePost = async () => {
      if (!params.sourcePostId) return;
      const post = await getPostById(params.sourcePostId);
      setSourcePost(post);
    };

    loadSourcePost();
  }, [params.sourcePostId]);

  const addDemoVideo = (video) => {
    setSelectedVideos((current) => {
      if (current.some((item) => item.id === video.id)) {
        return current;
      }
      return [...current, video].slice(0, 2);
    });
  };

  const useBothDemoVideos = () => {
    setSelectedVideos(DEMO_VIDEO_PLACEHOLDERS);
  };

  const handleCreatePost = async () => {
    if (isSubmissionMode && selectedVideos.length < 2) {
      Alert.alert("Thiếu video", "Vui lòng dùng đủ 2 video demo trước khi nộp bài.");
      return;
    }

    if (!isSubmissionMode && !content.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập nội dung bài viết");
      return;
    }

    try {
      setIsSubmitting(true);
      const newPost = isSubmissionMode
        ? await createExerciseSubmission({
            content,
            videos: selectedVideos,
            courseId: params.courseId || DEMO_COURSE.id,
            exerciseId: params.exerciseId || exercise.id,
            sourcePostId: params.sourcePostId || sourcePost?.id || "",
          })
        : await createPost({
            content: content.trim(),
            videos: [],
          });

      if (newPost) {
        Alert.alert(
          "Thành công",
          isSubmissionMode ? "Bài nộp đã được chấm tự động." : "Bài viết đã được tạo",
        );
        router.replace(`/post/${newPost.id}`);
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
        <Text style={postStyles.title}>
          {isSubmissionMode ? "Nộp bài tập" : "Tạo bài viết mới"}
        </Text>
        <Text style={postStyles.subtitle}>
          {isSubmissionMode
            ? "Dùng 2 video demo để mô phỏng bài nộp và nhận kết quả chấm tự động."
            : "Chia sẻ suy nghĩ của bạn với cộng đồng"}
        </Text>

        {isSubmissionMode ? (
          <View style={postStyles.infoCard}>
            <Text style={postStyles.infoTitle}>{exercise.title}</Text>
            <Text style={postStyles.infoText}>{DEMO_COURSE.title}</Text>
            <Text style={postStyles.infoText}>
              {DEMO_COURSE.hashtag} {exercise.hashtag}
            </Text>
          </View>
        ) : null}

        <View style={postStyles.inputCard}>
          <Text style={postStyles.slotLabel}>
            {isSubmissionMode ? "Ghi chú bài nộp" : "Nội dung"}
          </Text>
          <AppInput
            placeholder={
              isSubmissionMode
                ? "Ví dụ: Em nộp bài với 2 góc quay theo hướng dẫn..."
                : "Viết nội dung bài viết của bạn..."
            }
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={6}
            style={postStyles.textArea}
          />
          <Text style={postStyles.slotHint}>{content.length} ký tự</Text>
        </View>

        {isSubmissionMode ? (
          <View style={postStyles.inputCard}>
            <Text style={postStyles.slotLabel}>Video bài nộp</Text>
            <View style={postStyles.mediaList}>
              {DEMO_VIDEO_PLACEHOLDERS.map((video) => {
                const selected = selectedVideos.some((item) => item.id === video.id);
                return (
                  <View
                    key={video.id}
                    style={[
                      postStyles.mediaCard,
                      selected && postStyles.selectedMediaCard,
                    ]}
                  >
                    <Text style={postStyles.mediaTitle}>{video.angle}</Text>
                    <Text style={postStyles.mediaSubtitle}>{video.name}</Text>
                    <Text style={postStyles.mediaSubtitle}>
                      {selected ? "Đã chọn cho demo" : "Chưa chọn"}
                    </Text>
                    <AppButton
                      title={selected ? "Đã dùng" : `Use demo video ${video.id.endsWith("left_video") ? "1" : "2"}`}
                      onPress={() => addDemoVideo(video)}
                      disabled={selected}
                      style={[postStyles.actionButton, postStyles.secondaryButton]}
                      textStyle={postStyles.secondaryButtonText}
                    />
                  </View>
                );
              })}
            </View>
            <AppButton title="Dùng đủ 2 video demo" onPress={useBothDemoVideos} />
            <Text style={postStyles.slotHint}>
              Đã chọn {selectedVideos.length}/2 video. Web demo không cần mở file picker.
            </Text>
          </View>
        ) : null}

        <AppButton
          title={
            isSubmitting
              ? "Đang xử lý..."
              : isSubmissionMode
                ? "Nộp bài và chấm demo"
                : "Đăng bài"
          }
          onPress={handleCreatePost}
          disabled={isSubmitting || (isSubmissionMode ? selectedVideos.length < 2 : !content.trim())}
        />

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
