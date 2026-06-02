import { backendApi } from "@/api/client";
import { DEFAULT_DEVICE_TOKEN } from "@/config/env";
import {
  extractList,
  extractObject,
  normalizePost,
} from "@/repositories/normalizers";
import { assertBackendOk } from "@/repositories/serverResponse";
import {
  ACTIVE_SOURCES,
  getCurrentSession,
  getSourceLabel,
  isServerPost,
} from "@/repositories/source";
import * as localPosts from "@/services/postStore";

function serverResult(value) {
  if (value == null) return value;

  return {
    ...value,
    source: ACTIVE_SOURCES.SERVER,
    sourceLabel: getSourceLabel(ACTIVE_SOURCES.SERVER),
  };
}

function assertServerSession(session) {
  if (!session?.token) {
    throw new Error("Cần đăng nhập server để dùng dữ liệu backend.");
  }
}

function shouldUsePostApi(session) {
  if (!session?.token) return false;
  if (session?.demoMode || session?.source === ACTIVE_SOURCES.LOCAL) {
    return false;
  }

  return true;
}

function normalizeServerPostList(response) {
  return extractList(response)
    .map((item) => normalizePost(item, ACTIVE_SOURCES.SERVER))
    .filter((item) => item.id && item.isValidForFeed);
}

function isValidThumbnailUrl(url = "") {
  const value = typeof url === "string" ? url.trim() : "";
  if (!value) return false;
  return /[?&]is_thumb=true(?:#.*)?$/i.test(value);
}

function hasInvalidThumbInPost(post) {
  const thumbnails = (post?.videos || [])
    .map((video) =>
      typeof video?.thumb === "string" ? video.thumb.trim() : "",
    )
    .filter(Boolean);

  if (!thumbnails.length) return false;
  return thumbnails.some((thumb) => !isValidThumbnailUrl(thumb));
}

function normalizeServerFeedList(response) {
  return normalizeServerPostList(response).filter(
    (post) => !hasInvalidThumbInPost(post),
  );
}

function normalizeServerPostObject(response) {
  const post = normalizePost(extractObject(response), ACTIVE_SOURCES.SERVER);
  return post.id ? post : null;
}

function isDemoVideo(video) {
  return (
    !video?.uri ||
    video.uri.startsWith("demo://") ||
    video.uri.startsWith("mock://")
  );
}

function durationMs(video = {}) {
  const value = Number(video.durationMs || video.duration || 0);
  if (!Number.isFinite(value) || value <= 0) return 0;
  return value > 1000 ? value : value * 1000;
}

function normalizeApiBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes"].includes(normalized)) return true;
    if (["0", "false", "no"].includes(normalized)) return false;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  return Boolean(value);
}

function buildAddPostFields(session, params = {}) {
  const fields = {
    token: session.token,
    described: params.content || "",
    course_id: params.courseId || "",
    device_slave: DEFAULT_DEVICE_TOKEN,
    device_master: DEFAULT_DEVICE_TOKEN,
  };

  if (params.exerciseId) {
    fields.exercise_id = params.exerciseId;
  }

  if (params.sourcePostId) {
    fields.source_post_id = params.sourcePostId;
  }

  return fields;
}

function validateVideoInput(video = {}, index = 0) {
  if (isDemoVideo(video)) {
    throw new Error("Server mode không chấp nhận video demo.");
  }

  if (!video.uri && !video.file && !video.blob) {
    throw new Error(`Video ${index + 1} không có dữ liệu file hợp lệ.`);
  }

  const ms = durationMs(video);
  if (!ms) {
    throw new Error(`Không đọc được thời lượng video ${index + 1}.`);
  }

  if (ms < 10_000) {
    throw new Error(`Video ${index + 1} phải dài tối thiểu 10 giây.`);
  }

  return ms;
}

function isLocalUploadVideo(video = {}) {
  return Boolean(video?.isLocalUpload || video?.file || video?.blob);
}

