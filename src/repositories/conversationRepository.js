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

export function getConversationCache() {
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

    const data = normalizeConversationList(response.data);
    emitConversations(data);
    return data;
  } catch (error) {
    console.info("[DATA] Server conversation list fallback", error.message);
    throw error;
  }
}

export async function getConversation(conversationId, index = 0, count = 50) {
  const session = await getCurrentSession();

  const response = await backendApi.getConversation({
    token: session.token,
    conversationId,
    index: String(index),
    count: String(count),
  });

  await assertBackendOk(response, {
    allowNoData: true,
    message: "Backend get_conversation failed",
  });

  const data = response.data;
  const messages = data.data.map((item) => normalizeMessage(item));
  return {
    id: conversationId,
    partner: data.conversation.partner,
    isBlocked: data.conversation.isBlocked,
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
    conversationId: conversationId,
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
    conversationId,
    partnerId,
    message,
  });

  await assertBackendOk(response, { message: "Backend send_message failed" });

  try {
    await markConversationRead(conversationId);
  } catch (e) {
    // Ignore error so it doesn't block returning the sent message
  }

  const raw = response.data;
  return {
    id: raw?.messageId || String(Date.now()),
    sender: {
      id: session.id,
      username: session.username,
      avatar: session.avatar,
    },
    message,
    created: raw?.created || new Date().toISOString(),
  };
}
