import coursesStyles from "@/styles/courses.styles";
import { Pressable, Text, View } from "react-native";
import UserAvatar from "./UserAvatar";

export default function StudentCard({
  item,
  actionStatus,
  onAccept,
  onReject,
  onPressCard,
  onPressBlock,
}) {
  const { avatar, name, id } = item;

  const hasButton = onAccept && onReject;

  return (
    <Pressable
      style={coursesStyles.userCard}
      onPress={() => onPressCard && onPressCard(id, name)}
    >
      <UserAvatar uri={avatar} />
      <View style={coursesStyles.cardBody}>
        <View style={coursesStyles.cardTopRow}>
          <Text
            style={
              hasButton ? coursesStyles.userName : coursesStyles.biggerUserName
            }
            numberOfLines={1}
          >
            {name}
          </Text>
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
            <Pressable onPress={() => onPressBlock && onPressBlock(id, name)}>
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