export function validateEditableVideos(videos = []) {
  const filteredVideos = Array.isArray(videos) ? videos.filter(Boolean) : [];
  const localVideos = filteredVideos.filter(isLocalUploadVideo);

  if (!localVideos.length) {
    return true;
  }

  localVideos.forEach((video, index) => {
    validateVideoInput(video, index);
  });

  if (filteredVideos.length !== 2) {
    return true;
  }

  const [first, second] = filteredVideos.map(durationMs);
  if (!first || !second) {
    return true;
  }

  const allowedDiff = Math.max(3_000, Math.max(first, second) * 0.2);
  if (Math.abs(first - second) > allowedDiff) {
    throw new Error("Hai video cần có thời lượng tương đương nhau.");
  }

  return true;
}

export function validateTwoVideos(videos = []) {
  if (!Array.isArray(videos) || videos.length !== 2) {
    throw new Error("Bài viết cần đúng 2 video.");
  }

  videos.forEach((video, index) => {
    validateVideoInput(video, index);
  });

  const [first, second] = videos.map(durationMs);
  const allowedDiff = Math.max(3_000, Math.max(first, second) * 0.2);
  if (Math.abs(first - second) > allowedDiff) {
    throw new Error("Hai video cần có thời lượng tương đương nhau.");
  }

  return true;
}

function extractFeedMeta(response, params, itemCount) {
  const data =
    response?.data && !Array.isArray(response.data) ? response.data : {};
  const requestedCount = Number(params.count || 10);
  const rawLastId =
    data.last_id || data.lastId || response?.last_id || response?.lastId || "";
  const hasMore =
    data.has_more ??
    data.hasMore ??
    response?.has_more ??
    response?.hasMore ??
    (Boolean(rawLastId) && itemCount >= requestedCount);
  const newItems = Number(
    data.new_items ||
      data.newItems ||
      response?.new_items ||
      response?.newItems ||
      0,
  );

  return {
    lastId: String(rawLastId || params.lastId || params.last_id || ""),
    hasMore: normalizeApiBoolean(hasMore),
    newItems: Number.isFinite(newItems) ? newItems : 0,
    total: Number(data.total || response?.total || itemCount),
  };
}

export async function getFeedPage(params = {}) {
  const session = await getCurrentSession();
  assertServerSession(session);
  const response = await backendApi.getListPosts({
    token: session.token,
    index: String(params.index || 0),
    count: String(params.count || 10),
    last_id: params.lastId || params.last_id || "",
    category_id: params.categoryId || params.category_id || "",
  });

  await assertBackendOk(response, {
    allowNoData: true,
    message: "Backend feed failed",
  });

  const items = normalizeServerFeedList(response);
  const meta = extractFeedMeta(response, params, items.length);
  return serverResult({
    items,
    total: meta.total,
    hasMore: meta.hasMore,
    lastId: meta.lastId,
    newItems: meta.newItems,
  });
}

export async function getPostById(postId) {
  const session = await getCurrentSession();
  assertServerSession(session);
  const response = await backendApi.getPost({
    token: session.token,
    id: postId,
  });

  await assertBackendOk(response, {
    message: "Backend post detail failed",
  });

  return serverResult(normalizeServerPostObject(response));
}

export async function toggleLike(post) {
  const targetPost = typeof post === "string" ? await getPostById(post) : post;
  if (!targetPost?.id || !isServerPost(targetPost)) {
    throw new Error("Backend mode chỉ hỗ trợ thao tác với bài viết từ server.");
  }

  console.log("token: ", (await getCurrentSession())?.token);

  const session = await getCurrentSession();
  assertServerSession(session);

  const response = await backendApi.like({
    token: session.token,
    id: targetPost.id,
  });

  await assertBackendOk(response, { message: "Backend like failed" });

  const isLiked = !targetPost.isLiked;
  // console.log("like count: ", targetPost.likeCount);
  // console.log("comment count: ", targetPost.commentCount);
  return {
    ...targetPost,
    isLiked,
    likeCount: Math.max(0, targetPost.likeCount + (isLiked ? 1 : -1)),
  };
}

