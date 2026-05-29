import {
  API_BASE_URL,
  API_DEBUG,
  API_TIMEOUT_MS,
  API_TYPE,
  API_TYPES,
  DEFAULT_DEVICE_TOKEN,
} from "@/config/env";
import {
  DEMO_BLOCKS,
  DEMO_CONVERSATIONS,
  DEMO_PUSH_SETTINGS,
} from "@/constants/demo";
import MOCK_ACCOUNTS from "@/constants/mocks/MOCK_ACCOUNTS";
import MOCK_GET_USER_INFO from "@/constants/mocks/MOCK_GET_USER_INFO";
import MOCK_LIST_COURSES from "@/constants/mocks/MOCK_LIST_COURSES";
import MOCK_LIST_STUDENTS from "@/constants/mocks/MOCK_LIST_STUDENTS";
import { MOCK_USERS } from "@/constants/mocks/users";
import {
  deleteMockSavedSearchResponse,
  getMockSavedSearchResponse,
  getMockSearchResponse,
} from "@/constants/mocks/MOCK_SEARCH";
import {
  getMockNotificationResponse,
  setMockNotificationRead,
} from "@/constants/mocks/MOCK_NOTIFICATION";
import MOCK_REQUESTED_ENROLLMENT from "@/constants/mocks/MOCK_REQUESTED_ENROLLMENT";
import {
  resolveMockProfile,
  saveMockProfile,
} from "@/constants/mocks/profiles";
import * as localPosts from "@/services/postStore";

const ADD_POST_TIMEOUT_MS = 10 * 60 * 1000;
const EDIT_POST_TIMEOUT_MS = ADD_POST_TIMEOUT_MS;
const MOCK_SOURCE = "local";
const DEMO_STUDENT_LOGIN = { phonenumber: "0900000001", password: "123456" };
const DEMO_TEACHER_LOGIN = { phonenumber: "0900000002", password: "123456" };
let mockPushSettings = { ...DEMO_PUSH_SETTINGS };
let mockBlocks = DEMO_BLOCKS.map((item) => ({ ...item }));

export class ApiError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "ApiError";
    this.status = details.status || 0;
    this.code = details.code || "NETWORK_ERROR";
    this.data = details.data || null;
  }
}

export function joinUrl(baseUrl = API_BASE_URL, path = "") {
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const cleanPath = String(path).replace(/^\/+/, "");
  return cleanPath ? `${cleanBase}/${cleanPath}` : cleanBase;
}

function logApi(message, details = {}) {
  if (API_DEBUG) {
    console.info(`[API] ${message}`, details);
  }
}

