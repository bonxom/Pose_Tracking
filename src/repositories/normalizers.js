import { ACTIVE_SOURCES } from "@/repositories/source";

export function firstValue(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

export function toArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value) return [value];
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.posts)) return value.posts;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.list)) return value.list;
  return [];
}

export function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function extractList(response) {
  const data = response?.data || response;
  if (Array.isArray(data?.post)) return data.post;
  if (Array.isArray(data?.posts)) return data.posts;
  if (Array.isArray(data?.items)) return data.items;
  return toArray(data);
}

export function extractObject(response) {
  if (!response) return null;
  if (Array.isArray(response.data)) return response.data[0] || null;
  if (response.data && !Array.isArray(response.data)) return response.data;
  if (response.post) return response.post;
  if (response.item) return response.item;
  return response;
}

export function isBackendOk(response) {
  return response?.code === "1000" || response?.code === 1000 || response?.success === true;
}

export function normalizeSession(raw = {}) {
  const data = raw.data || raw.user || raw.result || raw;
  const token = firstValue(data.token, data.access_token, data.accessToken, raw.token);
  const id = firstValue(data.id, data.user_id, data._id, data.uuid, data.phonenumber);
  const username = firstValue(data.user_name, data.username, data.name, data.fullname, data.fullName, data.phonenumber);

  return {
    id: String(id || "server_user"),
    token: token || "",
    username: username || "Người dùng server",
    displayName: username || "Người dùng server",
    avatar: firstValue(data.avatar, data.avatar_url, data.image, ""),
    coverImage: firstValue(data.cover_image, data.coverImage, ""),
    role: firstValue(data.role, data.type, "HV"),
    phonenumber: firstValue(data.phonenumber, data.phone, data.phone_number, ""),
    identifier: firstValue(data.phonenumber, data.phone, data.phone_number, id, ""),
    source: ACTIVE_SOURCES.SERVER,
    demoMode: false,
    raw: data,
  };
}

export function normalizeVideo(raw = {}, index = 0) {
  const uri = firstValue(raw.uri, raw.url, raw.video_url, raw.file_url, raw.path, raw);
  const thumb = firstValue(raw.thumb, raw.thumbnail, raw.thumbnail_url, raw.poster, "");

  return {
    id: String(firstValue(raw.id, raw.video_id, `server_video_${index + 1}`)),
    name: firstValue(raw.name, raw.file_name, raw.filename, `video-${index + 1}.mp4`),
    uri: typeof uri === "string" ? uri : "",
    thumb: typeof thumb === "string" ? thumb : "",
    angle: firstValue(raw.angle, raw.camera, index === 0 ? "Góc quay trái" : "Góc quay phải"),
    duration: toNumber(raw.duration, 0),
    fileSize: toNumber(raw.fileSize || raw.file_size, 0),
    mimeType: firstValue(raw.mimeType, raw.mime_type, "video/mp4"),
  };
}

function isValidMediaList(videos = []) {
  return videos.some((video) => video.uri || video.url || video.video_url || video.file_url || typeof video === "string");
}

function normalizeCanComment(value) {
  return ![false, 0, "0", "false", "False"].includes(value);
}

export function normalizePost(raw = {}, source = ACTIVE_SOURCES.SERVER) {
  const user = raw.author || raw.user || raw.poster || raw.owner || {};
  const rawVideos = extractList(raw.videos || raw.video || raw.video_url || raw.images || raw.media);
  const videos = rawVideos.map(normalizeVideo).filter((video) => video.uri);
  const createdAt = firstValue(raw.createdAt, raw.created_at, raw.created, raw.create_time, raw.time, new Date().toISOString());
  const content = firstValue(raw.content, raw.described, raw.description, raw.body, "");
  const role = firstValue(user.role, raw.role, raw.author_role, "HV");
  const courseId = firstValue(raw.courseId, raw.course_id, raw.category_id, "");
  const exerciseId = firstValue(raw.exerciseId, raw.exercise_id, raw.lesson_id, "");
  const canCommentValue = firstValue(raw.canComment, raw.can_comment, raw.can_comment_mark, true);

  const isTeacherExerciseLikePost = role === "GV" && Boolean(courseId);

  return {
    id: String(firstValue(raw.id, raw.post_id, raw._id, "")),
    source,
    type: raw.type || (isTeacherExerciseLikePost ? "exercise" : "post"),
    author: {
      id: String(firstValue(user.id, user.user_id, raw.author_id, raw.user_id, "server_user")),
      name: firstValue(user.name, user.username, raw.author_name, raw.username, "Người dùng"),
      handle: firstValue(user.handle, raw.handle, ""),
      role,
      online: Boolean(firstValue(user.online, raw.online, false)),
      avatar: firstValue(user.avatar, user.avatar_url, raw.author_avatar, raw.avatar, ""),
    },
    createdAt,
    content,
    described: content,
    videos,
    likeCount: toNumber(firstValue(raw.likeCount, raw.like_count, raw.feel, raw.likes), 0),
    commentCount: toNumber(firstValue(raw.commentCount, raw.comment_count, raw.comment_mark, raw.comments_count), 0),
    isLiked: Boolean(firstValue(raw.isLiked, raw.is_liked, raw.liked, false)),
    canComment: normalizeCanComment(canCommentValue),
    canEdit: Boolean(firstValue(raw.canEdit, raw.can_edit, false)),
    canSubmit: Boolean(firstValue(raw.canSubmit, raw.can_submit, isTeacherExerciseLikePost)),
    courseId,
    exerciseId,
    sourcePostId: firstValue(raw.sourcePostId, raw.source_post_id, ""),
    teacherId: firstValue(raw.teacherId, raw.teacher_id, raw.author_id, ""),
    courseTitle: firstValue(raw.courseTitle, raw.course_title, raw.category_name, ""),
    exerciseTitle: firstValue(raw.exerciseTitle, raw.exercise_title, raw.title, ""),
    hashtags: Array.isArray(raw.hashtags) ? raw.hashtags : [],
    scoreSummary: raw.scoreSummary || null,
    timeSeriesPoses: raw.time_series_poses || raw.timeSeriesPoses || null,
    comments: [],
    raw,
    isValidForFeed: Boolean(
      firstValue(user.id, user.user_id, raw.author_id, raw.user_id) &&
      (content || isValidMediaList(rawVideos)),
    ),
  };
}

export function normalizeComment(raw = {}, source = ACTIVE_SOURCES.SERVER) {
  const author = raw.author || raw.user || {};
  const content = firstValue(raw.content, raw.comment, raw.described, raw.body, "");
  const score = firstValue(raw.score, raw.point, raw.mark, "");

  return {
    id: String(firstValue(raw.id, raw.comment_id, raw._id, `${source}_comment_${Date.now()}`)),
    source,
    author: {
      id: String(firstValue(author.id, author.user_id, raw.user_id, "")),
      name: firstValue(author.name, author.username, raw.authorName, raw.author_name, "Người dùng"),
      avatar: firstValue(author.avatar, author.avatar_url, raw.avatar, ""),
    },
    authorName: firstValue(author.name, author.username, raw.authorName, raw.author_name, "Người dùng"),
    content,
    createdAt: firstValue(raw.createdAt, raw.created_at, raw.created, raw.time, new Date().toISOString()),
    score: score ? String(score) : "",
    detailMistakes: firstValue(raw.detailMistakes, raw.detail_mistakes, raw.details, ""),
    isScoreComment: Boolean(score || raw.detailMistakes || raw.detail_mistakes),
    raw,
  };
}
