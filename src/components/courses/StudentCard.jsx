import coursesStyles from "@/styles/courses.styles";
import { Pressable, Text, View } from "react-native";
import UserAvatar from "./UserAvatar";

export default function StudentCard({
  item,
  actionStatus,
  onAccept,
  onReject,
}) {
  const { avatar, name, id } = item;

  const hasButton = onAccept && onReject;

  return (
    <Pressable
      style={coursesStyles.userCard}
      onPress={() => console.log("Student pressed:", id)}
    >
      <UserAvatar uri={avatar} name={name} />
      <View style={coursesStyles.cardBody}>
        <View style={coursesStyles.cardTopRow}>
          <Text style={coursesStyles.userName} numberOfLines={1}>
            {name}
          </Text>
        </View>
        {actionStatus === "accepted" ? (
          <Text style={coursesStyles.actionStatusText}>
            Đã chấp nhận yêu cầu
          </Text>
        ) : actionStatus === "rejected" ? (
          <Text style={coursesStyles.actionStatusText}>Đã từ chối yêu cầu</Text>
        ) : (
          hasButton && (
            <View style={coursesStyles.cardButtons}>
              <Pressable
                style={coursesStyles.btnAccept}
                onPress={() => onAccept(id, name)}
              >
                <Text style={coursesStyles.btnAcceptText}>Chấp nhận</Text>
              </Pressable>
              <Pressable
                style={coursesStyles.btnReject}
                onPress={() => onReject(id, name)}
              >
                <Text style={coursesStyles.btnRejectText}>Từ chối</Text>
              </Pressable>
            </View>
          )
        )}
      </View>
    </Pressable>
  );
}
