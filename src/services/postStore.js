import { getAuthSession } from "@/utils/session";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const DEFAULT_POSTS = [];
const POSTS_STORAGE_KEY = "pose_tracking.posts.v4";
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
    isScoreComment: Boolean(
      comment.isScoreComment || comment.score || comment.detailMistakes,
    ),
  };
}

function normalizeScoreSummary(scoreSummary = null) {
  if (!scoreSummary) return null;

  return {
    score: Number.isFinite(scoreSummary.score)
      ? scoreSummary.score
      : Number(scoreSummary.score) || 0,
    label: scoreSummary.label || "",
    mistakes: Array.isArray(scoreSummary.mistakes) ? scoreSummary.mistakes : [],
    suggestions: Array.isArray(scoreSummary.suggestions)
      ? scoreSummary.suggestions
      : [],
  };
}

function normalizePost(post = {}) {
  const comments = Array.isArray(post.comments)
    ? post.comments
        .map(normalizeComment)
        .sort(
          (left, right) => new Date(left.createdAt) - new Date(right.createdAt),
        )
    : [];

  const videos = Array.isArray(post.videos)
    ? post.videos.filter(Boolean).map((video, index) => ({
        id: video.id || createId(`video_${index + 1}`),
        name: video.name || `video-${index + 1}.mp4`,
        uri: video.uri || "",
        thumb: video.thumb || "",
        angle: video.angle || (index === 0 ? "Góc quay trái" : "Góc quay phải"),
        duration: video.duration ?? 0,
        fileSize: video.fileSize ?? 0,
        mimeType: video.mimeType || "video/mp4",
      }))
    : [];

  return {
    id: post.id || createId("post"),
    type: post.type || "post",
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
    canSubmit: Boolean(post.canSubmit || post.type === "exercise"),
    courseId: post.courseId || "",
    exerciseId: post.exerciseId || "",
    sourcePostId: post.sourcePostId || "",
    teacherId: post.teacherId || post.author?.id || "",
    courseTitle: post.courseTitle || "",
    exerciseTitle: post.exerciseTitle || "",
    hashtags: Array.isArray(post.hashtags) ? post.hashtags : [],
    scoreSummary: normalizeScoreSummary(post.scoreSummary),
    reports: Array.isArray(post.reports) ? post.reports : [],
    comments,
  };
}

async function persistPosts(posts) {
  await setItem(POSTS_STORAGE_KEY, posts.map(normalizePost));
}

async function getOrSeedPosts() {
  // await deleteItem(POSTS_STORAGE_KEY);
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
  sourcePostId = "",
  type = "post",
  canSubmit = false,
  courseTitle = "",
  exerciseTitle = "",
  hashtags = [],
  scoreSummary = null,
  comments = [],
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
      thumb: video.thumb || "",
      angle: video.angle || (index === 0 ? "Góc quay trái" : "Góc quay phải"),
      duration: video.duration ?? 0,
      fileSize: video.fileSize ?? 0,
      mimeType: video.mimeType || "video/mp4",
    }));

  const authorName =
    session?.username ||
    session?.fullName ||
    session?.displayName ||
    "Người dùng mới";
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
    canSubmit,
    courseId,
    exerciseId,
    sourcePostId,
    courseTitle,
    exerciseTitle,
    hashtags,
    scoreSummary,
    comments,
    type,
  });

  const nextPosts = [newPost, ...posts];
  await persistPosts(nextPosts);
  return newPost;
}

export async function updatePost(postId, params = {}) {
  const posts = await getOrSeedPosts();
  let updatedPost = null;

  const nextPosts = posts.map((post) => {
    const normalized = normalizePost(post);
    if (normalized.id !== postId) return normalized;

    updatedPost = normalizePost({
      ...normalized,
      ...params,
      content: params.content ?? params.described ?? normalized.content,
      described: params.described ?? params.content ?? normalized.described,
      videos: params.videos ?? normalized.videos,
    });
    return updatedPost;
  });

  await persistPosts(nextPosts);
  return updatedPost;
}

