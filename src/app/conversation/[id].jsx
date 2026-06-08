import UserAvatar from "@/components/courses/UserAvatar";
import ChatThumbUpIcon from "@/components/icons/ChatThumbUpIcon";
import CommentReactionPicker from "@/components/post/CommentReactionPicker";
import colors from "@/constants/colors";
import {
  getConversation,
  sendMessage,
} from "@/repositories/conversationRepository";
import { getCurrentSession } from "@/repositories/source";
import { getUserInfo } from "@/repositories/userRepository";
import conversationDetailStyles from "@/styles/conversation/conversationDetail.styles";
import { redirectIfSessionExpired } from "@/utils/screenErrors";
import { Ionicons } from "@expo/vector-icons";
import Foundation from "@expo/vector-icons/Foundation";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Constants ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;
const JUMP_COUNT = 500;
const AVATAR_SIZE = 28;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isSameDay(a, b) {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

function formatDelimiterDate(isoString) {
  const d = new Date(isoString);
  const days = ["CN", "T.2", "T.3", "T.4", "T.5", "T.6", "T.7"];
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${days[d.getDay()]} LÚC ${hh}:${mm}`;
}

function getMessageStatusText(isoString, isTemp) {
  if (isTemp) {
    return "Đang gửi";
  }
  const createdDate = new Date(isoString);
  const now = new Date();
  const diffMs = now - createdDate;

  if (diffMs < 60000) {
    return "Đã gửi";
  }

  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) {
    return `Đã gửi ${diffMins} phút trước`;
  }

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    return `Đã gửi ${diffHours} giờ trước`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `Đã gửi ${diffDays} ngày trước`;
  }

  // Format: "Đã gửi 17 tháng 5, 22:46"
  const dateNum = createdDate.getDate();
  const monthNum = createdDate.getMonth() + 1;
  const hoursStr = String(createdDate.getHours()).padStart(2, "0");
  const minsStr = String(createdDate.getMinutes()).padStart(2, "0");

  return `Đã gửi ${dateNum} tháng ${monthNum}, ${hoursStr}:${minsStr}`;
}

// Build a flat item array from messages for FlatList
// Items: { type: 'date', id, date } | { type: 'message', id, msg, position, isGroupEnd, isGroupStart }
function buildItems(messages) {
  if (!messages?.length) return [];

  // 1. Group consecutive same-sender messages
  const groups = [];
  let i = 0;
  while (i < messages.length) {
    const sid = messages[i].sender.id;
    let j = i;
    while (j < messages.length && messages[j].sender.id === sid) j++;
    groups.push(messages.slice(i, j));
    i = j;
  }

  // 2. Flatten with date delimiters and position tags
  const items = [];
  let prevDate = null;

  for (let gi = 0; gi < groups.length; gi++) {
    const group = groups[gi];
    for (let k = 0; k < group.length; k++) {
      const msg = group[k];

      // Date delimiter at day boundary
      if (!prevDate || !isSameDay(prevDate, msg.created)) {
        items.push({
          type: "date",
          id: `date-${msg.id}`,
          date: formatDelimiterDate(msg.created),
        });
      }
      prevDate = msg.created;

      let position;
      if (group.length === 1) position = "single";
      else if (k === 0) position = "top";
      else if (k === group.length - 1) position = "bottom";
      else position = "middle";

      items.push({
        type: "message",
        id: msg.id,
        msg,
        position,
        isGroupEnd: k === group.length - 1,
        isGroupStart: k === 0 && gi > 0,
      });
    }
  }

  return items;
}

// ─── Bubble border-radius by position ────────────────────────────────────────

const R = 20; // full corner
const r = 4; // squeezed corner (adjacent to group sibling)

function getBubbleRadius(isMe, position) {
  if (isMe) {
    // Right side — group edge is on the RIGHT
    switch (position) {
      case "top":
        return {
          borderTopLeftRadius: R,
          borderTopRightRadius: R,
          borderBottomRightRadius: r,
          borderBottomLeftRadius: R,
        };
      case "middle":
        return {
          borderTopLeftRadius: R,
          borderTopRightRadius: r,
          borderBottomRightRadius: r,
          borderBottomLeftRadius: R,
        };
      case "bottom":
        return {
          borderTopLeftRadius: R,
          borderTopRightRadius: r,
          borderBottomRightRadius: R,
          borderBottomLeftRadius: R,
        };
      default: // single
        return { borderRadius: R };
    }
  } else {
    // Left side — group edge is on the LEFT
    switch (position) {
      case "top":
        return {
          borderTopLeftRadius: R,
          borderTopRightRadius: R,
          borderBottomRightRadius: R,
          borderBottomLeftRadius: r,
        };
      case "middle":
        return {
          borderTopLeftRadius: r,
          borderTopRightRadius: R,
          borderBottomRightRadius: R,
          borderBottomLeftRadius: r,
        };
      case "bottom":
        return {
          borderTopLeftRadius: r,
          borderTopRightRadius: R,
          borderBottomRightRadius: R,
          borderBottomLeftRadius: R,
        };
      default: // single
        return { borderRadius: R };
    }
  }
}

// ─── Message bubble component ─────────────────────────────────────────────────

function MessageItem({ item, myId, isLatestFromMe }) {
  const { msg, position, isGroupEnd, isGroupStart } = item;
  const isMe = msg.sender.id === myId;
  const isThumb = msg.message === "👍";
  const radiusStyle = isThumb ? {} : getBubbleRadius(isMe, position);

  useEffect(() => {
    if (!isMe) return;
    const isTemp = msg.id.toString().startsWith("tmp-");
    if (isTemp) return;

    const createdDate = new Date(msg.created);
    const diffMs = Date.now() - createdDate;
    if (diffMs >= 7 * 24 * 60 * 60 * 1000) {
      return;
    }
  }, [isMe, msg.created, msg.id]);

  const topGap = isGroupStart ? 10 : 2;

  if (isMe) {
    const isTemp = msg.id.toString().startsWith("tmp-");
    const statusText = getMessageStatusText(msg.created, isTemp);

    return (
      <View style={[conversationDetailStyles.rowRight, { marginTop: topGap }]}>
        {isThumb ? (
          <ChatThumbUpIcon size={34} color={colors.primary} />
        ) : (
          <View style={[conversationDetailStyles.bubbleRight, radiusStyle]}>
            <Text style={conversationDetailStyles.bubbleTextRight}>
              {msg.message}
            </Text>
          </View>
        )}
        {isLatestFromMe && (
          <Text style={conversationDetailStyles.statusSubText}>
            {statusText}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={[conversationDetailStyles.rowLeft, { marginTop: topGap }]}>
      {/* Avatar or invisible spacer */}
      <View style={conversationDetailStyles.avatarSlot}>
        {isGroupEnd ? (
          <UserAvatar uri={msg.sender.avatar} size={AVATAR_SIZE} />
        ) : (
          <View style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }} />
        )}
      </View>
      {isThumb ? (
        <ChatThumbUpIcon size={34} color={colors.primary} />
      ) : (
        <View style={[conversationDetailStyles.bubbleLeft, radiusStyle]}>
          <Text style={conversationDetailStyles.bubbleTextLeft}>
            {msg.message}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

function EmptyConversationIntro({ partner, onOpenProfile }) {
  return (
    <View style={conversationDetailStyles.emptyConversationIntro}>
      <UserAvatar uri={partner?.avatar} size={92} name={partner?.username} />

      <Text numberOfLines={1} style={conversationDetailStyles.emptyPartnerName}>
        {partner?.username || "Người dùng"}
      </Text>

      {partner?.id ? (
        <Text
          numberOfLines={1}
          style={conversationDetailStyles.emptyPartnerMeta}
        >
          @{partner?.username || "user"} · {partner?.role || "Người dùng"}
        </Text>
      ) : null}

      <Text style={conversationDetailStyles.emptyPartnerDescription}>
        Hai bạn chưa có tin nhắn nào. Hãy gửi lời chào để bắt đầu cuộc trò
        chuyện.
      </Text>

      <Pressable
        onPress={onOpenProfile}
        style={conversationDetailStyles.viewProfileButton}
      >
        <Text style={conversationDetailStyles.viewProfileText}>
          Xem trang cá nhân
        </Text>
      </Pressable>
    </View>
  );
}

export default function ConversationDetailScreen() {
  const params = useLocalSearchParams();
  const routeId = typeof params.id === "string" ? params.id : "";
  const partnerId = typeof params.partnerId === "string" ? params.partnerId : "";
  const partnerName =
    typeof params.partnerName === "string" ? params.partnerName : "";
  const partnerAvatar =
    typeof params.partnerAvatar === "string" ? params.partnerAvatar : "";
  const isPartnerMode = params.mode === "partner" || Boolean(partnerId);

  const [conversation, setConversation] = useState(null);
  const [mySession, setMySession] = useState(null);
  const [inputText, setInputText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showJumpButton, setShowJumpButton] = useState(false);
  const [totalLoaded, setTotalLoaded] = useState(0);
  const [hasLatest, setHasLatest] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const flatListRef = useRef(null);
  const isAtBottomRef = useRef(false);
  const [layoutHeight, setLayoutHeight] = useState(0);

  const load = useCallback(() => {
    const init = async () => {
      try {
        const session = await getCurrentSession();
        setMySession(session);

        if (isPartnerMode) {
          try {
            const data = await getConversation(
              {
                partnerId,
                partner: {
                  id: partnerId,
                  username: partnerName || "Người dùng",
                  avatar: partnerAvatar || "",
                },
              },
              0,
              PAGE_SIZE,
            );

            setConversation(data);
            setTotalLoaded(data.messages.length);
            setHasLatest(data.messages.length < PAGE_SIZE);
            return;
          } catch (_error) {
            const profile = await getUserInfo(partnerId);

            setConversation({
              id: "",
              partner: {
                id: partnerId,
                username:
                  profile.username ||
                  profile.displayName ||
                  partnerName ||
                  "Người dùng",
                avatar: profile.avatar || partnerAvatar || "",
                description: profile.description || "",
                role: profile.role || "",
              },
              isBlocked: "0",
              messages: [],
            });

            setTotalLoaded(0);
            setHasLatest(true);
            return;
          }
        }

        const data = await getConversation(routeId, 0, PAGE_SIZE);
        setConversation(data);
        setTotalLoaded(data.messages.length);

        if (data.messages.length < PAGE_SIZE) {
          setHasLatest(true);
        }
      } catch (error) {
        if (await redirectIfSessionExpired(error, router)) return;
      }
    };
    init();
  }, [routeId, partnerId, isPartnerMode, partnerName, partnerAvatar]);

  useFocusEffect(load);

  // ── Load more (newer messages, scroll down) ──────────────────────────────

  const loadMore = async () => {
    if (hasLatest || isLoadingMore || !conversation) return;
    setIsLoadingMore(true);
    try {
      const data = await getConversation(
        conversation?.id || routeId,
        totalLoaded,
        PAGE_SIZE,
      );
      const newMsgs = data.messages;
      if (newMsgs.length > 0) {
        setConversation((prev) => ({
          ...prev,
          messages: [...prev.messages, ...newMsgs],
        }));
        const next = totalLoaded + newMsgs.length;
        setTotalLoaded(next);
        if (newMsgs.length < PAGE_SIZE) {
          setHasLatest(true);
          setShowJumpButton(false);
        }
      } else {
        setHasLatest(true);
        setShowJumpButton(false);
      }
    } catch (error) {
      if (await redirectIfSessionExpired(error, router)) return;
    } finally {
      setIsLoadingMore(false);
    }
  };

  // ── Jump to latest ───────────────────────────────────────────────────────

  const jumpToLatest = async () => {
    try {
      const data = await getConversation(
        conversation?.id || routeId,
        0,
        JUMP_COUNT,
      );
      setConversation(data);
      setTotalLoaded(data.messages.length);
      setHasLatest(true);
      setShowJumpButton(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 80);
    } catch (error) {
      if (await redirectIfSessionExpired(error, router)) return;
    }
  };

  // ── Scroll tracking ──────────────────────────────────────────────────────

  const handleScroll = (e) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const isAtBottom =
      contentOffset.y + layoutMeasurement.height >= contentSize.height - 80;
    isAtBottomRef.current = isAtBottom;

    if (hasLatest) {
      setShowJumpButton(!isAtBottom);
    } else {
      // There are still newer messages not loaded → always show
      setShowJumpButton(true);
    }
  };

  const handleLayout = (e) => {
    setLayoutHeight(e.nativeEvent.layout.height);
  };

  const handleContentSizeChange = (contentWidth, contentHeight) => {
    if (layoutHeight && contentHeight > layoutHeight) {
      if (!isAtBottomRef.current) {
        setShowJumpButton(true);
      }
    } else {
      setShowJumpButton(false);
    }
  };

  // ── Send ──────────────────────────────────────────────────────────────────

  const handleSend = async (text) => {
    const trimmed = (text || inputText).trim();
    if (!trimmed || isSending || !conversation || !mySession) return;

    setInputText("");
    setIsSending(true);
    setShowEmojiPicker(false);

    const tempId = `tmp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      sender: {
        id: mySession.id,
        username: mySession.username,
        avatar: mySession.avatar,
      },
      message: trimmed,
      created: new Date().toISOString(),
    };

    setConversation((prev) => ({
      ...prev,
      messages: [...prev.messages, optimistic],
    }));
    setTotalLoaded((n) => n + 1);

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);

    try {
      const targetConversationId = conversation?.id || "";
      const targetPartnerId = partnerId || conversation?.partner?.id || "";

      const saved = await sendMessage(
        targetConversationId,
        targetPartnerId,
        trimmed,
      );
      setConversation((prev) => ({
        ...prev,
        messages: prev.messages.map((m) => (m.id === tempId ? saved : m)),
      }));

      if (!conversation?.id && saved.conversationId) {
        setConversation((prev) => ({
          ...prev,
          id: saved.conversationId,
        }));

        router.replace({
          pathname: "/conversation/[id]",
          params: { id: saved.conversationId },
        });
      }
    } catch (error) {
      // Rollback
      setConversation((prev) => ({
        ...prev,
        messages: prev.messages.filter((m) => m.id !== tempId),
      }));
      setTotalLoaded((n) => n - 1);
      if (await redirectIfSessionExpired(error, router)) return;
    } finally {
      setIsSending(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const items = buildItems(conversation?.messages);
  const myId = mySession?.id;
  const hasText = inputText.trim().length > 0;

  const messages = conversation?.messages || [];
  const latestMessage = messages[messages.length - 1];
  const isLatestFromMe = latestMessage && latestMessage.sender.id === myId;
  const latestMessageId = latestMessage?.id;

  const renderItem = ({ item }) => {
    if (item.type === "date") {
      return (
        <View style={conversationDetailStyles.dateRow}>
          <Text style={conversationDetailStyles.dateText}>{item.date}</Text>
        </View>
      );
    }
    return (
      <MessageItem
        item={item}
        myId={myId}
        isLatestFromMe={isLatestFromMe && item.id === latestMessageId}
      />
    );
  };

  const handleOpenProfile = useCallback(() => {
    const userId = String(conversation?.partner?.id || partnerId || "").trim();

    if (!userId) return;

    router.push({
      pathname: "/profile/[userId]",
      params: { userId },
    });
  }, [conversation?.partner?.id, partnerId]);

  return (
    <SafeAreaView style={conversationDetailStyles.safe} edges={["top", "bottom"]}>
      {/* ── Header ── */}
      <View style={conversationDetailStyles.header}>
        <View style={conversationDetailStyles.headerLeft}>
          <Pressable
            style={conversationDetailStyles.iconBtn}
            onPress={() => router.back()}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </Pressable>
          <UserAvatar uri={conversation?.partner?.avatar} size={40} />
          <Text style={conversationDetailStyles.partnerName} numberOfLines={1}>
            {conversation?.partner?.username ?? ""}
          </Text>
        </View>
        <View style={conversationDetailStyles.headerRight}>
          <Pressable style={conversationDetailStyles.iconBtn} hitSlop={8}>
            <Ionicons name="call" size={22} color={colors.primary} />
          </Pressable>
          <Pressable style={conversationDetailStyles.iconBtn} hitSlop={8}>
            <Ionicons name="videocam" size={22} color={colors.primary} />
          </Pressable>
          <Pressable style={conversationDetailStyles.iconBtn} hitSlop={8}>
            <Foundation name="info" size={24} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView
        style={conversationDetailStyles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* ── Message list ── */}
        <View style={conversationDetailStyles.flex}>
          <FlatList
            ref={flatListRef}
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={conversationDetailStyles.listContent}
            onEndReached={loadMore}
            onEndReachedThreshold={0.1}
            onScroll={handleScroll}
            scrollEventThrottle={100}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              conversation ? (
                <EmptyConversationIntro
                  partner={conversation.partner}
                  onOpenProfile={handleOpenProfile}
                />
              ) : null
            }
            onScrollBeginDrag={() => {
              setShowEmojiPicker(false);
              Keyboard.dismiss();
            }}
            onLayout={handleLayout}
            onContentSizeChange={handleContentSizeChange}
          />

          {/* ── Jump to latest FAB ── */}
          {showJumpButton && (
            <View
              style={conversationDetailStyles.jumpContainer}
              pointerEvents="box-none"
            >
              <Pressable
                style={conversationDetailStyles.jumpBtn}
                onPress={jumpToLatest}
              >
                <Ionicons name="arrow-down" size={20} color={colors.text} />
              </Pressable>
            </View>
          )}
        </View>

        {/* ── Input bar ── */}
        <View style={conversationDetailStyles.composer}>
          <Pressable
            style={conversationDetailStyles.composerIconButton}
            hitSlop={8}
          >
            <Ionicons name="add" size={28} color="#1877F2" />
          </Pressable>

          <Pressable
            style={conversationDetailStyles.composerIconButton}
            hitSlop={8}
          >
            <Ionicons name="camera" size={24} color="#1877F2" />
          </Pressable>

          <View style={conversationDetailStyles.composerInputWrap}>
            <TextInput
              style={conversationDetailStyles.composerInput}
              placeholder="Aa"
              placeholderTextColor="#8A8D91"
              value={inputText}
              onChangeText={setInputText}
              multiline
              returnKeyType="send"
              onSubmitEditing={() => handleSend(inputText)}
            />

            {/* Emoji button + picker */}
            <View>
              <Pressable
                style={conversationDetailStyles.emojiButton}
                onPress={() => setShowEmojiPicker((v) => !v)}
                hitSlop={8}
              >
                <Ionicons name="happy" size={22} color="#1877F2" />
              </Pressable>
              {showEmojiPicker && (
                <CommentReactionPicker
                  onSelectReaction={(emoji) => {
                    setInputText((prev) => prev + emoji);
                    setShowEmojiPicker(false);
                  }}
                />
              )}
            </View>
          </View>

          <Pressable
            style={conversationDetailStyles.likeButton}
            onPress={() => handleSend(hasText ? inputText : "\uD83D\uDC4D")}
            disabled={isSending}
            hitSlop={8}
          >
            <Ionicons
              name={hasText ? "send" : "thumbs-up"}
              size={hasText ? 22 : 24}
              color={isSending ? colors.disabled : "#1877F2"}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
