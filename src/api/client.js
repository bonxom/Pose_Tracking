import {
  API_BASE_URL,
  API_DEBUG,
  API_TIMEOUT_MS,
  API_TYPE,
  API_TYPES,
} from "@/config/env";
import MOCK_ADD_POST from "@/constants/mocks/MOCK_ADD_POST";
import MOCK_GET_LIST_POSTS from "@/constants/mocks/MOCK_GET_LIST_POSTS";
import MOCK_GET_POST from "@/constants/mocks/MOCK_GET_POST";
import MOCK_GET_USER_INFO from "@/constants/mocks/MOCK_GET_USER_INFO";
import MOCK_LIST_COURSES from "@/constants/mocks/MOCK_LIST_COURSES";
import MOCK_LIST_STUDENTS from "@/constants/mocks/MOCK_LIST_STUDENTS";
import {
  getMockNotificationResponse,
  setMockNotificationRead,
} from "@/constants/mocks/MOCK_NOTIFICATION";
import MOCK_REQUESTED_ENROLLMENT from "@/constants/mocks/MOCK_REQUESTED_ENROLLMENT";

const MOCK_SEARCH_DELAY_MS = 300;
const MOCK_SEARCH_POSTS = [
  {
    post_id: "2a681763-57bc-4fc3-9e6d-ca86c1f6f492",
    described:
      "Tôi là Lê Đức Chính, mọi người hay biết đến tôi với cái tên chàng trai Hoa Thanh Quế. Hiện tôi đang làm AI Consultant, chuyên tư vấn cách sử dụng GPT hiệu quả.",
    video: [
      {
        url: "https://group1.it4788.sukkaito.id.vn/it4788/videos/vid_9eb7ff2b6bff4c5a/stream",
        thumb:
          "https://group1.it4788.sukkaito.id.vn/it4788/videos/vid_17cd135f22e94819/stream?is_thumb=true",
      },
    ],
    created: "2026-05-22T15:55:36.718Z",
    like: "1",
    comment: "3",
    is_liked: "0",
    is_blocked: "0",
    can_comment: "1",
    can_edit: "0",
    banned: "0",
    author: {
      id: "55700aaf-0e94-4539-9c8f-f85a4ab4808a",
      username: "Chu_Duc_Nghinh",
      avatar: "https://api.dicebear.com/9.x/adventurer/png?seed=teacher",
      role: "GV",
    },
    exercise_id: "",
    time_series_poses: [],
  },
  {
    post_id: "dd0d7962-58c8-4b5c-9f0b-630dc8b3f111",
    described:
      "Hôm nay mình chia sẻ cách dùng GPT để chuẩn bị giáo án và phản hồi bài tập nhanh hơn cho lớp Pose Tracking.",
    video: [
      {
        url: "https://group1.it4788.sukkaito.id.vn/it4788/videos/mock_teacher_2/stream",
        thumb:
          "https://group1.it4788.sukkaito.id.vn/it4788/videos/mock_teacher_2/stream?is_thumb=true",
      },
    ],
    created: "2026-05-21T08:15:00.000Z",
    like: "12",
    comment: "5",
    is_liked: "1",
    is_blocked: "0",
    can_comment: "1",
    can_edit: "1",
    banned: "0",
    author: {
      id: "55700aaf-0e94-4539-9c8f-f85a4ab4808a",
      username: "Chu_Duc_Nghinh",
      avatar: "https://api.dicebear.com/9.x/adventurer/png?seed=teacher",
      role: "GV",
    },
    exercise_id: "",
    time_series_poses: [],
  },
  {
    post_id: "58d2eafd-a6ee-4467-b2f9-7f4a6a381234",
    described:
      "Mình vừa hoàn thành bài tập điều lệnh, có ai muốn xem cách mình tối ưu prompt để GPT chấm động tác không?",
    video: [
      {
        url: "https://group1.it4788.sukkaito.id.vn/it4788/videos/mock_student_1/stream",
        thumb:
          "https://group1.it4788.sukkaito.id.vn/it4788/videos/mock_student_1/stream?is_thumb=true",
      },
    ],
    created: "2026-05-20T10:30:00.000Z",
    like: "7",
    comment: "2",
    is_liked: "0",
    is_blocked: "0",
    can_comment: "1",
    can_edit: "0",
    banned: "0",
    author: {
      id: "7e8f6c3d-1234-4567-8abc-9f0123456789",
      username: "Le_Duc_Chinh",
      avatar: "https://api.dicebear.com/9.x/adventurer/png?seed=student",
      role: "HV",
    },
    exercise_id: "",
    time_series_poses: [],
  },
];