async function safeJson(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function request(path, body = {}, options = {}) {
  if (API_TYPE === API_TYPES.MOCK) {
    throw new ApiError("Backend requests are disabled in mock mode", {
      code: "MOCK_MODE_BACKEND_DISABLED",
    });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    options.timeout || API_TIMEOUT_MS,
  );
  const transport = options.transport || "json";
  const method = options.method || "POST";
  const headers = {
    Accept: "application/json",
    ...(options.headers || {}),
  };
  let payload = body;

  if (transport === "json") {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  if (transport === "form") {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    payload = new URLSearchParams(body).toString();
  }

  try {
    const url = joinUrl(options.baseUrl || API_BASE_URL, path);
    logApi("request", { url, transport, method });
    const response = await fetch(url, {
      method,
      headers,
      body: payload,
      signal: controller.signal,
    });
    const data = await safeJson(response);
    logApi("response", { path, status: response.status, code: data?.code });

    if (!response.ok) {
      throw new ApiError("Backend request failed", {
        status: response.status,
        code: data?.code || "HTTP_ERROR",
        data,
      });
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      error.name === "AbortError"
        ? "Backend request timed out"
        : "Backend unreachable",
      {
        code: error.name === "AbortError" ? "TIMEOUT" : "NETWORK_ERROR",
      },
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function post(path, body = {}, options = {}) {
  return request(path, body, { ...options, transport: "json" });
}

export async function del(path, body = {}, options = {}) {
  return request(path, body, {
    ...options,
    transport: "json",
    method: "DELETE",
  });
}

export async function postForm(path, body = {}, options = {}) {
  const normalizedBody = Object.fromEntries(
    Object.entries(body).map(([key, value]) => [
      key,
      value == null ? "" : String(value),
    ]),
  );
  return request(path, normalizedBody, { ...options, transport: "form" });
}

export async function postMultipart(
  path,
  fields = {},
  files = [],
  options = {},
) {
  const formData = new FormData();

  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });

  files.filter(Boolean).forEach((file, index) => {
    const fieldName = file.fieldName || `video${index + 1}`;
    const fileName = file.name || file.fileName || `video-${index + 1}.mp4`;

    if (file.file && typeof File !== "undefined" && file.file instanceof File) {
      formData.append(fieldName, file.file, fileName);
      return;
    }

    if (file.blob && typeof Blob !== "undefined" && file.blob instanceof Blob) {
      formData.append(fieldName, file.blob, fileName);
      return;
    }

    if (typeof File !== "undefined" && file instanceof File) {
      formData.append(fieldName, file, fileName);
      return;
    }

    formData.append(fieldName, {
      uri: file.uri,
      name: fileName,
      type: file.mimeType || file.type || "video/mp4",
    });
  });

  return request(path, formData, { ...options, transport: "multipart" });
}

function mockResponse(data = null, overrides = {}) {
  return {
    code: "1000",
    message: "OK",
    data,
    source: MOCK_SOURCE,
    ...overrides,
  };
}

function mockError(code = "1004", message = "Parameter value is invalid") {
  return {
    code,
    message,
    source: MOCK_SOURCE,
  };
}

function getMockPostId(params = {}) {
  return String(params.id || params.post_id || params.postId || "");
}

async function buildMockGetListPostsResponse(params = {}) {
  const userId = String(params.user_id || params.userId || "");
  const page = await localPosts.getFeedPage({
    index: params.index || 0,
    count: params.count || 20,
  });
  const items = userId
    ? page.items.filter((post) => String(post.author?.id || "") === userId)
    : page.items;

  return mockResponse({
    posts: items,
    last_id: items[items.length - 1]?.id || page.lastId || "",
    has_more: page.hasMore ? "1" : "0",
    total: String(userId ? items.length : page.total),
    new_items: "0",
  });
}

async function buildMockGetPostResponse(params = {}) {
  const post = await localPosts.getPostById(getMockPostId(params));
  return post ? mockResponse(post) : mockError("9994", "No data");
}

async function buildMockAddPostResponse(fields = {}, files = []) {
  const videos = files.map((file, index) => ({
    ...file,
    id: file.id || `mock_upload_video_${index + 1}`,
    uri: file.uri || file.url || file.name || `mock://video-${index + 1}`,
    duration: file.duration || file.durationMs || 12_000,
  }));
  const post = await localPosts.createPost({
    content: fields.described || fields.content || "",
    videos,
    courseId: fields.course_id || fields.courseId || "",
    exerciseId: fields.exercise_id || fields.exerciseId || "",
    sourcePostId: fields.source_post_id || fields.sourcePostId || "",
  });
  return mockResponse(post);
}

async function buildMockEditPostResponse(fields = {}, files = []) {
  const postId = getMockPostId(fields);
  const videos = files.length
    ? files.map((file, index) => ({
        ...file,
        id: file.id || `mock_edit_video_${index + 1}`,
        uri: file.uri || file.url || file.name || `mock://edited-${index + 1}`,
        duration: file.duration || file.durationMs || 12_000,
      }))
    : undefined;
  const updated = await localPosts.updatePost(postId, {
    content: fields.described || fields.content,
    described: fields.described || fields.content,
    ...(videos ? { videos } : {}),
  });
  return updated ? mockResponse(updated) : mockError("9994", "No data");
}

async function buildMockDeletePostResponse(params = {}) {
  await localPosts.deletePost(getMockPostId(params));
  return mockResponse([]);
}

async function buildMockReportPostResponse(params = {}) {
  await localPosts.reportPost(getMockPostId(params), params.details || params.subject || "");
  return mockResponse([]);
}

async function buildMockLikeResponse(params = {}) {
  const post = await localPosts.toggleLike(getMockPostId(params));
  return post ? mockResponse(post) : mockError("9994", "No data");
}

async function buildMockGetCommentResponse(params = {}) {
  const result = await localPosts.getComments(getMockPostId(params), {
    index: params.index || 0,
    count: params.count || 20,
  });
  return mockResponse({
    data: result.comments,
    is_blocked: "0",
    total: String(result.total),
  });
}

async function buildMockSetCommentResponse(params = {}) {
  const result = await localPosts.addComment(
    getMockPostId(params),
    params.comment || params.content || "",
  );
  return mockResponse([result.comment].filter(Boolean));
}

async function buildMockCheckNewItemResponse(params = {}) {
  const count = await localPosts.getNewItemsCount(params.last_id || params.lastId || "");
  return mockResponse({
    new_items: String(count),
    count: String(count),
    has_new: count > 0 ? "1" : "0",
  });
}

function buildMockGetUserInfoResponse(params = {}) {
  const list = Array.isArray(MOCK_GET_USER_INFO.data)
    ? MOCK_GET_USER_INFO.data
    : [];
  const requestedUserId = String(params?.user_id || "").trim();
  const token = String(params?.token || "").toLowerCase();
  const isTeacherToken = token.includes("teacher") || token.includes("gv");
  const defaultUser =
    list.find((item) =>
      isTeacherToken ? item.role === "GV" : item.role === "HV",
    ) || list[0];

  const matchedUser = requestedUserId
    ? list.find((item) => String(item.id) === requestedUserId)
    : defaultUser;

  if (!matchedUser) {
    return {
      ...MOCK_GET_USER_INFO,
      source: MOCK_SOURCE,
      data: [],
    };
  }

  const normalizedUser = requestedUserId
    ? { ...matchedUser, phonenumber: "" }
    : { ...matchedUser };

  return {
    source: MOCK_SOURCE,
    ...MOCK_GET_USER_INFO,
    data: [normalizedUser],
  };
}

function buildMockSetUserInfoResponse(params = {}) {
  const current = resolveMockProfile({}, params.user_id || params.id || "") || {};
  const id = String(current.id || params.user_id || params.id || "mock_current_user");
  const username = params.username || params.user_name || current.username || "Mock user";
  const updated = saveMockProfile({
    ...current,
    id,
    username,
    displayName: username,
    avatar: params.avatar || current.avatar || "",
    coverImage: params.coverImage || params.cover_image || current.coverImage || "",
    description: params.description || params.described || current.description || "",
  });

  return mockResponse(updated);
}

function buildMockGetListBlocksResponse() {
  return mockResponse({
    total: String(mockBlocks.length),
    users: mockBlocks,
  });
}

function buildMockSetBlockResponse(params = {}) {
  const targetId = String(params.userId || params.user_id || params.id || "");
  if (!targetId) return mockError("1002", "Parameter is not enough");

  if (String(params.type) === "1" || params.type === "unblock") {
    mockBlocks = mockBlocks.filter((item) => String(item.id) !== targetId);
    return mockResponse([]);
  }

  if (!mockBlocks.some((item) => String(item.id) === targetId)) {
    mockBlocks = [
      {
        id: targetId,
        username: `Mock user ${targetId.slice(0, 6)}`,
        role: "HV",
        avatar: "",
      },
      ...mockBlocks,
    ];
  }
  return mockResponse([]);
}

function buildMockPushSettingsResponse() {
  return mockResponse(mockPushSettings);
}

function buildMockSetPushSettingsResponse(params = {}) {
  mockPushSettings = {
    ...mockPushSettings,
    ...Object.fromEntries(
      Object.entries(params).filter(([key]) => key !== "token"),
    ),
  };
  return mockResponse(mockPushSettings);
}

function buildMockConversationListResponse() {
  return mockResponse(DEMO_CONVERSATIONS);
}

function buildMockConversationResponse(params = {}) {
  const conversationId = String(params.id || params.conversation_id || "");
  const conversation =
    DEMO_CONVERSATIONS.find((item) => String(item.id) === conversationId) ||
    DEMO_CONVERSATIONS[0];
  return mockResponse(conversation?.messages || []);
}

function buildMockLoginResponse(params = {}) {
  const { phonenumber, password } = params;

  if (!phonenumber || !password) {
    return {
      code: "1002",
      message: "Parameter is not enough",
      source: MOCK_SOURCE,
    };
  }

  const accounts = [...MOCK_ACCOUNTS, ...MOCK_USERS];
  const matchedUser = accounts.find(
    (item) =>
      item.phonenumber === String(phonenumber) &&
      item.password === String(password),
  );

  if (matchedUser) {
    const data = matchedUser.data || matchedUser;

    return {
      code: "1000",
      message: "OK",
      source: MOCK_SOURCE,
      data: {
        ...data,
        token: data.token || `mock_${data.role?.toLowerCase() || "hv"}_token`,
        active: data.active || "1",
      },
    };
  }

  const phoneExists = accounts.some(
    (item) => item.phonenumber === String(phonenumber),
  );

  if (phoneExists) {
    return {
      code: "1004",
      message: "Parameter value is invalid",
      source: MOCK_SOURCE,
    };
  }

  return {
    code: "9995",
    message: "User is not validated",
    source: MOCK_SOURCE,
  };
}

export const backendApi = {
  login: (params) =>
    API_TYPE === API_TYPES.MOCK
      ? Promise.resolve(buildMockLoginResponse(params))
      : post("/login", params),
  loginDemoStudent: () =>
    backendApi.login({ ...DEMO_STUDENT_LOGIN, devtoken: DEFAULT_DEVICE_TOKEN }),
  loginDemoTeacher: () =>
    backendApi.login({ ...DEMO_TEACHER_LOGIN, devtoken: DEFAULT_DEVICE_TOKEN }),
  logout: (params) =>
    API_TYPE === API_TYPES.MOCK
      ? Promise.resolve(mockResponse([]))
      : post("/logout", params),
  signup: (params) => post("/signup", params),
  getVerifyCode: (params) => post("/get_verify_code", params),
  checkVerifyCode: (params) => post("/check_verify_code", params),
  changeInfoAfterSignup: (params) => post("/change_info_after_signup", params),
  getListPosts: (params) =>
    API_TYPE === API_TYPES.MOCK
      ? Promise.resolve(buildMockGetListPostsResponse(params))
      : postForm("/get_list_posts", params),
  getPost: (params) =>
    API_TYPE === API_TYPES.MOCK
      ? Promise.resolve(buildMockGetPostResponse(params))
      : post("/get_post", params),
  addPost: (fields, files) =>
    API_TYPE === API_TYPES.MOCK
      ? buildMockAddPostResponse(fields, files)
      : postMultipart("/add_post", fields, files, {
          timeout: ADD_POST_TIMEOUT_MS,
        }),
  editPost: (params) =>
    API_TYPE === API_TYPES.MOCK
      ? buildMockEditPostResponse(params, [])
      : post("/edit_post", params, {
          timeout: EDIT_POST_TIMEOUT_MS,
        }),
  editPostMultipart: (fields, files) =>
    API_TYPE === API_TYPES.MOCK
      ? buildMockEditPostResponse(fields, files)
      : postMultipart("/edit_post", fields, files, {
          timeout: EDIT_POST_TIMEOUT_MS,
        }),
  deletePost: (params = {}) => {
    if (API_TYPE === API_TYPES.MOCK) {
      return buildMockDeletePostResponse(params);
    }

    const payload = {
      token: params.token || "",
    };

    const postId =
      params.id !== undefined && params.id !== null ? String(params.id) : "";

    const headers = {};
    if (postId) {
      headers.id = postId;
    }

    const endpoint = postId
      ? `/delete_post/${encodeURIComponent(postId)}`
      : "/delete_post";

    return del(endpoint, payload, { headers });
  },
  reportPost: (params) =>
    API_TYPE === API_TYPES.MOCK
      ? buildMockReportPostResponse(params)
      : post("/report_post", params),
  like: (params) =>
    API_TYPE === API_TYPES.MOCK
      ? buildMockLikeResponse(params)
      : post("/like_post", params),
  getComment: (params) =>
    API_TYPE === API_TYPES.MOCK
      ? buildMockGetCommentResponse(params)
      : post("/get_comment", params),
  setComment: (params) =>
    API_TYPE === API_TYPES.MOCK
      ? buildMockSetCommentResponse(params)
      : postForm("/set_comment", params),
  search: (params) =>
    API_TYPE === API_TYPES.MOCK
      ? getMockSearchResponse(params).then((response) => ({
          ...response,
          source: MOCK_SOURCE,
        }))
      : post("/search", params),
  getSavedSearch: (params) =>
    API_TYPE === API_TYPES.MOCK
      ? getMockSavedSearchResponse(params).then((response) => ({
          ...response,
          source: MOCK_SOURCE,
        }))
      : post("/get_saved_search", params),
  deleteSavedSearch: (params) =>
    API_TYPE === API_TYPES.MOCK
      ? deleteMockSavedSearchResponse(params).then((response) => ({
          ...response,
          source: MOCK_SOURCE,
        }))
      : post("/del_saved_search", params),
  delSavedSearch: (params) =>
    API_TYPE === API_TYPES.MOCK
      ? deleteMockSavedSearchResponse(params).then((response) => ({
          ...response,
          source: MOCK_SOURCE,
        }))
      : post("/del_saved_search", params),
  getListStudents: (params) =>
    API_TYPE === API_TYPES.MOCK
      ? Promise.resolve({ ...MOCK_LIST_STUDENTS, source: MOCK_SOURCE })
      : post("/get_list_students", params),
  getListCoursesOfStudent: (params) =>
    API_TYPE === API_TYPES.MOCK
      ? Promise.resolve({ ...MOCK_LIST_COURSES, source: MOCK_SOURCE })
      : post("/get_list_courses_of_student", params),
  getUserInfo: (params) =>
    API_TYPE === API_TYPES.MOCK
      ? Promise.resolve(buildMockGetUserInfoResponse(params))
      : post("/get_user_info", params),
  setUserInfo: (params) =>
    API_TYPE === API_TYPES.MOCK
      ? Promise.resolve(buildMockSetUserInfoResponse(params))
      : post("/set_user_info", params),
  getListBlocks: (params) =>
    API_TYPE === API_TYPES.MOCK
      ? Promise.resolve(buildMockGetListBlocksResponse(params))
      : post("/get_list_blocks", params),
  setBlock: (params) =>
    API_TYPE === API_TYPES.MOCK
      ? Promise.resolve(buildMockSetBlockResponse(params))
      : post("/set_block", params),
  setApproveEnrollment: (params) =>
    API_TYPE === API_TYPES.MOCK
      ? Promise.resolve(mockResponse([]))
      : post("/set_approve_enrollment", params),
  getRequestedEnrollment: (params) =>
    API_TYPE === API_TYPES.MOCK
      ? Promise.resolve({ ...MOCK_REQUESTED_ENROLLMENT, source: MOCK_SOURCE })
      : post("/get_requested_enrollment", params),
  setRequestCourse: (params) =>
    API_TYPE === API_TYPES.MOCK
      ? Promise.resolve(mockResponse({ id: `mock_request_${Date.now()}` }))
      : post("/set_request_course", params),
  getListCourses: (params) =>
    API_TYPE === API_TYPES.MOCK
      ? Promise.resolve({ ...MOCK_LIST_COURSES, source: MOCK_SOURCE })
      : post("/get_list_courses", params),
  getPushSettings: (params) =>
    API_TYPE === API_TYPES.MOCK
      ? Promise.resolve(buildMockPushSettingsResponse(params))
      : post("/get_push_settings", params),
  setPushSettings: (params) =>
    API_TYPE === API_TYPES.MOCK
      ? Promise.resolve(buildMockSetPushSettingsResponse(params))
      : post("/set_push_settings", params),
  changePassword: (params) =>
    API_TYPE === API_TYPES.MOCK
      ? Promise.resolve(mockResponse([]))
      : post("/change_password", params),
  checkNewVersion: (params) =>
    API_TYPE === API_TYPES.MOCK
      ? Promise.resolve(mockResponse({ version: "mock-1.0.0", require_update: "0" }))
      : post("/check_new_version", params),
  setDevtoken: (params) =>
    API_TYPE === API_TYPES.MOCK
      ? Promise.resolve(mockResponse({ devtype: params?.devtype || "1", devToken: params?.devtoken || DEFAULT_DEVICE_TOKEN }))
      : post("/set_devtoken", params),
  getConversation: (params) =>
    API_TYPE === API_TYPES.MOCK
      ? Promise.resolve(buildMockConversationResponse(params))
      : post("/get_conversation", params),
  deleteMessage: (params) =>
    API_TYPE === API_TYPES.MOCK
      ? Promise.resolve(mockResponse([]))
      : post("/delete_message", params),
  getListConversation: (params) =>
    API_TYPE === API_TYPES.MOCK
      ? Promise.resolve(buildMockConversationListResponse(params))
      : post("/get_list_conversation", params),
  deleteConversation: (params) =>
    API_TYPE === API_TYPES.MOCK
      ? Promise.resolve(mockResponse([]))
      : post("/delete_conversation", params),
  checkNewItem: (params) =>
    API_TYPE === API_TYPES.MOCK
      ? buildMockCheckNewItemResponse(params)
      : post("/check_new_item", {
          last_id: params?.last_id || params?.lastId || "",
          category_id: params?.category_id || params?.categoryId || "",
        }),
  getNotification: (params) =>
    API_TYPE === API_TYPES.MOCK
      ? getMockNotificationResponse(params).then((response) => ({
          ...response,
          source: MOCK_SOURCE,
        }))
      : post("/get_notification", {
          token: params?.token || "",
          index: params?.index || "0",
          count: params?.count || "20",
        }),
  setReadMessage: (params) =>
    API_TYPE === API_TYPES.MOCK
      ? Promise.resolve(mockResponse([]))
      : post("/set_read_message", params),
  setReadNotification: (params) =>
    API_TYPE === API_TYPES.MOCK
      ? Promise.resolve({
          ...setMockNotificationRead(params?.notification_id),
          source: MOCK_SOURCE,
        })
      : post("/set_read_notification", params),
};
