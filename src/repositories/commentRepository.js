import { backendApi } from "@/api/client";
import * as localPosts from "@/services/postStore";
import { extractList, isBackendOk, normalizeComment } from "@/repositories/normalizers";
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

  const session = await getCurrentSession();
  assertServerSession(session);

  const response = await backendApi.getComment({
    token: session.token,
    id: postId,
    index: String(options.index || 0),
    count: String(options.count || 20),
  });

  if (!isBackendOk(response) && response?.code !== "9994") {
    throw new Error(response?.message || "Backend comments failed");
  }

  const comments = extractList(response).map((item) => normalizeComment(item, ACTIVE_SOURCES.SERVER));

  return {
    comments,
    hasOlder: false,
    total: comments.length,
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

  if (!isBackendOk(response)) {
    throw new Error(response?.message || "Backend set_comment failed");
  }

  return {
    post: null,
    comment: normalizeComment(response?.data || { content: commentText }, ACTIVE_SOURCES.SERVER),
  };
}