export async function deletePost(postId) {
  const posts = await getOrSeedPosts();
  const nextPosts = posts
    .filter((post) => post.id !== postId)
    .map(normalizePost);
  await persistPosts(nextPosts);
  return true;
}

export async function reportPost(postId, reason = "") {
  const posts = await getOrSeedPosts();
  const nextPosts = posts.map((post) => {
    const normalized = normalizePost(post);
    if (normalized.id !== postId) return normalized;

    return {
      ...normalized,
      reports: [
        ...(Array.isArray(normalized.reports) ? normalized.reports : []),
        {
          id: createId("report"),
          reason,
          createdAt: new Date().toISOString(),
        },
      ],
    };
  });

  await persistPosts(nextPosts);
  return true;
}

function buildScoringComment(
  scoreTemplate = {
    score: 0,
    mistakes: [],
    suggestions: [],
  },
) {
  const mistakes = scoreTemplate.mistakes.join("; ");
  const suggestions = scoreTemplate.suggestions.join("; ");

  return normalizeComment({
    id: createId("score_comment"),
    authorName: "Ứng dụng tự chấm",
    content: `Kết quả chấm tự động: ${scoreTemplate.score}/100. Lỗi chính: ${mistakes}. Gợi ý: ${suggestions}.`,
    createdAt: new Date().toISOString(),
    score: String(scoreTemplate.score),
    detailMistakes: mistakes,
    isScoreComment: true,
  });
}

export async function createExerciseSubmission({
  content = "",
  courseId = "",
  exerciseId = "",
  sourcePostId = "",
  videos = [],
  courseTitle = "",
  exerciseTitle = "Bài tập",
}) {
  const scoreTemplate = {
    score: 0,
    label: "",
    mistakes: [],
    suggestions: [],
  };
  const scoringComment = buildScoringComment(scoreTemplate);
  const normalizedVideos = videos.filter(Boolean).slice(0, 2);
  const body = content.trim() ? content.trim() : "Nộp bài tập.";

  return createPost({
    content: body,
    videos: normalizedVideos,
    courseId,
    exerciseId,
    sourcePostId,
    type: "submission",
    canSubmit: false,
    courseTitle,
    exerciseTitle,
    hashtags: [courseId, exerciseId].filter(Boolean).map((item) => `#${item}`),
    scoreSummary: {
      score: scoreTemplate.score,
      label: scoreTemplate.label,
      mistakes: scoreTemplate.mistakes,
      suggestions: scoreTemplate.suggestions,
    },
    comments: [scoringComment],
  });
}

export async function getExercisePosts() {
  const posts = await getPosts();
  return posts.filter((post) => post.type === "exercise" || post.canSubmit);
}

export async function searchPosts(query = "") {
  const posts = await getPosts();
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return posts;
  }

  return posts.filter((post) => {
    const haystack = [
      post.content,
      post.author?.name,
      post.author?.handle,
      post.courseTitle,
      post.exerciseTitle,
      ...(post.hashtags || []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

function normalizeHashtagQuery(hashtag = "") {
  const trimmed = String(hashtag || "").trim().toLowerCase();
  if (!trimmed) return "";
  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
}

function collectPostHashtags(post = {}) {
  const values = new Set(Array.isArray(post.hashtags) ? post.hashtags : []);
  if (post.courseId) values.add(`#${post.courseId}`);
  if (post.exerciseId) values.add(`#${post.exerciseId}`);
  return Array.from(values).map(normalizeHashtagQuery).filter(Boolean);
}

export async function searchPostsByHashtag(hashtag = "") {
  const posts = await getPosts();
  const normalizedHashtag = normalizeHashtagQuery(hashtag);

  if (!normalizedHashtag) {
    return [];
  }

  return posts.filter((post) => {
    return collectPostHashtags(post).includes(normalizedHashtag);
  });
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
