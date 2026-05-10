import { backendApi } from "@/api/client";
import { DEMO_CONVERSATIONS } from "@/constants/demo";
import { extractList } from "@/repositories/normalizers";
import { assertBackendOk } from "@/repositories/serverResponse";
import {
  ACTIVE_SOURCES,
  canFallbackToLocal,
  getCurrentSession,
  shouldUseServer,
} from "@/repositories/source";

let localConversations = DEMO_CONVERSATIONS.map((conversation) => ({
  ...conversation,
  source: ACTIVE_SOURCES.LOCAL,
}));

function normalizeConversation(raw = {}, source = ACTIVE_SOURCES.SERVER) {
  return {
    id: String(raw.id || raw.conversation_id || raw.partner_id || ""),
    title: raw.title || raw.username || raw.partner_name || "Cuộc trò chuyện",
    lastMessage: raw.lastMessage || raw.last_message || raw.message || "",
    unread: Boolean(raw.unread || raw.is_unread),
    source,
    raw,
  };
}

function normalizeMessage(raw = {}, source = ACTIVE_SOURCES.SERVER) {
  return {
    id: String(raw.id || raw.message_id || `${source}_message_${Date.now()}`),
    sender: raw.sender || raw.sender_id || raw.user_id || "server",
    text: raw.text || raw.message || raw.content || "",
    createdAt: raw.createdAt || raw.created_at || raw.time || new Date().toISOString(),
    source,
    raw,
  };
}

export async function getConversationList() {
  const session = await getCurrentSession();

  if (!shouldUseServer(session)) {
    return localConversations;
  }

  try {
    const response = await backendApi.getListConversation({
      token: session.token,
      index: "0",
      count: "30",
    });

    await assertBackendOk(response, { allowNoData: true, message: "Backend get_list_conversation failed" });

    return extractList(response).map((item) => normalizeConversation(item, ACTIVE_SOURCES.SERVER));
  } catch (error) {
    console.info("[DATA] Server conversation list fallback", error.message);

    if (!error.sessionExpired && canFallbackToLocal()) {
      return localConversations.map((item) => ({ ...item, source: ACTIVE_SOURCES.LOCAL_FALLBACK }));
    }

    throw error;
  }
}

export async function getConversation(conversationId) {
  const session = await getCurrentSession();

  if (!shouldUseServer(session)) {
    return localConversations.find((item) => item.id === conversationId) || localConversations[0];
  }

  const response = await backendApi.getConversation({
    token: session.token,
    id: conversationId,
    index: "0",
    count: "50",
  });

  await assertBackendOk(response, { allowNoData: true, message: "Backend get_conversation failed" });

  const messages = extractList(response).map((item) => normalizeMessage(item, ACTIVE_SOURCES.SERVER));
  return {
    id: conversationId,
    title: "Cuộc trò chuyện",
    messages,
    source: ACTIVE_SOURCES.SERVER,
  };
}

export async function sendLocalMessage(conversationId, text) {
  const message = {
    id: `local_message_${Date.now()}`,
    sender: "me",
    text,
    createdAt: new Date().toISOString(),
    source: ACTIVE_SOURCES.LOCAL,
  };

  localConversations = localConversations.map((conversation) =>
    conversation.id === conversationId
      ? {
          ...conversation,
          lastMessage: text,
          messages: [...(conversation.messages || []), message],
        }
      : conversation,
  );

  return message;
}

export async function deleteMessage(messageId) {
  const session = await getCurrentSession();

  if (!shouldUseServer(session)) {
    return { deleted: true, source: ACTIVE_SOURCES.LOCAL };
  }

  const response = await backendApi.deleteMessage({
    token: session.token,
    id: messageId,
  });

  await assertBackendOk(response, { message: "Backend delete_message failed" });

  return { deleted: true, source: ACTIVE_SOURCES.SERVER };
}

export async function deleteConversation(conversationId) {
  const session = await getCurrentSession();

  if (!shouldUseServer(session)) {
    localConversations = localConversations.filter((item) => item.id !== conversationId);
    return { deleted: true, source: ACTIVE_SOURCES.LOCAL };
  }

  const response = await backendApi.deleteConversation({
    token: session.token,
    id: conversationId,
  });

  await assertBackendOk(response, { message: "Backend delete_conversation failed" });

  return { deleted: true, source: ACTIVE_SOURCES.SERVER };
}

export async function markConversationRead(conversationId) {
  const session = await getCurrentSession();

  if (!shouldUseServer(session)) {
    return { read: true, source: ACTIVE_SOURCES.LOCAL };
  }

  const response = await backendApi.setReadMessage({
    token: session.token,
    id: conversationId,
  });

  await assertBackendOk(response, { message: "Backend set_read_message failed" });

  return { read: true, source: ACTIVE_SOURCES.SERVER };
}
