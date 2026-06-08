import { backendApi } from "@/api/client";
import { assertBackendOk } from "@/repositories/serverResponse";
import { ACTIVE_SOURCES, getCurrentSession } from "@/repositories/source";

function normalizeConversationList(data) {
  const messages = data?.data || (Array.isArray(data) ? data : []);
  const numNewMessage = messages.filter(
    (item) => String(item?.lastmessage?.unread) === "1",
  ).length;

  return {
    messages,
    numNewMessage,
  };
}

function normalizeMessage(message) {
  return {
    id: message.messageId,
    sender: message.sender,
    message: message.message,
    created: message.created,
  };
}

// Conversation list cache
let conversationCache = {
  messages: [],
  numNewMessage: 0,
  hasLoaded: false,
};

const conversationListeners = new Set();
const unreadVerifyCache = new Map();
const unreadVerifyInflight = new Map();

const UNREAD_VERIFY_CACHE_TTL = 60 * 1000;

function getSessionUserId(session = {}) {
  return String(
    session.id || session.user_id || session.userId || session.user?.id || "",
  ).trim();
}

function getConversationListItemId(item = {}) {
  return String(
    item.id || item.conversationId || item.conversation_id || "",
  ).trim();
}

function getLastMessage(item = {}) {
  return item.lastmessage || item.lastMessage || item.LastMessage || {};
}

function buildUnreadVerifyKey(item = {}, session = {}) {
  const lastmessage = getLastMessage(item);

  return [
    getSessionUserId(session),
    getConversationListItemId(item),
    String(lastmessage.message || "").trim(),
    String(lastmessage.created || "").trim(),
  ].join(":");
}

function getCachedUnreadVerify(key) {
  const cached = unreadVerifyCache.get(key);

  if (!cached) return null;

  if (Date.now() - cached.cachedAt > UNREAD_VERIFY_CACHE_TTL) {
    unreadVerifyCache.delete(key);
    return null;
  }

  return cached.unread;
}

function setCachedUnreadVerify(key, unread) {
  unreadVerifyCache.set(key, {
    unread,
    cachedAt: Date.now(),
  });
}

export function getConversationCache() {
  return conversationCache;
}

export function getConversationListCache() {
  return conversationCache;
}

export function subscribeConversations(listener) {
  conversationListeners.add(listener);
  // Emit current cache immediately
  listener(conversationCache);
  return () => {
    conversationListeners.delete(listener);
  };
}

function emitConversations(data) {
  conversationCache = {
    ...data,
    hasLoaded: true,
  };
  conversationListeners.forEach((listener) => listener(conversationCache));
}

async function verifyConversationUnreadByLatestSender(item, session) {
  const conversationId = getConversationListItemId(item);
  const currentUserId = getSessionUserId(session);
  const lastmessage = getLastMessage(item);

  if (!conversationId || !currentUserId) {
    return String(lastmessage.unread || "0");
  }

  if (String(lastmessage.unread) !== "1") {
    return "0";
  }

  const cacheKey = buildUnreadVerifyKey(item, session);
  const cachedUnread = getCachedUnreadVerify(cacheKey);

  if (cachedUnread !== null) {
    return cachedUnread;
  }

  if (unreadVerifyInflight.has(cacheKey)) {
    return unreadVerifyInflight.get(cacheKey);
  }

  const promise = (async () => {
    try {
      const response = await backendApi.getConversation({
        token: session.token,
        conversationId,
        index: "0",
        count: "500",
      });

      await assertBackendOk(response, {
        allowNoData: true,
        message: "Backend get_conversation failed",
      });

      const messages = response.data?.data || [];
      const latestMessage = messages[messages.length - 1] || {};
      const senderId = String(
        latestMessage.sender?.id ||
          latestMessage.senderId ||
          latestMessage.sender_id ||
          "",
      ).trim();

      const unread =
        senderId && senderId === currentUserId
          ? "0"
          : String(lastmessage.unread || "0");

      setCachedUnreadVerify(cacheKey, unread);

      return unread;
    } catch (error) {
      console.warn("Failed to verify conversation unread:", error?.message);

      return String(lastmessage.unread || "0");
    } finally {
      unreadVerifyInflight.delete(cacheKey);
    }
  })();

  unreadVerifyInflight.set(cacheKey, promise);

  return promise;
}

async function fixConversationUnreadStates(messages = [], session = {}) {
  const fixedItems = await Promise.all(
    messages.map(async (item) => {
      const lastmessage = getLastMessage(item);

      if (String(lastmessage.unread) !== "1") {
        return item;
      }

      const unread = await verifyConversationUnreadByLatestSender(
        item,
        session,
      );

      return {
        ...item,
        lastmessage: {
          ...lastmessage,
          unread,
        },
      };
    }),
  );

  return fixedItems;
}

