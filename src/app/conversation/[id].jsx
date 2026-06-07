import UserAvatar from "@/components/courses/UserAvatar";
import ChatSendIcon from "@/components/icons/ChatSendIcon";
import ChatThumbUpIcon from "@/components/icons/ChatThumbUpIcon";
import CommentReactionPicker from "@/components/post/CommentReactionPicker";
import colors from "@/constants/colors";
import {
  getConversation,
  sendMessage,
} from "@/repositories/conversationRepository";
import { getCurrentSession } from "@/repositories/source";
import conversationDetailStyles from "@/styles/conversation/conversationDetail.styles";
import { redirectIfSessionExpired } from "@/utils/screenErrors";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useRef, useState } from "react";
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

function MessageItem({ item, myId }) {
  const { msg, position, isGroupEnd, isGroupStart } = item;
  const isMe = msg.sender.id === myId;
  const isThumb = msg.message === "👍";
  const radiusStyle = isThumb ? {} : getBubbleRadius(isMe, position);

  const topGap = isGroupStart ? 10 : 2;

  if (isMe) {
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

export default function ConversationDetailScreen() {
  const params = useLocalSearchParams();
  const conversationId = typeof params.id === "string" ? params.id : "";

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

  const load = useCallback(() => {
    const init = async () => {
      try {
        const [session, data] = await Promise.all([
          getCurrentSession(),
          getConversation(conversationId, 0, PAGE_SIZE),
        ]);
        setMySession(session);
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
  }, [conversationId]);

  useFocusEffect(load);

  // ── Load more (newer messages, scroll down) ──────────────────────────────

  const loadMore = async () => {
    if (hasLatest || isLoadingMore || !conversation) return;
    setIsLoadingMore(true);
    try {
      const data = await getConversation(
        conversationId,
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
      const data = await getConversation(conversationId, 0, JUMP_COUNT);
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

    if (hasLatest) {
      setShowJumpButton(!isAtBottom);
    } else {
      // There are still newer messages not loaded → always show
      setShowJumpButton(true);
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
      const saved = await sendMessage(
        conversationId,
        conversation.partner.id,
        trimmed,
      );
      setConversation((prev) => ({
        ...prev,
        messages: prev.messages.map((m) => (m.id === tempId ? saved : m)),
      }));
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

  const renderItem = ({ item }) => {
    if (item.type === "date") {
      return (
        <View style={conversationDetailStyles.dateRow}>
          <Text style={conversationDetailStyles.dateText}>{item.date}</Text>
        </View>
      );
    }
    return <MessageItem item={item} myId={myId} />;
  };

  return (
    <SafeAreaView style={conversationDetailStyles.safe}>
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
            <Ionicons
              name="information-circle-outline"
              size={22}
              color={colors.primary}
            />
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
            onScrollBeginDrag={() => {
              setShowEmojiPicker(false);
              Keyboard.dismiss();
            }}
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
        <View style={[conversationDetailStyles.inputBar]}>
          <View style={conversationDetailStyles.inputWrap}>
            <TextInput
              style={conversationDetailStyles.textInput}
              placeholder="Nhắn tin"
              placeholderTextColor={colors.placeholder}
              value={inputText}
              onChangeText={setInputText}
              multiline
              returnKeyType="send"
              onSubmitEditing={() => handleSend(inputText)}
            />

            {/* Emoji button + picker */}
            <View style={conversationDetailStyles.emojiAnchor}>
              <Pressable
                style={conversationDetailStyles.emojiBtn}
                onPress={() => setShowEmojiPicker((v) => !v)}
                hitSlop={6}
              >
                <Ionicons
                  name={showEmojiPicker ? "happy" : "happy-outline"}
                  size={24}
                  color={colors.primary}
                />
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
            style={conversationDetailStyles.likeBtn}
            onPress={() => handleSend(hasText ? inputText : "👍")}
            disabled={isSending}
            hitSlop={8}
          >
            {hasText ? (
              <ChatSendIcon
                size={24}
                color={isSending ? colors.disabled : colors.primary}
              />
            ) : (
              <ChatThumbUpIcon
                size={24}
                color={isSending ? colors.disabled : colors.primary}
              />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
