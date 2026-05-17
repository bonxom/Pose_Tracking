import { Pressable, Text, View } from "react-native";
import coursesStyles from "@/styles/courses.styles";
import UserAvatar from "./UserAvatar";
import { getTimeAgo } from "@/utils/timeago";

export default function EnrollmentCard({ item, actionStatus, onAccept, onReject }) {
  const { avatar, user_name, created, id } = item.request;

  return (
    <Pressable
      style={coursesStyles.userCard}
      onPress={() => console.log("Card pressed:", id)}
    >
      <UserAvatar uri={avatar} name={user_name} />
      <View style={coursesStyles.cardBody}>
        <View style={coursesStyles.cardTopRow}>
          <Text style={coursesStyles.userName} numberOfLines={1}>
            {user_name}
          </Text>
          <Text style={coursesStyles.timeText}>{getTimeAgo(created)}</Text>
        </View>
        {actionStatus === "accepted" ? (
          <Text style={coursesStyles.actionStatusText}>
            Đã chấp nhận yêu cầu
          </Text>
        ) : actionStatus === "rejected" ? (
          <Text style={coursesStyles.actionStatusText}>Đã từ chối yêu cầu</Text>
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
