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
  sourceFromResponse,
} from "@/repositories/source";

function apiResult(value, source = ACTIVE_SOURCES.SERVER) {
  if (value == null) return value;

  return {
    ...value,
    source,
    sourceLabel: getSourceLabel(source),
  };
}

function normalizeApiPostList(response) {
  const source = sourceFromResponse(response);
  return extractList(response)
    .map((item) => normalizePost(item, source))
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

function normalizeApiFeedList(response) {
  return normalizeApiPostList(response).filter(
    (post) => !hasInvalidThumbInPost(post),
  );
}

function normalizeApiPostObject(response) {
  const post = normalizePost(extractObject(response), sourceFromResponse(response));
  return post.id ? post : null;
}

function isDemoVideo(video) {
  return (
    !video?.uri ||
    video.uri.startsWith("demo://")
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
    token: session?.token || "",
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

export function validateTwoVideos(videos = []) {
  if (!Array.isArray(videos) || videos.length !== 2) {
    throw new Error("Bài viết cần đúng 2 video.");
  }

  videos.forEach((video, index) => {
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
  const requestedCount = Number(params.count || 20);
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
    hasMore: Boolean(hasMore),
    newItems: Number.isFinite(newItems) ? newItems : 0,
    total: Number(data.total || response?.total || itemCount),
  };
}

export async function getFeedPage(params = {}) {
  const session = await getCurrentSession();
  const response = await backendApi.getListPosts({
    token: session?.token || "",
    index: String(params.index || 0),
    count: String(params.count || 20),
    last_id: params.lastId || params.last_id || "",
    category_id: params.categoryId || params.category_id || "",
  });

  await assertBackendOk(response, {
    allowNoData: true,
    message: "Backend feed failed",
  });

  const items = normalizeApiFeedList(response);
  const meta = extractFeedMeta(response, params, items.length);
  return apiResult({
    items,
    total: meta.total,
    hasMore: meta.hasMore,
    lastId: meta.lastId,
    newItems: meta.newItems,
  }, sourceFromResponse(response));
}

export async function getPostById(postId) {
  const session = await getCurrentSession();
  const response = await backendApi.getPost({
    token: session?.token || "",
    id: postId,
  });

  await assertBackendOk(response, {
    message: "Backend post detail failed",
  });

  return apiResult(normalizeApiPostObject(response), sourceFromResponse(response));
}

export async function toggleLike(post) {
  const targetPost = typeof post === "string" ? await getPostById(post) : post;
  if (!targetPost?.id) {
    throw new Error("Thiếu bài viết để thích/bỏ thích.");
  }

  const session = await getCurrentSession();

  const response = await backendApi.like({
    token: session?.token || "",
    id: targetPost.id,
  });

  await assertBackendOk(response, { message: "Backend like failed" });

  const normalized = normalizeApiPostObject(response);
  if (normalized) return normalized;

  const isLiked = !targetPost.isLiked;
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
    const response = await backendApi.search({
      token: session?.token || "",
      keyword: query,
      index: "0",
      count: "20",
      ...(userId ? { user_id: userId } : {}),
    });

    await assertBackendOk(response, { message: "Backend search failed" });

    return normalizeApiPostList(response);
  } catch (error) {
    console.info("[DATA] Search unavailable", error.message);
    throw error;
  }
}

export async function getSavedSearches() {
  const session = await getCurrentSession();

  try {
    const response = await backendApi.getSavedSearch({
      token: session?.token || "",
      index: "0",
      count: "20",
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

  const response = await backendApi.delSavedSearch({
    token: session?.token || "",
    search_id: searchId,
    all: "0",
  });

  await assertBackendOk(response, {
    message: "Backend del_saved_search failed",
  });

  return true;
}

export async function editPost(post, params = {}) {
  const session = await getCurrentSession();
  const fields = {
    token: session?.token || "",
    id: post.id,
    described:
      params.content ||
      params.described ||
      post.described ||
      post.content ||
      "",
  };

  const multipartVideos = (params.videos || []).map((video, index) => ({
    ...video,
    fieldName: index === 0 ? "left_video" : "right_video",
  }));

  const response = await backendApi.editPostMultipart(fields, multipartVideos);
  await assertBackendOk(response, { message: "Backend edit_post failed" });

  return (
    normalizeApiPostObject(response) || {
      ...post,
      content: params.content || post.content,
      described: params.described || params.content || post.described,
    }
  );
}

export async function deletePost(post) {
  const session = await getCurrentSession();
  const response = await backendApi.deletePost({
    token: session?.token || "",
    id: post.id,
  });

  await assertBackendOk(response, { message: "Backend delete_post failed" });

  return { deleted: true, source: sourceFromResponse(response) };
}

export async function reportPost(post, report = "") {
  const session = await getCurrentSession();
  const payload =
    report && typeof report === "object"
      ? report
      : {
          subject: report || "Báo cáo bài viết",
          details: report || "Nội dung không phù hợp",
        };

  const response = await backendApi.reportPost({
    token: session?.token || "",
    id: post.id,
    subject: payload.subject || "Báo cáo bài viết",
    details: payload.details || payload.subject || "Nội dung không phù hợp",
  });

  const code = String(response?.code || "");
  if (code === "1010") {
    return {
      reported: true,
      unavailable: true,
      source: sourceFromResponse(response),
    };
  }

  if (code === "1000") {
    return { reported: true, source: ACTIVE_SOURCES.SERVER };
  }

  await assertBackendOk(response, { message: "Backend report_post failed" });

  return { reported: true, source: sourceFromResponse(response) };
}

export async function checkNewItems(lastId = "") {
  const session = await getCurrentSession();

  let response = await backendApi.checkNewItem({
    token: session?.token || "",
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
    source: sourceFromResponse(response),
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

  try {
    const response = await backendApi.addPost(
      buildAddPostFields(session, params),
      videos.map((video, index) => ({
        ...video,
        fieldName: index === 0 ? "left_video" : "right_video",
      })),
    );

    await assertBackendOk(response, { message: "Backend add_post failed" });
    return (
      normalizeApiPostObject(response) || {
        id: String(response?.data?.id || response?.data?.post_id || Date.now()),
        source: sourceFromResponse(response),
        content: params.content || "",
        described: params.content || "",
        videos,
        author: {
          id: session?.id || "",
          name: session?.displayName || session?.username || "Người dùng",
          role: session?.role || "HV",
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
  return createPost(params);
}

export async function createExerciseSubmission(params) {
  const session = await getCurrentSession();
  const videos = params.videos || [];

  try {
    const response = await backendApi.addPost(
      buildAddPostFields(session, params),
      videos.map((video, index) => ({
        ...video,
        fieldName: index === 0 ? "left_video" : "right_video",
      })),
    );

    await assertBackendOk(response, { message: "Backend add_post failed" });

    return (
      normalizeApiPostObject(response) || {
        id: String(response?.data?.id || response?.data?.post_id || Date.now()),
        source: sourceFromResponse(response),
        content: params.content || "",
        described: params.content || "",
        videos,
        author: {
          id: session?.id || "",
          name: session?.displayName || session?.username || "Người dùng",
          role: session?.role || "HV",
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
    console.info("[DATA] add_post failed", error.message);
    throw error;
  }
}