export async function getConversationList() {
  const session = await getCurrentSession();

  try {
    const response = await backendApi.getListConversation({
      token: session.token,
      index: "0",
      count: "20",
    });

    await assertBackendOk(response, {
      allowNoData: true,
      message: "Backend get_list_conversation failed",
    });

    let data = normalizeConversationList(response.data);
    const fixedMessages = await fixConversationUnreadStates(
      data.messages,
      session,
    );

    data = {
      ...data,
      messages: fixedMessages,
      numNewMessage: fixedMessages.filter(
        (item) => String(item?.lastmessage?.unread) === "1",
      ).length,
    };

    emitConversations(data);
    return data;
  } catch (error) {
    console.info("[DATA] Server conversation list fallback", error.message);
    throw error;
  }
}

export async function getConversation(target, index = 0, count = 50) {
  const session = await getCurrentSession();

  const params =
    typeof target === "object"
      ? target
      : { conversationId: String(target || "") };

  const response = await backendApi.getConversation({
    token: session.token,
    conversationId: params.conversationId || "",
    partnerId: params.partnerId || "",
    index: String(index),
    count: String(count),
  });

  await assertBackendOk(response, {
    allowNoData: true,
    message: "Backend get_conversation failed",
  });

  const data = response.data;
  const messages = (data.data || []).map((item) => normalizeMessage(item));

  return {
    id: data.conversation?.id || params.conversationId || "",
    partner: data.conversation?.partner || params.partner || {},
    isBlocked: data.conversation?.isBlocked || "0",
    messages,
  };
}

export async function deleteMessage(messageId) {
  const session = await getCurrentSession();

  const response = await backendApi.deleteMessage({
    token: session.token,
    id: messageId,
  });

  await assertBackendOk(response, { message: "Backend delete_message failed" });

  return { deleted: true, source: ACTIVE_SOURCES.SERVER };
}

export async function deleteConversation(conversationId) {
  // Optimistic update of local cache
  const current = { ...conversationCache };
  const conversationToDelete = current.messages.find(
    (msg) => msg.id === conversationId,
  );
  const wasUnread = conversationToDelete?.lastmessage?.unread === "1";

  const updatedMessages = current.messages.filter(
    (msg) => msg.id !== conversationId,
  );
  const nextUnread = wasUnread
    ? Math.max(0, current.numNewMessage - 1)
    : current.numNewMessage;

  emitConversations({
    messages: updatedMessages,
    numNewMessage: nextUnread,
  });

  const session = await getCurrentSession();

  const response = await backendApi.deleteConversation({
    token: session.token,
    conversationId: conversationId,
  });

  await assertBackendOk(response, {
    message: "Backend delete_conversation failed",
  });

  return { deleted: true, source: ACTIVE_SOURCES.SERVER };
}

export async function markConversationRead(conversationId) {
  // Optimistic update of local cache
  const current = { ...conversationCache };
  let changed = false;
  const updatedMessages = current.messages.map((msg) => {
    if (msg.id === conversationId && msg.lastmessage.unread === "1") {
      changed = true;
      return {
        ...msg,
        lastmessage: {
          ...msg.lastmessage,
          unread: "0",
        },
      };
    }
    return msg;
  });

  if (changed) {
    const nextUnread = Math.max(0, current.numNewMessage - 1);
    emitConversations({
      messages: updatedMessages,
      numNewMessage: nextUnread,
    });
  }

  const session = await getCurrentSession();

  const response = await backendApi.setReadMessage({
    token: session.token,
    conversationId: String(conversationId),
  });

  await assertBackendOk(response, {
    message: "Backend set_read_message failed",
  });

  return { read: true, source: ACTIVE_SOURCES.SERVER };
}

export async function sendMessage(conversationId, partnerId, message) {
  const session = await getCurrentSession();

  const response = await backendApi.sendMessage({
    token: session.token,
    conversationId: String(conversationId || ""),
    partnerId: String(partnerId || ""),
    message: String(message || ""),
  });

  await assertBackendOk(response, { message: "Backend send_message failed" });

  const raw = response.data || {};
  const nextConversationId = String(raw.conversationId || conversationId || "");

  return {
    id: raw.messageId || String(Date.now()),
    conversationId: nextConversationId,
    sender: {
      id: session.id || session.user_id || session.userId,
      username: session.username,
      avatar: session.avatar,
    },
    message,
    created: raw.createdAt || raw.created || new Date().toISOString(),
  };
}
