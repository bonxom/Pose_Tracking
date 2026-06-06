import coursesStyles from "@/styles/courses.styles";
import postStyles from "@/styles/post.styles";
import { resolveAvatarUri } from "@/utils/profile";
import { getTimeAgo } from "@/utils/timeago";
import { Image, Pressable, Text, View } from "react-native";

export default function EnrollmentCard({
  item,
  actionStatus,
  onAccept,
  onReject,
  onPressCard,
  onPressBlock,
}) {
  const { avatar, user_name, created, id } = item.request;
  const avatarUri = resolveAvatarUri(avatar || "");

  return (
    <Pressable
      style={coursesStyles.userCard}
      onPress={() => onPressCard && onPressCard(id, user_name)}
    >
      <Image source={{ uri: avatarUri }} style={postStyles.avatar} />
      <View style={coursesStyles.cardBody}>
        <View style={coursesStyles.cardTopRow}>
          <Text style={coursesStyles.userName} numberOfLines={1}>
            {user_name}
          </Text>
          <Text style={coursesStyles.timeText}>{getTimeAgo(created)}</Text>
        </View>
        {actionStatus === "accepted" ? (
          <View style={coursesStyles.actionStatusRow}>
            <Text style={coursesStyles.actionStatusText}>
              Đã chấp nhận yêu cầu
            </Text>
          </View>
        ) : actionStatus === "rejected" ? (
          <View style={coursesStyles.actionStatusRow}>
            <Text style={coursesStyles.actionStatusText}>
              Đã từ chối yêu cầu
            </Text>
            <Text> • </Text>
            <Pressable
              onPress={() => onPressBlock && onPressBlock(id, user_name)}
            >
              <Text style={coursesStyles.actionLink}>Chặn</Text>
            </Pressable>
          </View>
        ) : actionStatus === "blocked" ? (
          <View style={coursesStyles.actionStatusRow}>
            <Text style={coursesStyles.actionStatusText}>
              Đã từ chối yêu cầu và chặn
            </Text>
          </View>
        ) : (
          <View style={coursesStyles.cardButtons}>
            <Pressable
              style={coursesStyles.btnAccept}
              onPress={() => onAccept(id, user_name)}
            >
              <Text style={coursesStyles.btnAcceptText}>Chấp nhận</Text>
            </Pressable>
            <Pressable
              style={coursesStyles.btnReject}
              onPress={() => onReject(id, user_name)}
            >
              <Text style={coursesStyles.btnRejectText}>Từ chối</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Pressable>
  );
}
