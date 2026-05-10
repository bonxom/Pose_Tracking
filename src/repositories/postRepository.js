import { backendApi } from "@/api/client";
import { DEFAULT_DEVICE_TOKEN } from "@/config/env";
import * as localPosts from "@/services/postStore";
import {
  extractList,
  extractObject,
  isBackendOk,
  normalizePost,
} from "@/repositories/normalizers";
import {
  ACTIVE_SOURCES,
  canFallbackToLocal,
  getCurrentSession,
  getSourceLabel,
  isServerPost,
  shouldUseServer,
} from "@/repositories/source";

function localResult(value, fallback = false) {
  if (value == null) return value;

  return {
    ...value,
    source: fallback ? ACTIVE_SOURCES.LOCAL_FALLBACK : ACTIVE_SOURCES.LOCAL,
    sourceLabel: getSourceLabel(fallback ? ACTIVE_SOURCES.LOCAL_FALLBACK : ACTIVE_SOURCES.LOCAL),
  };
}

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

async function withServerFallback(serverFn, localFn) {
  const session = await getCurrentSession();

  if (!shouldUseServer(session)) {
    return localResult(await localFn(), false);
  }

  try {
    assertServerSession(session);
    return serverResult(await serverFn(session));
  } catch (error) {
    console.info("[DATA] Server post repository fallback", error.message);

    if (canFallbackToLocal()) {
      return localResult(await localFn(), true);
    }

    throw error;
  }
}

function normalizeServerPostList(response) {
  return extractList(response)
    .map((item) => normalizePost(item, ACTIVE_SOURCES.SERVER))
    .filter((item) => item.id);
}

function normalizeServerPostObject(response) {
  const post = normalizePost(extractObject(response), ACTIVE_SOURCES.SERVER);
  return post.id ? post : null;
}

function isDemoVideo(video) {
  return !video?.uri || video.uri.startsWith("demo://") || video.uri.startsWith("mock://");
}

export async function getFeedPage(params = {}) {
  return withServerFallback(
    async (session) => {
      const response = await backendApi.getListPosts({
        token: session.token,
        index: String(params.index || 0),
        count: String(params.count || 10),
        last_id: params.lastId || params.last_id || "",
        category_id: params.categoryId || params.category_id || "",
      });

      if (!isBackendOk(response) && response?.code !== "9994") {
        throw new Error(response?.message || "Backend feed failed");
      }

      const items = normalizeServerPostList(response);
      return {
        items,
        total: items.length,
        hasMore: false,
        lastId: items[0]?.id || "",
      };
    },
    () => localPosts.getFeedPage(params),
  );
}

export async function getPostById(postId) {
  return withServerFallback(
    async (session) => {
      const response = await backendApi.getPost({
        token: session.token,
        id: postId,
      });

      if (!isBackendOk(response)) {
        throw new Error(response?.message || "Backend post detail failed");
      }

      return normalizeServerPostObject(response);
    },
    async () => localPosts.getPostById(postId),
  );
}

export async function toggleLike(post) {
  const targetPost = typeof post === "string" ? await localPosts.getPostById(post) : post;

  if (!isServerPost(targetPost)) {
    return localPosts.toggleLike(targetPost?.id || post);
  }

  const session = await getCurrentSession();
  assertServerSession(session);

  const response = await backendApi.like({
    token: session.token,
    id: targetPost.id,
  });

  if (!isBackendOk(response)) {
    throw new Error(response?.message || "Backend like failed");
  }

  const isLiked = !targetPost.isLiked;
  return {
    ...targetPost,
    isLiked,
    likeCount: Math.max(0, targetPost.likeCount + (isLiked ? 1 : -1)),
  };
}

export async function searchPosts(query = "") {
  const session = await getCurrentSession();

  if (!shouldUseServer(session) || !query.trim()) {
    return localPosts.searchPosts(query);
  }

  try {
    assertServerSession(session);
    const response = await backendApi.search({
      token: session.token,
      keyword: query,
      index: "0",
      count: "20",
    });

    if (!isBackendOk(response)) {
      throw new Error(response?.message || "Backend search failed");
    }

    return normalizeServerPostList(response);
  } catch (error) {
    console.info("[DATA] Server search fallback", error.message);

    if (canFallbackToLocal()) {
      return localPosts.searchPosts(query);
    }

    throw error;
  }
}

export async function getExercisePosts() {
  const result = await getFeedPage({ index: 0, count: 20 });
  return result.items.filter((post) => post.type === "exercise" || post.canSubmit);
}

export async function createPost(params) {
  return localPosts.createPost(params);
}

export async function createExerciseSubmission(params) {
  const session = await getCurrentSession();
  const videos = params.videos || [];
  const hasOnlyDemoVideos = videos.some(isDemoVideo);

  if (!shouldUseServer(session) || hasOnlyDemoVideos) {
    if (shouldUseServer(session) && hasOnlyDemoVideos && !canFallbackToLocal()) {
      throw new Error("Server mode cần 2 video thật, không dùng placeholder demo.");
    }

    return localPosts.createExerciseSubmission(params);
  }

  try {
    assertServerSession(session);
    const response = await backendApi.addPost(
      {
        token: session.token,
        described: params.content || "",
        course_id: params.courseId || "",
        exercise_id: params.exerciseId || "",
        device_slave: DEFAULT_DEVICE_TOKEN,
      },
      videos.map((video, index) => ({
        ...video,
        fieldName: index === 0 ? "video1" : "video2",
      })),
    );

    if (!isBackendOk(response)) {
      throw new Error(response?.message || "Backend add_post failed");
    }

    return normalizeServerPostObject(response) || {
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
    };
  } catch (error) {
    console.info("[DATA] Server add_post failed", error.message);

    if (canFallbackToLocal()) {
      return localPosts.createExerciseSubmission(params);
    }

    throw error;
  }
}
