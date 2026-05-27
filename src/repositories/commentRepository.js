import { backendApi } from "@/api/client";
import * as localPosts from "@/services/postStore";
import { extractList, normalizeComment } from "@/repositories/normalizers";
import { assertBackendOk } from "@/repositories/serverResponse";
import { ACTIVE_SOURCES, getCurrentSession, isServerPost } from "@/repositories/source";

function assertServerSession(session) {
  if (!session?.token) {
    throw new Error("Cần đăng nhập server để dùng bình luận backend.");
  }
}

export async function getComments(postOrId, options = {}) {
  const postId = typeof postOrId === "string" ? postOrId : postOrId?.id;

  if (!isServerPost(postOrId)) {
    return localPosts.getComments(postId, options);
  }

  const safeIndex = Math.max(0, Number(options.index) || 0);
  const safeCount = Math.max(1, Number(options.count) || 20);
  const session = await getCurrentSession();
  assertServerSession(session);

  const response = await backendApi.getComment({
    token: session.token,
    id: postId,
    index: String(safeIndex),
    count: String(safeCount),
  });

  await assertBackendOk(response, { allowNoData: true, message: "Backend comments failed" });

  const root = response?.data;
  const nested = root?.data;
  const rawComments = Array.isArray(nested?.data)
    ? nested.data
    : Array.isArray(nested)
      ? nested
      : extractList(response);
  const isBlocked = String(root?.is_blocked ?? nested?.is_blocked ?? "0") === "1";
  const deduped = new Map();
  rawComments.forEach((item) => {
    const normalized = normalizeComment(item, ACTIVE_SOURCES.SERVER);
    if (!normalized?.id || deduped.has(normalized.id)) return;
    deduped.set(normalized.id, normalized);
  });
  const comments = Array.from(deduped.values());

  return {
    comments,
    hasOlder: !isBlocked && rawComments.length >= safeCount,
    total: comments.length,
    receivedCount: rawComments.length,
    isBlocked,
  };
}

export async function addComment(postOrId, commentText, extra = {}) {
  const postId = typeof postOrId === "string" ? postOrId : postOrId?.id;

  if (!isServerPost(postOrId)) {
    return localPosts.addComment(postId, commentText, extra);
  }

  const session = await getCurrentSession();
  assertServerSession(session);

  const response = await backendApi.setComment({
    token: session.token,
    id: postId,
    comment: commentText.trim(),
    index: "0",
    count: "20",
  });

  await assertBackendOk(response, { message: "Backend set_comment failed" });
  const createdComment = extractList(response)[0] || { comment: commentText };

  return {
    post: null,
    comment: normalizeComment(createdComment, ACTIVE_SOURCES.SERVER),
  };
}
