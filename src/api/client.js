import { API_BASE_URL, API_DEBUG, API_TIMEOUT_MS } from "@/config/env";

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
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || API_TIMEOUT_MS);
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

    throw new ApiError(error.name === "AbortError" ? "Backend request timed out" : "Backend unreachable", {
      code: error.name === "AbortError" ? "TIMEOUT" : "NETWORK_ERROR",
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function post(path, body = {}, options = {}) {
  return request(path, body, { ...options, transport: "json" });
}

export async function postForm(path, body = {}, options = {}) {
  const normalizedBody = Object.fromEntries(
    Object.entries(body).map(([key, value]) => [key, value == null ? "" : String(value)]),
  );
  return request(path, normalizedBody, { ...options, transport: "form" });
}

export async function postMultipart(path, fields = {}, files = [], options = {}) {
  const formData = new FormData();

  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });

  files.filter(Boolean).forEach((file, index) => {
    const fieldName = file.fieldName || `video${index + 1}`;
    formData.append(fieldName, {
      uri: file.uri,
      name: file.name || file.fileName || `video-${index + 1}.mp4`,
      type: file.mimeType || file.type || "video/mp4",
    });
  });

  return request(path, formData, { ...options, transport: "multipart" });
}

export const backendApi = {
  login: (params) => post("/login", params),
  logout: (params) => post("/logout", params),
  signup: (params) => post("/signup", params),
  getVerifyCode: (params) => post("/get_verify_code", params),
  checkVerifyCode: (params) => post("/check_verify_code", params),
  changeInfoAfterSignup: (params) => post("/change_info_after_signup", params),
  getListPosts: (params) => postForm("/get_list_posts", params),
  getPost: (params) => post("/get_post", params),
  addPost: (fields, files) => postMultipart("/add_post", fields, files),
  editPost: (params) => post("/edit_post", params),
  deletePost: (params) => post("/delete_post", params),
  reportPost: (params) => post("/report_post", params),
  like: (params) => post("/like", params),
  getComment: (params) => post("/get_comment", params),
  setComment: (params) => post("/set_comment", params),
  search: (params) => post("/search", params),
  getSavedSearch: (params) => post("/get_saved_search", params),
  delSavedSearch: (params) => post("/del_saved_search", params),
  getListStudents: (params) => post("/get_list_students", params),
  getListCoursesOfStudent: (params) => post("/get_list_courses_of_student", params),
  getUserInfo: (params) => post("/get_user_info", params),
  setUserInfo: (params) => post("/set_user_info", params),
  getListBlocks: (params) => post("/get_list_blocks", params),
  setBlock: (params) => post("/set_block", params),
  setApproveEnrollment: (params) => post("/set_approve_enrollment", params),
  getRequestedEnrollment: (params) => post("/get_requested_enrollment", params),
  setRequestCourse: (params) => post("/set_request_course", params),
  getPushSettings: (params) => post("/get_push_settings", params),
  setPushSettings: (params) => post("/set_push_settings", params),
  changePassword: (params) => post("/change_password", params),
  checkNewVersion: (params) => post("/check_new_version", params),
  setDevtoken: (params) => post("/set_devtoken", params),
  getConversation: (params) => post("/get_conversation", params),
  deleteMessage: (params) => post("/delete_message", params),
  getListConversation: (params) => post("/get_list_conversation", params),
  deleteConversation: (params) => post("/delete_conversation", params),
  checkNewItem: (params) => post("/check_new_item", params),
  getNotification: (params) => post("/get_notification", params),
  setReadMessage: (params) => post("/set_read_message", params),
  setReadNotification: (params) => post("/set_read_notification", params),
};
