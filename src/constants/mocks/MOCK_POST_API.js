import MOCK_GET_LIST_POSTS from "@/constants/mocks/MOCK_GET_LIST_POSTS";
import MOCK_GET_POST from "@/constants/mocks/MOCK_GET_POST";
import * as postStore from "@/services/postStore";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function toStringValue(value = "") {
  return value == null ? "" : String(value);
}

function toFlag(value) {
  return value ? "1" : "0";
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function buildMockAuthor(author = {}) {
  const name = author.name || author.username || "Người dùng";

  return {
    id: toStringValue(author.id),
    name,
    username: name,
    user_name: name,
    avatar: toStringValue(author.avatar),
    role: toStringValue(author.role || "HV"),
    handle: toStringValue(author.handle),
  };
}

function buildMockVideo(video = {}, index = 0) {
  return {
    id: toStringValue(video.id || `video_${index + 1}`),
    url: toStringValue(video.uri),
    thumb: toStringValue(video.thumb),
    angle: toStringValue(
      video.angle || (index === 0 ? "Góc quay trái" : "Góc quay phải"),
    ),
    duration: toStringValue(video.duration || 0),
    file_size: toStringValue(video.fileSize || 0),
    mime_type: toStringValue(video.mimeType || "video/mp4"),
    name: toStringValue(video.name || `video-${index + 1}.mp4`),
  };
}

function buildMockPost(post = {}) {
  const commentCount = Array.isArray(post.comments)
    ? post.comments.length
    : toNumber(post.commentCount, 0);

  return {
    id: toStringValue(post.id),
    post_id: toStringValue(post.id),
    type: toStringValue(post.type || "post"),
    described: toStringValue(post.described || post.content),
    created: toStringValue(post.createdAt || new Date().toISOString()),
    modified: toStringValue(post.createdAt || new Date().toISOString()),
    like: toStringValue(post.likeCount || 0),
    comment: toStringValue(commentCount),
    like_count: toNumber(post.likeCount, 0),
    comment_count: commentCount,
    is_liked: toFlag(post.isLiked),
    isLiked: Boolean(post.isLiked),
    can_comment: toFlag(post.canComment !== false),
    canComment: post.canComment !== false,
    can_edit: toFlag(Boolean(post.canEdit)),
    canEdit: Boolean(post.canEdit),
    can_submit: toFlag(Boolean(post.canSubmit)),
    canSubmit: Boolean(post.canSubmit),
    is_blocked: "0",
    banned: "0",
    video: Array.isArray(post.videos)
      ? post.videos.map(buildMockVideo)
      : [],
    author: buildMockAuthor(post.author),
    course_id: toStringValue(post.courseId),
    exercise_id: toStringValue(post.exerciseId),
    source_post_id: toStringValue(post.sourcePostId),
    course_title: toStringValue(post.courseTitle),
    exercise_title: toStringValue(post.exerciseTitle),
    hashtags: Array.isArray(post.hashtags) ? clone(post.hashtags) : [],
    score_summary: post.scoreSummary ? clone(post.scoreSummary) : null,
    time_series_poses: clone(
      post.timeSeriesPoses || post.raw?.time_series_poses || [],
    ),
  };
}

function buildMockComment(comment = {}) {
  const authorName = toStringValue(comment.authorName || "Người dùng");
  const avatar = toStringValue(comment.avatar);
  const content = toStringValue(comment.content);

  return {
    id: toStringValue(comment.id),
    comment_id: toStringValue(comment.id),
    comment: content,
    content,
    created: toStringValue(comment.createdAt || new Date().toISOString()),
    created_at: toStringValue(comment.createdAt || new Date().toISOString()),
    score: toStringValue(comment.score),
    detail_mistakes: toStringValue(comment.detailMistakes),
    poster: {
      name: authorName,
      avatar,
    },
    author: {
      name: authorName,
      avatar,
    },
    author_name: authorName,
    avatar,
  };
}

function buildLocalVideoInput(file = {}, index = 0) {
  return {
    id: toStringValue(file.id || `video_${index + 1}`),
    name: toStringValue(file.name || file.fileName || `video-${index + 1}.mp4`),
    uri: toStringValue(file.uri),
    thumb: toStringValue(file.thumb),
    angle: toStringValue(
      file.angle || (index === 0 ? "Góc quay trái" : "Góc quay phải"),
    ),
    duration: toNumber(file.durationMs || file.duration, 0),
    fileSize: toNumber(file.fileSize, 0),
    mimeType: toStringValue(file.mimeType || file.type || "video/mp4"),
  };
}

function buildListResponse(posts = [], params = {}) {
  const count = Math.max(1, Number(params?.count || 20));
  const requestedLastId = toStringValue(params?.last_id || params?.lastId);
  const requestedIndex = Math.max(0, Number(params?.index || 0));
  const lastIdIndex = requestedLastId
    ? posts.findIndex((item) => toStringValue(item?.id) === requestedLastId)
    : -1;
  const startIndex =
    lastIdIndex >= 0 ? lastIdIndex + 1 : Math.min(requestedIndex, posts.length);
  const sliced = posts.slice(startIndex, startIndex + count);
  const lastItem = sliced[sliced.length - 1];
  const hasMore = startIndex + sliced.length < posts.length;

  return {
    ...clone(MOCK_GET_LIST_POSTS),
    data: {
      ...clone(MOCK_GET_LIST_POSTS.data),
      posts: sliced.map(buildMockPost),
      last_id: toStringValue(lastItem?.id),
      has_more: hasMore ? "1" : "0",
      total: toStringValue(posts.length),
      new_items: "0",
    },
  };
}

function buildDetailResponse(post) {
  return {
    ...clone(MOCK_GET_POST),
    data: post ? [buildMockPost(post)] : [],
  };
}

function buildNotFoundResponse() {
  return {
    code: "9994",
    message: "No data or end of list data",
    data: [],
  };
}

export async function getMockGetListPostsResponse(params = {}) {
  try {
    const posts = await postStore.getPosts();
    return buildListResponse(posts, params);
  } catch {
    return clone(MOCK_GET_LIST_POSTS);
  }
}

export async function getMockGetPostResponse(params = {}) {
  try {
    const postId = toStringValue(params?.id);
    const post = await postStore.getPostById(postId);
    return post ? buildDetailResponse(post) : buildNotFoundResponse();
  } catch {
    return clone(MOCK_GET_POST);
  }
}

export async function getMockAddPostResponse(fields = {}, files = []) {
  const params = {
    content: toStringValue(fields?.described),
    courseId: toStringValue(fields?.course_id),
    exerciseId: toStringValue(fields?.exercise_id),
    sourcePostId: toStringValue(fields?.source_post_id),
    videos: Array.isArray(files) ? files.filter(Boolean).map(buildLocalVideoInput) : [],
  };

  const post = params.exerciseId
    ? await postStore.createExerciseSubmission(params)
    : await postStore.createPost(params);

  return buildDetailResponse(post);
}

export async function getMockEditPostResponse(fields = {}, files = []) {
  const postId = toStringValue(fields?.id);
  const existingPost = await postStore.getPostById(postId);

  if (!existingPost) {
    return buildNotFoundResponse();
  }

  const updatedPost = await postStore.updatePost(postId, {
    content: toStringValue(fields?.described ?? existingPost.content),
    described: toStringValue(fields?.described ?? existingPost.described),
    videos:
      Array.isArray(files) && files.length > 0
        ? files.filter(Boolean).map(buildLocalVideoInput)
        : existingPost.videos,
  });

  return buildDetailResponse(updatedPost);
}

export async function getMockDeletePostResponse(params = {}) {
  const postId = toStringValue(params?.id);
  await postStore.deletePost(postId);

  return {
    code: "1000",
    message: "OK",
    data: {
      id: postId,
      deleted: "1",
    },
  };
}

export async function getMockReportPostResponse(params = {}) {
  const postId = toStringValue(params?.id);
  const reason = toStringValue(params?.details || params?.subject);
  await postStore.reportPost(postId, reason);

  return {
    code: "1000",
    message: "OK",
    data: {
      id: postId,
      reported: "1",
    },
  };
}

export async function getMockLikePostResponse(params = {}) {
  const postId = toStringValue(params?.id);
  const post = await postStore.toggleLike(postId);
  return post ? buildDetailResponse(post) : buildNotFoundResponse();
}

export async function getMockGetCommentResponse(params = {}) {
  const postId = toStringValue(params?.id);
  const result = await postStore.getComments(postId, {
    index: params?.index,
    count: params?.count,
  });

  return {
    code: "1000",
    message: "OK",
    data: {
      data: Array.isArray(result.comments)
        ? result.comments.map(buildMockComment)
        : [],
      is_blocked: "0",
      total: toStringValue(result.total || 0),
    },
  };
}

export async function getMockSetCommentResponse(params = {}) {
  const postId = toStringValue(params?.id);
  const commentText = toStringValue(params?.comment).trim();

  const result = await postStore.addComment(postId, commentText);

  return {
    code: "1000",
    message: "OK",
    data: {
      data: result?.comment ? [buildMockComment(result.comment)] : [],
    },
  };
}

export async function getMockCheckNewItemResponse(params = {}) {
  const lastId = toStringValue(params?.last_id || params?.lastId);
  const newItems = await postStore.getNewItemsCount(lastId);

  return {
    code: "1000",
    message: "OK",
    data: {
      last_id: lastId,
      new_items: toStringValue(newItems),
      has_new: toFlag(newItems > 0),
    },
  };
}