export async function searchPosts(query = "", options = {}) {
  const session = await getCurrentSession();
  const userId = options.userId || options.user_id || "";

  try {
    assertServerSession(session);
    const response = await backendApi.search({
      token: session.token,
      keyword: query,
      index: "0",
      count: "10",
      ...(userId ? { user_id: userId } : {}),
    });

    await assertBackendOk(response, { message: "Backend search failed" });

    return normalizeServerPostList(response);
  } catch (error) {
    console.info("[DATA] Server search fallback", error.message);
    throw error;
  }
}

export async function getSavedSearches() {
  const session = await getCurrentSession();

  try {
    assertServerSession(session);
    const response = await backendApi.getSavedSearch({
      token: session.token,
      index: "0",
      count: "10",
    });

    await assertBackendOk(response, {
      allowNoData: true,
      message: "Backend saved search failed",
    });

    return extractList(response).map((item) => ({
      id: String(item.id || item.search_id || item.keyword || Date.now()),
      keyword: item.keyword || item.value || item.text || "",
      createdAt: item.created_at || item.createdAt || new Date().toISOString(),
    }));
  } catch (error) {
    console.info("[DATA] Server saved search unavailable", error.message);
    throw error;
  }
}

export async function deleteSavedSearch(searchId) {
  const session = await getCurrentSession();

  assertServerSession(session);

  const response = await backendApi.delSavedSearch({
    token: session.token,
    search_id: searchId,
    all: "0",
  });

  await assertBackendOk(response, {
    message: "Backend del_saved_search failed",
  });

  return true;
}

export async function editPost(post, params = {}) {
  if (!isServerPost(post)) {
    return localPosts.updatePost(post.id, params);
  }

  const session = await getCurrentSession();
  assertServerSession(session);
  const multipartVideos = (params.videos || [])
    .filter((video) => video && isLocalUploadVideo(video))
    .map((video, index) => ({
      ...video,
      fieldName:
        video.fieldName ||
        (index === 0 ? "left_video" : "right_video"),
    }));

  if (params.videos?.length) {
    validateEditableVideos(params.videos);
  }

  const fields = {
    token: session.token,
    id: post.id,
    described:
      params.content ||
      params.described ||
      post.described ||
      post.content ||
      "",
  };

  const response = await backendApi.editPostMultipart(fields, multipartVideos);
  await assertBackendOk(response, { message: "Backend edit_post failed" });

  return (
    normalizeServerPostObject(response) || {
      ...post,
      content: params.content || post.content,
      described: params.described || params.content || post.described,
    }
  );
}

export async function deletePost(post) {
  if (!isServerPost(post)) {
    await localPosts.deletePost(post.id);
    return { deleted: true, source: ACTIVE_SOURCES.LOCAL };
  }

  const session = await getCurrentSession();
  assertServerSession(session);
  const response = await backendApi.deletePost({
    token: session.token,
    id: post.id,
  });

  await assertBackendOk(response, { message: "Backend delete_post failed" });

  return { deleted: true, source: ACTIVE_SOURCES.SERVER };
}

export async function reportPost(post, reason = "") {
  if (!isServerPost(post)) {
    await localPosts.reportPost(post.id, reason);
    return { reported: true, source: ACTIVE_SOURCES.LOCAL };
  }

  const session = await getCurrentSession();
  assertServerSession(session);
  const response = await backendApi.reportPost({
    token: session.token,
    id: post.id,
    subject: reason || "Báo cáo bài viết",
    details: reason || "Nội dung không phù hợp",
  });

  await assertBackendOk(response, { message: "Backend report_post failed" });

  return { reported: true, source: ACTIVE_SOURCES.SERVER };
}

