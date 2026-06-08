import UserAvatar from "@/components/common/UserAvatar";
import ChatSendIcon from "@/components/icons/ChatSendIcon";
import ChatSmileIcon from "@/components/icons/ChatSmileIcon";
import ChatThumbUpIcon from "@/components/icons/ChatThumbUpIcon";
import CommentReactionPicker from "@/components/post/CommentReactionPicker";
import colors from "@/constants/colors";
import sizes from "@/constants/sizes";
import { getBlocks, setBlock } from "@/repositories/blockRepository";
import {
  getConversation,
  markConversationRead,
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
  Alert,
  FlatList,
  Keyboard,
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
const KEYBOARD_SCROLL_DELAY_MS = 120;

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

function isBlockedConversation(value) {
  const text = String(value ?? "").trim().toLowerCase();

  return (
    value === true ||
    value === 1 ||
    text === "1" ||
    text === "true" ||
    text === "blocked" ||
    text === "yes"
  );
}

function getBlockUserIdCandidates(item = {}) {
  return [
    item.id,
    item.userId,
    item.user_id,
    item.blockedUserId,
    item.blocked_user_id,
    item.blocked?.id,
    item.user?.id,
    item.raw?.userId,
    item.raw?.user_id,
    item.raw?.blockedUserId,
    item.raw?.blocked_user_id,
    item.raw?.blocked?.id,
    item.raw?.user?.id,
  ]
    .filter((value) => value !== undefined && value !== null)
    .map((value) => String(value).trim())
    .filter(Boolean);
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
// Items: { type: 'date', key, id, date } | { type: 'message', key, id, msg, position, isGroupEnd, isGroupStart }
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
          key: `date-${msg.id || "missing"}-${items.length}`,
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
        key: `message-${msg.id || "missing"}-${items.length}`,
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
  const [blockedByMe, setBlockedByMe] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const flatListRef = useRef(null);
  const isAtBottomRef = useRef(false);
  const hasInitialScrollRef = useRef(false);
  const [layoutHeight, setLayoutHeight] = useState(0);

  const updateBlockedByMe = useCallback(
    async (nextConversation) => {
      const targetPartnerId = String(
        nextConversation?.partner?.id || partnerId || "",
      ).trim();

      if (!targetPartnerId) {
        setBlockedByMe(false);
        return;
      }

      try {
        const blocks = await getBlocks();

        setBlockedByMe(
          blocks.some((item) =>
            getBlockUserIdCandidates(item).includes(targetPartnerId),
          ),
        );
      } catch (error) {
        console.warn("Failed to verify blocked partner:", error?.message);
        setBlockedByMe(false);
      }
    },
    [partnerId],
  )

  const scrollToConversationEnd = useCallback((animated = false) => {
    requestAnimationFrame(() => {
      flatListRef.current?.scrollToEnd({ animated });
    });
  }, []);

  const scheduleScrollToConversationEnd = useCallback(
    (animated = false, delay = KEYBOARD_SCROLL_DELAY_MS) => {
      setTimeout(() => {
        scrollToConversationEnd(animated);
      }, delay);
    },
    [scrollToConversationEnd],
  );

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
            if (data.id) {
              markConversationRead(data.id).catch(async (error) => {
                if (await redirectIfSessionExpired(error, router)) return;
                console.warn(
                  "Failed to mark partner conversation read:",
                  error?.message,
                );
              });
            }
            await updateBlockedByMe(data);
            return;
          } catch (_error) {
            const profile = await getUserInfo(partnerId);

            const nextConversation = {
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
            };

            setConversation(nextConversation);

            setTotalLoaded(0);
            setHasLatest(true);
            await updateBlockedByMe(nextConversation);
            return;
          }
        }

        const data = await getConversation(routeId, 0, PAGE_SIZE);
        setConversation(data);
        setTotalLoaded(data.messages.length);

        if (data.messages.length < PAGE_SIZE) {
          setHasLatest(true);
        }

        if (data.id || routeId) {
          markConversationRead(data.id || routeId).catch(async (error) => {
            if (await redirectIfSessionExpired(error, router)) return;
            console.warn("Failed to mark conversation read:", error?.message);
          });
        }

        await updateBlockedByMe(data);
      } catch (error) {
        if (await redirectIfSessionExpired(error, router)) return;
      }
    };
    init();
  }, [
    routeId,
    partnerId,
    isPartnerMode,
    partnerName,
    partnerAvatar,
    updateBlockedByMe,
  ]);

  useFocusEffect(load);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const handleShow = (event) => {
      const nextHeight = Math.max(0, event?.endCoordinates?.height || 0);
      setKeyboardHeight(nextHeight);

      if (isAtBottomRef.current) {
        scheduleScrollToConversationEnd(false, 80);
        scheduleScrollToConversationEnd(false, 180);
      }
    };

    const handleHide = () => {
      setKeyboardHeight(0);
    };

    const showSubscription = Keyboard.addListener(showEvent, handleShow);
    const hideSubscription = Keyboard.addListener(hideEvent, handleHide);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [scheduleScrollToConversationEnd]);

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
      scheduleScrollToConversationEnd(true, 80);
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

    if (
      !trimmed ||
      isSending ||
      !conversation ||
      !mySession ||
      blockedByMe ||
      isBlockedConversation(conversation?.isBlocked)
    ) {
      return;
    }

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

    setTimeout(() => scrollToConversationEnd(true), 80);

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
  const isBlocked = isBlockedConversation(conversation?.isBlocked);
  const blockedByOther = isBlocked && !blockedByMe;
  const keyboardInset =
    keyboardHeight > 0 ? Math.max(0, keyboardHeight) + sizes.xs : 0;
  const chatBodyBottomPadding = keyboardInset;
  const messageListBottomPadding = sizes.md;

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

  const handleUnblock = useCallback(async () => {
    const targetPartnerId = String(
      conversation?.partner?.id || partnerId || "",
    ).trim();

    if (!targetPartnerId) return;

    try {
      await setBlock(targetPartnerId, "unblock");

      setBlockedByMe(false);
      setConversation((current) => ({
        ...current,
        isBlocked: "0",
      }));
    } catch (error) {
      if (await redirectIfSessionExpired(error, router)) return;

      Alert.alert("Không thể bỏ chặn", error?.message || "Đã có lỗi xảy ra.");
    }
  }, [conversation?.partner?.id, partnerId]);

  const handleOpenConversationInfo = useCallback(() => {
    const partner = conversation?.partner || {};
    const targetPartnerId = String(partner.id || partnerId || "").trim();

    if (!targetPartnerId) {
      return;
    }

    router.push({
      pathname: "/conversation/info",
      params: {
        partnerId: targetPartnerId,
        partnerName: partner.username || partnerName || "",
        partnerAvatar: partner.avatar || partnerAvatar || "",
        conversationId: conversation?.id || routeId || "",
      },
    });
  }, [
    conversation?.id,
    conversation?.partner,
    partnerId,
    partnerName,
    partnerAvatar,
    routeId,
  ]);
  useEffect(() => {
    if (!items.length || hasInitialScrollRef.current) {
      return;
    }

    hasInitialScrollRef.current = true;
    isAtBottomRef.current = true;
    scheduleScrollToConversationEnd(false, 80);
  }, [items.length, scheduleScrollToConversationEnd]);

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
          <Pressable
            onPress={handleOpenConversationInfo}
            style={conversationDetailStyles.iconBtn}
            hitSlop={8}
          >
            <Foundation name="info" size={24} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      <View
        style={[
          conversationDetailStyles.flex,
          { paddingBottom: chatBodyBottomPadding },
        ]}
      >
        {/* ── Message list ── */}
        <View style={conversationDetailStyles.flex}>
          <FlatList
            ref={flatListRef}
            data={items}
            keyExtractor={(item) => item.key}
            renderItem={renderItem}
            contentContainerStyle={[
              conversationDetailStyles.listContent,
              { paddingBottom: messageListBottomPadding },
            ]}
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
            onContentSizeChange={(contentWidth, contentHeight) => {
              handleContentSizeChange(contentWidth, contentHeight);

              if (isAtBottomRef.current) {
                scheduleScrollToConversationEnd(false, 40);
              }
            }}
          />

          {showEmojiPicker ? (
            <Pressable
              style={conversationDetailStyles.emojiDismissOverlay}
              onPress={() => setShowEmojiPicker(true)}
            />
          ) : null}

          {/* ── Jump to latest FAB ── */}
          {showJumpButton && (
            <View
              style={[
                conversationDetailStyles.jumpContainer,
                { bottom: 12 + keyboardInset },
              ]}
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
        {blockedByMe ? (
          <View style={conversationDetailStyles.blockedComposer}>
            <Text style={conversationDetailStyles.blockedComposerText}>
              Bạn đã chặn người này.
            </Text>

            <Pressable
              onPress={handleUnblock}
              style={conversationDetailStyles.unblockButton}
            >
              <Text style={conversationDetailStyles.unblockButtonText}>
                Bỏ chặn
              </Text>
            </Pressable>
          </View>
        ) : blockedByOther ? (
          <View style={conversationDetailStyles.blockedComposer}>
            <Text style={conversationDetailStyles.blockedComposerText}>
              Bạn không thể nhắn tin trong cuộc trò chuyện này.
            </Text>
          </View>
        ) : (
          <View style={[conversationDetailStyles.inputBar]}>
            <View style={conversationDetailStyles.inputWrap}>
              <TextInput
                style={conversationDetailStyles.textInput}
                placeholder="Nhắn tin"
                placeholderTextColor={colors.placeholder}
                value={inputText}
                onChangeText={setInputText}
                onFocus={() => {
                  setShowEmojiPicker(false);
                  scheduleScrollToConversationEnd(false, 80);
                  scheduleScrollToConversationEnd(false, 180);
                }}
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
                  <ChatSmileIcon size={18} color={colors.primary} />
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
        )}
      </View>
    </SafeAreaView>
  );
}
