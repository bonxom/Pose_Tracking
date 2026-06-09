import AppInput from "@/components/common/AppInput";
import SendIcon from "@/components/icons/SendIcon";
import SmileIcon from "@/components/icons/SmileIcon";
import CommentReactionPicker from "@/components/post/CommentReactionPicker";
import { COMMENT_MAX_LENGTH } from "@/components/post/commentThreadUtils";
import colors from "@/constants/colors";
import { useAuthSession } from "@/hooks/useAuthSession";
import postStyles from "@/styles/post.styles";
import commentOverlayStyles from "@/styles/post/comment-overlay.styles";
import { resolveAvatarUri } from "@/utils/profile";
import { Image } from "expo-image";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

const COMMENT_INPUT_MIN_HEIGHT = 48;
const COMMENT_INPUT_MAX_HEIGHT = 132;
const COMMENT_INPUT_VERTICAL_PADDING = 0;
const COMPOSER_ICON_COLOR = colors.subtext;

export default function CommentComposer({
  inputRef,
  value,
  onChangeText,
  onSubmit,
  isSubmitting = false,
  disabled = false,
  disabledText = "Bài viết này hiện không thể bình luận.",
  autoFocus = false,
  onFocus,
  containerStyle,
  inputContainerStyle,
  showCharacterCount = true,
}) {
  const { session: currentUser } = useAuthSession();
  const [commentInputHeight, setCommentInputHeight] = useState(
    COMMENT_INPUT_MIN_HEIGHT,
  );
  const [isReactionPickerVisible, setIsReactionPickerVisible] = useState(false);

  const composerAvatarUri = useMemo(
    () =>
      resolveAvatarUri(
        (typeof currentUser?.avatar === "string" && currentUser.avatar.trim()) ||
          (typeof currentUser?.user?.avatar === "string" &&
            currentUser.user.avatar.trim()) ||
          "",
        currentUser?.avatarVersion ||
          currentUser?.profileSyncRequestedAt ||
          currentUser?.loggedInAt ||
          "",
      ),
    [
      currentUser?.avatar,
      currentUser?.avatarVersion,
      currentUser?.loggedInAt,
      currentUser?.profileSyncRequestedAt,
      currentUser?.user?.avatar,
    ],
  );

  const handleToggleReactionPicker = () => {
    setIsReactionPickerVisible((current) => !current);
  };

  const handleSelectReaction = (reaction) => {
    onChangeText?.(value?.trim()?.length ? `${value} ${reaction}` : reaction);
    inputRef?.current?.focus();
  };

  if (disabled) {
    return (
      <View style={[styles.composer, containerStyle]}>
        <Text style={postStyles.subtitle}>{disabledText}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.composer, containerStyle]}>
      {isReactionPickerVisible ? (
        <CommentReactionPicker onSelectReaction={handleSelectReaction} />
      ) : null}

      <View style={styles.composerRow}>
        <View style={styles.composerAvatar}>
          <Image
            source={{ uri: composerAvatarUri }}
            style={localStyles.composerAvatarImage}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={150}
          />
        </View>

        <AppInput
          ref={inputRef}
          autoFocus={autoFocus}
          placeholder="Viết bình luận..."
          value={value}
          onChangeText={onChangeText}
          onFocus={() => {
            setIsReactionPickerVisible(false);
            onFocus?.();
          }}
          multiline
          numberOfLines={1}
          scrollEnabled={commentInputHeight >= COMMENT_INPUT_MAX_HEIGHT}
          onContentSizeChange={(event) => {
            const nextHeight = Math.min(
              COMMENT_INPUT_MAX_HEIGHT,
              Math.max(
                COMMENT_INPUT_MIN_HEIGHT,
                (event.nativeEvent.contentSize?.height || 0) +
                  COMMENT_INPUT_VERTICAL_PADDING,
              ),
            );
            setCommentInputHeight(nextHeight);
          }}
          containerStyle={[styles.commentInputWrap, inputContainerStyle]}
          style={[styles.commentInput, { height: commentInputHeight }]}
        />

        <Pressable
          onPress={handleToggleReactionPicker}
          style={({ pressed }) => [
            styles.iconButton,
            isReactionPickerVisible && styles.iconButtonActive,
            pressed && styles.iconButtonPressed,
          ]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Chọn cảm xúc"
        >
          <SmileIcon />
        </Pressable>

        <Pressable
          onPress={onSubmit}
          disabled={isSubmitting || !value?.trim()}
          style={({ pressed }) => [
            styles.sendButton,
            (isSubmitting || !value?.trim()) && styles.sendButtonDisabled,
            pressed &&
              !(isSubmitting || !value?.trim()) &&
              styles.sendButtonPressed,
          ]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Gửi bình luận"
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={COMPOSER_ICON_COLOR} />
          ) : (
            <View style={styles.sendIconRotate}>
              <SendIcon size={18} color={COMPOSER_ICON_COLOR} />
            </View>
          )}
        </Pressable>
      </View>

      {showCharacterCount ? (
        <Text style={postStyles.slotHint}>
          {value?.length || 0}/{COMMENT_MAX_LENGTH} ký tự
        </Text>
      ) : null}
    </View>
  );
}

const styles = commentOverlayStyles;

const localStyles = StyleSheet.create({
  composerAvatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
  },
});