export async function checkNewItems(lastId = "") {
  const session = await getCurrentSession();

  assertServerSession(session);
  let response = await backendApi.checkNewItem({
    token: session.token,
    last_id: lastId,
    category_id: "",
  });

  if (
    String(response?.message || "").includes("property token should not exist")
  ) {
    console.info(
      "[DATA] check_new_item deployed compatibility: retrying without token",
    );
    response = await backendApi.checkNewItem({
      last_id: lastId,
      category_id: "",
    });
  }

  await assertBackendOk(response, { message: "Backend check_new_item failed" });

  const count = Number(
    response.data?.new_items ?? response.data?.count ?? response.count ?? 0,
  );
  const hasNewValue =
    response.data?.has_new ??
    response.data?.new_items ??
    response.has_new ??
    count;

  return {
    hasNew: normalizeApiBoolean(hasNewValue, count > 0),
    count: Number.isFinite(count) ? count : 0,
    source: ACTIVE_SOURCES.SERVER,
    raw: response,
  };
}

export async function getExercisePosts() {
  const result = await getFeedPage({ index: 0, count: 20 });
  return result.items.filter(
    (post) => post.type === "exercise" || post.canSubmit,
  );
}

export async function createPost(params) {
  const session = await getCurrentSession();
  const videos = params.videos || [];
  const allowServer = shouldUsePostApi(session);

  if (!allowServer) {
    return localPosts.createPost({
      content: params.content || "",
      videos,
      courseId: params.courseId || "",
      exerciseId: params.exerciseId || "",
      sourcePostId: params.sourcePostId || "",
    });
  }

  try {
    assertServerSession(session);
    validateTwoVideos(videos);
    const response = await backendApi.addPost(
      buildAddPostFields(session, params),
      videos.map((video, index) => ({
        ...video,
        fieldName: index === 0 ? "left_video" : "right_video",
      })),
    );

    await assertBackendOk(response, { message: "Backend add_post failed" });
    return (
      normalizeServerPostObject(response) || {
        id: String(response?.data?.id || response?.data?.post_id || Date.now()),
        source: ACTIVE_SOURCES.SERVER,
        content: params.content || "",
        described: params.content || "",
        videos,
        author: {
          id: session.id,
          name: session.displayName || session.username,
          role: session.role || "HV",
        },
        createdAt: new Date().toISOString(),
        likeCount: 0,
        commentCount: 0,
        canComment: true,
        canSubmit: false,
        courseId: params.courseId || "",
        exerciseId: params.exerciseId || "",
      }
    );
  } catch (error) {
    throw error;
  }
}

export async function createLocalPost(params) {
  return localPosts.createPost(params);
}

export async function createExerciseSubmission(params) {
  const session = await getCurrentSession();
  const videos = params.videos || [];
  const allowServer = shouldUsePostApi(session);

  if (!allowServer) {
    return localPosts.createExerciseSubmission({
      content: params.content || "",
      videos,
      courseId: params.courseId || "",
      exerciseId: params.exerciseId || "",
      sourcePostId: params.sourcePostId || "",
    });
  }

  try {
    assertServerSession(session);
    validateTwoVideos(videos);
    const response = await backendApi.addPost(
      buildAddPostFields(session, params),
      videos.map((video, index) => ({
        ...video,
        fieldName: index === 0 ? "left_video" : "right_video",
      })),
    );

    await assertBackendOk(response, { message: "Backend add_post failed" });

    return (
      normalizeServerPostObject(response) || {
        id: String(response?.data?.id || response?.data?.post_id || Date.now()),
        source: ACTIVE_SOURCES.SERVER,
        content: params.content || "",
        described: params.content || "",
        videos,
        author: {
          id: session.id,
          name: session.displayName || session.username,
          role: session.role || "HV",
        },
        createdAt: new Date().toISOString(),
        likeCount: 0,
        commentCount: 0,
        canComment: true,
        canSubmit: false,
        courseId: params.courseId || "",
        exerciseId: params.exerciseId || "",
      }
    );
  } catch (error) {
    console.info("[DATA] Server add_post failed", error.message);
    throw error;
  }
}
