import { backendApi } from "@/api/client";
import { extractList } from "@/repositories/normalizers";
import { assertBackendOk } from "@/repositories/serverResponse";
import { ACTIVE_SOURCES, getCurrentSession } from "@/repositories/source";

function normalizeConversation(raw = {}, source = ACTIVE_SOURCES.SERVER) {
  return {
    id: raw.id,
    title: raw.partner.username,
    lastMessage: raw.lastmessage.message,
    unread: raw.lastmessage.unread,
    source,
    raw,
  };
}

function normalizeMessage(raw = {}, source = ACTIVE_SOURCES.SERVER) {
  return {
    id: raw.messageId,
    sender: raw.sender,
    text: raw.message,
    createdAt: raw.created,
    source,
    raw,
  };
}

export async function getConversationList() {
  const session = await getCurrentSession();

  try {
    const response = await backendApi.getListConversation({
      token: session.token,
      index: "0",
      count: "30",
    });

    await assertBackendOk(response, {
      allowNoData: true,
      message: "Backend get_list_conversation failed",
    });

    return extractList(response).map((item) =>
      normalizeConversation(item, ACTIVE_SOURCES.SERVER),
    );
  } catch (error) {
    console.info("[DATA] Server conversation list fallback", error.message);
    throw error;
  }
}

export async function getConversation(conversationId) {
  const session = await getCurrentSession();

  const response = await backendApi.getConversation({
    token: session.token,
    conversationId: conversationId,
    index: "0",
    count: "50",
  });

  await assertBackendOk(response, {
    allowNoData: true,
    message: "Backend get_conversation failed",
  });

  const messages = extractList(response).map((item) =>
    normalizeMessage(item, ACTIVE_SOURCES.SERVER),
  );
  console.log(JSON.stringify(messages, null, 2));
  return {
    id: conversationId,
    title: "Cuộc trò chuyện",
    messages,
    source: ACTIVE_SOURCES.SERVER,
  };
}

export async function sendLocalMessage(text) {
  return {
    id: `local_message_${Date.now()}`,
    sender: "me",
    text,
    createdAt: new Date().toISOString(),
    source: ACTIVE_SOURCES.LOCAL,
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
  const session = await getCurrentSession();

  const response = await backendApi.deleteConversation({
    token: session.token,
    id: conversationId,
  });

  await assertBackendOk(response, {
    message: "Backend delete_conversation failed",
  });

  return { deleted: true, source: ACTIVE_SOURCES.SERVER };
}

export async function markConversationRead(conversationId) {
  const session = await getCurrentSession();

  const response = await backendApi.setReadMessage({
    token: session.token,
    id: conversationId,
  });

  await assertBackendOk(response, {
    message: "Backend set_read_message failed",
  });

  return { read: true, source: ACTIVE_SOURCES.SERVER };
}
