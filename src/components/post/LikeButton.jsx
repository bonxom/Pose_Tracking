import AppButton from "@/components/common/AppButton";
import postStyles from "@/styles/post.styles";

export default function LikeButton({ isLiked, likeCount, onPress }) {
  return (
    <AppButton
      title={`${isLiked ? "Đã thích" : "Thích"} • ${likeCount}`}
      onPress={onPress}
      style={[
        postStyles.actionButton,
        postStyles.secondaryButton,
        isLiked && postStyles.likeButtonActive,
      ]}
      textStyle={[
        postStyles.secondaryButtonText,
        isLiked && postStyles.likeButtonActiveText,
      ]}
    />
  );
}