let mockSavedSearches = [
  {
    search_id: "saved_search_gpt",
    keyword: "GPT",
    created_at: "2026-05-24T08:00:00.000Z",
  },
  {
    search_id: "saved_search_pose",
    keyword: "Pose Tracking",
    created_at: "2026-05-24T09:00:00.000Z",
  },
  {
    search_id: "saved_search_teacher",
    keyword: "Chu_Duc_Nghinh",
    created_at: "2026-05-24T10:00:00.000Z",
  },
];

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

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cloneMockValue(value) {
  return JSON.parse(JSON.stringify(value));
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
    logApi("request", { url, transport });
    const response = await fetch(url, {
      method: "POST",
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

function buildMockGetPostResponse(params = {}) {
  const list = Array.isArray(MOCK_GET_POST.data) ? MOCK_GET_POST.data : [];
  const requestId = String(params?.id || "");
  const matched = list.find((item) => String(item.id) === requestId);

  return {
    ...MOCK_GET_POST,
    data: [matched || list[0]].filter(Boolean),
  };
}

function buildMockGetListPostsResponse(params = {}) {
  const source = MOCK_GET_LIST_POSTS?.data || {};
  const list = Array.isArray(source.posts) ? source.posts : [];
  const count = Math.max(1, Number(params?.count || 20));
  const requestedLastId = String(params?.last_id || params?.lastId || "");
  const requestedIndex = Math.max(0, Number(params?.index || 0));
  const lastIdIndex = requestedLastId
    ? list.findIndex((item) => String(item?.post_id || "") === requestedLastId)
    : -1;
  const startIndex =
    lastIdIndex >= 0 ? lastIdIndex + 1 : Math.min(requestedIndex, list.length);

  const sliced = list.slice(startIndex, startIndex + count);
  const lastItem = sliced[sliced.length - 1];
  const hasMore = startIndex + sliced.length < list.length;

  return {
    ...MOCK_GET_LIST_POSTS,
    data: {
      ...source,
      posts: sliced,
      last_id: lastItem?.post_id || "",
      has_more: hasMore ? "1" : "0",
      total: String(list.length),
      new_items: source.new_items || "0",
    },
  };
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
      data: [],
    };
  }

  const normalizedUser = requestedUserId
    ? { ...matchedUser, phonenumber: "" }
    : { ...matchedUser };

  return {
    ...MOCK_GET_USER_INFO,
    data: [normalizedUser],
  };
}

async function buildMockSearchResponse(params = {}) {
  await delay(MOCK_SEARCH_DELAY_MS);

  const keyword = String(params?.keyword || "").trim();
  if (!keyword) {
    return {
      code: "1002",
      message: "Parameter is not enough",
      data: null,
    };
  }

  const normalizedKeyword = keyword.toLowerCase();
  const userId = String(params?.user_id || "").trim();
  const requestedIndex = Math.max(0, Number(params?.index || 0));
  const requestedCount = Math.max(1, Number(params?.count || 20));

  const filtered = MOCK_SEARCH_POSTS.filter((post) => {
    if (userId && String(post.author?.id || "") !== userId) {
      return false;
    }

    const haystack = [
      post.described,
      post.author?.username,
      post.author?.role,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedKeyword);
  });

  return {
    code: "1000",
    message: "OK",
    data: {
      posts: cloneMockValue(
        filtered.slice(requestedIndex, requestedIndex + requestedCount),
      ),
    },
  };
}

async function buildMockSavedSearchResponse(params = {}) {
  await delay(MOCK_SEARCH_DELAY_MS);

  const requestedIndex = Math.max(0, Number(params?.index || 0));
  const requestedCount = Math.max(1, Number(params?.count || 20));
  const sliced = mockSavedSearches.slice(
    requestedIndex,
    requestedIndex + requestedCount,
  );

  return {
    code: "1000",
    message: "OK",
    data: {
      saved_searches: cloneMockValue(sliced),
      items: cloneMockValue(sliced),
    },
  };
}

async function buildMockDeleteSavedSearchResponse(params = {}) {
  await delay(MOCK_SEARCH_DELAY_MS);

  if (String(params?.all || "") === "1") {
    mockSavedSearches = [];
  } else {
    const searchId = String(params?.search_id || "").trim();
    mockSavedSearches = mockSavedSearches.filter(
      (item) => String(item.search_id || "") !== searchId,
    );
  }

  return {
    code: "1000",
    message: "OK",
    data: {
      saved_searches: cloneMockValue(mockSavedSearches),
      items: cloneMockValue(mockSavedSearches),
    },
  };
}

export const backendApi = {
  login: (params) => post("/login", params),
  logout: (params) => post("/logout", params),
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
      ? Promise.resolve(MOCK_ADD_POST)
      : postMultipart("/add_post", fields, files),
  editPost: (params) => post("/edit_post", params),
  editPostMultipart: (fields, files) =>
    postMultipart("/edit_post", fields, files),
  deletePost: (params) => post("/delete_post", params),
  reportPost: (params) => post("/report_post", params),
  like: (params) => post("/like_post", params),
  getComment: (params) => post("/get_comment", params),
  setComment: (params) => postForm("/set_comment", params),
  search: (params) =>
    API_TYPE === API_TYPES.MOCK
      ? buildMockSearchResponse(params)
      : post("/search", params),
  getSavedSearch: (params) =>
    API_TYPE === API_TYPES.MOCK
      ? buildMockSavedSearchResponse(params)
      : post("/get_saved_search", params),
  deleteSavedSearch: (params) =>
    API_TYPE === API_TYPES.MOCK
      ? buildMockDeleteSavedSearchResponse(params)
      : post("/del_saved_search", params),
  delSavedSearch: (params) =>
    API_TYPE === API_TYPES.MOCK
      ? buildMockDeleteSavedSearchResponse(params)
      : post("/del_saved_search", params),
  getListStudents: (params) =>
    API_TYPE === API_TYPES.MOCK
      ? Promise.resolve(MOCK_LIST_STUDENTS)
      : post("/get_list_students", params),
  getListCoursesOfStudent: (params) =>
    post("/get_list_courses_of_student", params),
  getUserInfo: (params) =>
    API_TYPE === API_TYPES.MOCK
      ? Promise.resolve(buildMockGetUserInfoResponse(params))
      : post("/get_user_info", params),
  setUserInfo: (params) => post("/set_user_info", params),
  getListBlocks: (params) => post("/get_list_blocks", params),
  setBlock: (params) => post("/set_block", params),
  setApproveEnrollment: (params) => post("/set_approve_enrollment", params),
  getRequestedEnrollment: (params) =>
    API_TYPE === API_TYPES.MOCK
      ? Promise.resolve(MOCK_REQUESTED_ENROLLMENT)
      : post("/get_requested_enrollment", params),
  setRequestCourse: (params) => post("/set_request_course", params),
  getListCourses: (params) =>
    API_TYPE === API_TYPES.MOCK
      ? Promise.resolve(MOCK_LIST_COURSES)
      : post("/get_list_courses", params),
  getPushSettings: (params) => post("/get_push_settings", params),
  setPushSettings: (params) => post("/set_push_settings", params),
  changePassword: (params) => post("/change_password", params),
  checkNewVersion: (params) => post("/check_new_version", params),
  setDevtoken: (params) => post("/set_devtoken", params),
  getConversation: (params) => post("/get_conversation", params),
  deleteMessage: (params) => post("/delete_message", params),
  getListConversation: (params) => post("/get_list_conversation", params),
  deleteConversation: (params) => post("/delete_conversation", params),
  checkNewItem: (params) =>
    API_TYPE === API_TYPES.MOCK
      ? Promise.resolve({})
      : post("/check_new_item", params),
  getNotification: (params) =>
    API_TYPE === API_TYPES.MOCK
      ? getMockNotificationResponse(params)
      : post("/get_notification", params),
  setReadMessage: (params) => post("/set_read_message", params),
  setReadNotification: (params) =>
    API_TYPE === API_TYPES.MOCK
      ? Promise.resolve(setMockNotificationRead(params?.notification_id))
      : post("/set_read_notification", params),
};
