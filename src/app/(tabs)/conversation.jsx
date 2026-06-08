import IconButton from "@/components/common/IconButton";
import Screen from "@/components/common/Screen";
import SearchInput from "@/components/common/SearchInput";
import UserAvatar from "@/components/courses/UserAvatar";
import CameraIcon from "@/components/icons/CameraIcon";
import EditIcon from "@/components/icons/EditIcon";
import TrashIcon from "@/components/icons/TrashIcon";
import ModalBottomMenu from "@/components/modals/ModalBottomMenu";
import ModalConfirm from "@/components/modals/ModalConfirm";
import colors from "@/constants/colors";
import {
  deleteConversation,
  getConversationList,
  markConversationRead,
  subscribeConversations,
} from "@/repositories/conversationRepository";
import { getCurrentSession } from "@/repositories/source";
import conversationStyles from "@/styles/conversation/conversation.styles";
import { resolveAvatarUri } from "@/utils/profile";
import { redirectIfSessionExpired } from "@/utils/screenErrors";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";

function formatMessageTime(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  const now = new Date();

  const isSameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  if (isSameDay) {
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  const diffTime = Math.abs(now - d);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    return "Hôm qua";
  }

  if (diffDays < 7) {
    const weekdays = ["CN", "Th 2", "Th 3", "Th 4", "Th 5", "Th 6", "Th 7"];
    return weekdays[d.getDay()];
  }

  if (d.getFullYear() !== now.getFullYear()) {
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  }

  return `${d.getDate()} thg ${d.getMonth() + 1}`;
}

export default function ConversationsScreen() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal states
  const [selectedItem, setSelectedItem] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Subscribe to conversations cache and badge updates
  useEffect(() => {
    const unsubscribe = subscribeConversations((cache) => {
      setItems(cache.messages || []);
    });
    return unsubscribe;
  }, []);

  const load = useCallback(async () => {
    try {
      await getConversationList();
    } catch (err) {
      if (await redirectIfSessionExpired(err, router)) return;
      setError(err.message);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    getCurrentSession()
      .then(setCurrentUser)
      .catch(() => {});
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await getConversationList();
      setError("");
    } catch (err) {
      if (await redirectIfSessionExpired(err, router)) return;
      setError(err.message || "Không thể tải dữ liệu.");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const handleOpenCamera = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Cần quyền camera",
        "Vui lòng cấp quyền camera để sử dụng tính năng này.",
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (result.canceled) {
      return;
    }

    console.log("CONVERSATION_CAMERA_RESULT", result.assets?.[0]);
  }, []);

  const handleOpenNewConversation = useCallback(() => {
    router.push("/conversation/new");
  }, []);

  const open = (item) => {
    const conversationId = String(item?.id || "").trim();

    if (!conversationId) {
      return;
    }

    markConversationRead(conversationId).catch(async (err) => {
      if (await redirectIfSessionExpired(err, router)) return;
      console.warn("Failed to mark conversation read:", err?.message);
    });

    router.push(`/conversation/${conversationId}`);
  };

  const remove = async (item) => {
    try {
      await deleteConversation(item.id);
    } catch (err) {
      if (await redirectIfSessionExpired(err, router)) return;
      setError(err.message || "Không thể xóa cuộc trò chuyện.");
    }
  };

  const filteredItems = useMemo(() => {
    const query = searchKeyword.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) => {
      const username = String(item?.partner?.username || "").toLowerCase();
      const lastMsg = String(item?.lastmessage?.message || "").toLowerCase();
      return username.includes(query) || lastMsg.includes(query);
    });
  }, [items, searchKeyword]);

  const handleLongPress = (item) => {
    setSelectedItem(item);
    setMenuVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedItem) return;
    setIsDeleting(true);
    await remove(selectedItem);
    setIsDeleting(false);
    setConfirmVisible(false);
    setSelectedItem(null);
  };

  const menuButtons = useMemo(() => {
    return [
      {
        title: "Xóa",
        icon: <TrashIcon color="#ef4444" size={24} />,
        color: "#ef4444",
        onPress: () => {
          setConfirmVisible(true);
        },
      },
    ];
  }, []);

  const renderItem = ({ item }) => {
    const isUnread = item.lastmessage.unread === "1";
    const partnerAvatarUri = resolveAvatarUri(item.partner.avatar);
    const formattedTime = formatMessageTime(item.lastmessage.created);

    return (
      <Pressable
        onPress={() => open(item)}
        onLongPress={() => handleLongPress(item)}
        style={({ pressed }) => [
          conversationStyles.itemContainer,
          pressed && { backgroundColor: "#f3f4f6" },
        ]}
      >
        <UserAvatar uri={partnerAvatarUri} size={62} />
        <View style={conversationStyles.contentWrapper}>
          <View style={conversationStyles.textContainer}>
            <Text style={conversationStyles.partnerName} numberOfLines={1}>
              {item.partner.username}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text
                style={[
                  isUnread
                    ? conversationStyles.messageTextUnread
                    : conversationStyles.messageTextRead,
                  { flexShrink: 1 },
                ]}
                numberOfLines={1}
              >
                {item.lastmessage.message}
              </Text>
              <Text style={conversationStyles.timeText}>
                {" "}
                · {formattedTime}
              </Text>
            </View>
          </View>
          {isUnread && <View style={conversationStyles.unreadDot} />}
        </View>
      </Pressable>
    );
  };

  return (
    <Screen>
      {/* Header matching iOS sketch style */}
      <View style={conversationStyles.header}>
        <View style={conversationStyles.headerLeft}>
          <UserAvatar uri={currentUser?.avatar} />
          <Text style={conversationStyles.headerTitle}>Chat</Text>
        </View>
        <View style={conversationStyles.headerRight}>
          <IconButton
            icon={<CameraIcon color={colors.text} size={22} />}
            onPress={handleOpenCamera}
          />
          <IconButton
            icon={<EditIcon color={colors.text} size={22} />}
            onPress={handleOpenNewConversation}
          />
        </View>
      </View>

      {/* Search Input */}
      <SearchInput
        value={searchKeyword}
        onChangeText={setSearchKeyword}
        placeholder="Tìm kiếm"
        onClear={() => setSearchKeyword("")}
        autoFocus={false}
      />

      {error && <Text style={conversationStyles.errorText}>{error}</Text>}

      {/* Conversations List with Pull to Refresh */}
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={conversationStyles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={conversationStyles.emptyContainer}>
            <Text style={conversationStyles.emptyText}>
              Chưa có cuộc trò chuyện nào.
            </Text>
          </View>
        }
      />

      {/* Bottom Option Sheet on Long Press */}
      <ModalBottomMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        buttons={menuButtons}
      />

      {/* Deletion Confirmation Alert */}
      <ModalConfirm
        visible={confirmVisible}
        title="Xóa cuộc trò chuyện"
        message={`Bạn có chắc chắn muốn xóa cuộc trò chuyện với ${selectedItem?.partner?.username || "người dùng này"}?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmVisible(false)}
        isProcessing={isDeleting}
        confirmText="Xóa"
        cancelText="Hủy"
      />
    </Screen>
  );
}
