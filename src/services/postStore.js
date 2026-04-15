import { DEFAULT_POSTS } from "@/constants/mocks/posts";
import { getAuthSession } from "@/utils/session";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const POSTS_STORAGE_KEY = "pose_tracking.posts.v1";
const CREATE_DRAFT_STORAGE_KEY = "pose_tracking.post_draft.v1";
const COMMENT_DRAFT_STORAGE_KEY = "pose_tracking.comment_drafts.v1";

function canUseWebStorage() {
  return Platform.OS === "web" && typeof localStorage !== "undefined";
}

function safeParse(raw) {
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function setItem(key, value) {
  const serialized = JSON.stringify(value);

  if (canUseWebStorage()) {
    localStorage.setItem(key, serialized);
    return;
  }

  await SecureStore.setItemAsync(key, serialized);
}

async function getItem(key) {
  if (canUseWebStorage()) {
    return safeParse(localStorage.getItem(key));
  }

  const raw = await SecureStore.getItemAsync(key);
  return safeParse(raw);
}

async function deleteItem(key) {
  if (canUseWebStorage()) {
    localStorage.removeItem(key);
    return;
  }

  await SecureStore.deleteItemAsync(key);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function sortPosts(posts = []) {
  return [...posts].sort(
    (left, right) => new Date(right.createdAt) - new Date(left.createdAt),
  );
}

function normalizeComment(comment = {}) {
  return {
    id: comment.id || createId("comment"),
    authorName: comment.authorName || "Người dùng",
    content: comment.content || "",
    createdAt: comment.createdAt || new Date().toISOString(),
    score: comment.score || "",
    detailMistakes: comment.detailMistakes || "",
    isScoreComment: Boolean(comment.isScoreComment || comment.score || comment.detailMistakes),
  };
}

function normalizePost(post = {}) {
  const comments = Array.isArray(post.comments)
    ? post.comments.map(normalizeComment).sort(
        (left, right) => new Date(left.createdAt) - new Date(right.createdAt),
      )
    : [];

  const videos = Array.isArray(post.videos)
    ? post.videos
        .filter(Boolean)
        .map((video, index) => ({
          id: video.id || createId(`video_${index + 1}`),
          name: video.name || `video-${index + 1}.mp4`,
          uri: video.uri || "",
          duration: video.duration ?? 0,
          fileSize: video.fileSize ?? 0,
          mimeType: video.mimeType || "video/mp4",
        }))
    : [];

  return {
    id: post.id || createId("post"),
    author: {
      id: post.author?.id || "user_unknown",
      name: post.author?.name || "Người dùng",
      handle: post.author?.handle || "@nguoidung",
      role: post.author?.role || "HV",
      online: Boolean(post.author?.online),
      avatar: post.author?.avatar || "",
    },
    createdAt: post.createdAt || new Date().toISOString(),
    content: post.content || post.described || "",
    described: post.described || post.content || "",
    videos,
    likeCount: Number.isFinite(post.likeCount) ? post.likeCount : 0,
    commentCount: comments.length,
    isLiked: Boolean(post.isLiked),
    canComment: post.canComment !== false,
    canEdit: Boolean(post.canEdit),
    courseId: post.courseId || "",
    exerciseId: post.exerciseId || "",
    comments,
  };
}

async function persistPosts(posts) {
  await setItem(POSTS_STORAGE_KEY, posts.map(normalizePost));
}

async function getOrSeedPosts() {
  const storedPosts = await getItem(POSTS_STORAGE_KEY);

  if (Array.isArray(storedPosts) && storedPosts.length > 0) {
    return storedPosts.map(normalizePost);
  }

  const seededPosts = clone(DEFAULT_POSTS).map(normalizePost);
  await persistPosts(seededPosts);
  return seededPosts;
}

export async function getPosts() {
  const posts = await getOrSeedPosts();
  return sortPosts(posts).map(normalizePost);
}

export async function getFeedPage({ index = 0, count = 5 } = {}) {
  const posts = await getPosts();
  const safeIndex = Math.max(0, Number(index) || 0);
  const safeCount = Math.max(1, Number(count) || 5);
  const items = posts.slice(safeIndex, safeIndex + safeCount);

  return {
    items,
    hasMore: safeIndex + safeCount < posts.length,
    total: posts.length,
    lastId: posts[0]?.id || "",
  };
}

export async function getNewItemsCount(lastId = "") {
  if (!lastId) return 0;

  const posts = await getPosts();
  const index = posts.findIndex((post) => post.id === lastId);

  if (index <= 0) {
    return 0;
  }

  return index;
}

export async function getPostById(postId) {
  const posts = await getOrSeedPosts();
  const matched = posts.find((post) => post.id === postId);
  return matched ? normalizePost(matched) : null;
}

export async function createPost({
  content,
  videos = [],
  courseId = "",
  exerciseId = "",
}) {
  const posts = await getOrSeedPosts();
  const session = await getAuthSession();

  const trimmedContent = content.trim();
  const normalizedVideos = videos
    .filter(Boolean)
    .slice(0, 2)
    .map((video, index) => ({
      id: video.id || createId(`video_${index + 1}`),
      name: video.name || `video-${index + 1}.mp4`,
      uri: video.uri || "",
      duration: video.duration ?? 0,
      fileSize: video.fileSize ?? 0,
      mimeType: video.mimeType || "video/mp4",
    }));

  const authorName =
    session?.username || session?.fullName || session?.displayName || "Người dùng mới";
  const phoneSuffix = session?.identifier?.toString().slice(-4) || "0000";

  const newPost = normalizePost({
    id: createId("post"),
    author: {
      id: session?.id || "current_user",
      name: authorName,
      handle: session?.handle || `@user${phoneSuffix}`,
      role: session?.role || "GV",
      online: true,
      avatar: session?.avatarUri || session?.avatar || "",
    },
    createdAt: new Date().toISOString(),
    content: trimmedContent,
    described: trimmedContent,
    videos: normalizedVideos,
    likeCount: 0,
    isLiked: false,
    canComment: true,
    canEdit: true,
    courseId,
    exerciseId,
    comments: [],
  });

  const nextPosts = [newPost, ...posts];
  await persistPosts(nextPosts);
  return newPost;
}

export async function toggleLike(postId) {
  const posts = await getOrSeedPosts();
  const nextPosts = posts.map((post) => {
    if (post.id !== postId) return normalizePost(post);

    const normalized = normalizePost(post);
    const isLiked = !normalized.isLiked;

    return {
      ...normalized,
      isLiked,
      likeCount: Math.max(0, normalized.likeCount + (isLiked ? 1 : -1)),
    };
  });

  await persistPosts(nextPosts);
  return getPostById(postId);
}

export async function getComments(postId, { index = 0, count = 20 } = {}) {
  const post = await getPostById(postId);

  if (!post) {
    return { comments: [], hasOlder: false, total: 0 };
  }

  const comments = [...post.comments].sort(
    (left, right) => new Date(left.createdAt) - new Date(right.createdAt),
  );

  const safeIndex = Math.max(0, Number(index) || 0);
  const safeCount = Math.max(1, Number(count) || 20);
  const end = Math.max(0, comments.length - safeIndex);
  const start = Math.max(0, end - safeCount);
  const chunk = comments.slice(start, end);

  return {
    comments: chunk.map(normalizeComment),
    hasOlder: start > 0,
    total: comments.length,
  };
}

export async function addComment(postId, commentText, extra = {}) {
  const posts = await getOrSeedPosts();
  const session = await getAuthSession();

  let updatedPost = null;

  const nextPosts = posts.map((post) => {
    const normalized = normalizePost(post);

    if (normalized.id !== postId) {
      return normalized;
    }

    const nextComment = normalizeComment({
      id: createId("comment"),
      authorName:
        extra.authorName ||
        session?.username ||
        session?.fullName ||
        session?.displayName ||
        "Bạn",
      content: commentText.trim(),
      createdAt: new Date().toISOString(),
      score: extra.score || "",
      detailMistakes: extra.detailMistakes || "",
      isScoreComment: Boolean(extra.score || extra.detailMistakes),
    });

    updatedPost = {
      ...normalized,
      comments: [...normalized.comments, nextComment],
      commentCount: normalized.comments.length + 1,
    };

    return updatedPost;
  });

  await persistPosts(nextPosts);

  return {
    post: updatedPost ? normalizePost(updatedPost) : null,
    comment: updatedPost?.comments?.[updatedPost.comments.length - 1] || null,
  };
}

export async function readCreatePostDraft() {
  return (await getItem(CREATE_DRAFT_STORAGE_KEY)) || null;
}

export async function saveCreatePostDraft(draft) {
  await setItem(CREATE_DRAFT_STORAGE_KEY, draft);
}

export async function clearCreatePostDraft() {
  await deleteItem(CREATE_DRAFT_STORAGE_KEY);
}

export async function getCommentDraft(postId) {
  const drafts = (await getItem(COMMENT_DRAFT_STORAGE_KEY)) || {};
  return typeof drafts[postId] === "string" ? drafts[postId] : "";
}

export async function saveCommentDraft(postId, value) {
  const drafts = (await getItem(COMMENT_DRAFT_STORAGE_KEY)) || {};
  drafts[postId] = value;
  await setItem(COMMENT_DRAFT_STORAGE_KEY, drafts);
}

export async function clearCommentDraft(postId) {
  const drafts = (await getItem(COMMENT_DRAFT_STORAGE_KEY)) || {};
  delete drafts[postId];
  await setItem(COMMENT_DRAFT_STORAGE_KEY, drafts);
}

export async function clearTransientPostData() {
  await Promise.all([
    deleteItem(CREATE_DRAFT_STORAGE_KEY),
    deleteItem(COMMENT_DRAFT_STORAGE_KEY),
  ]);
}
