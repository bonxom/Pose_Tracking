import { API_BASE_URL, API_TIMEOUT_MS } from "@/config/env";

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

async function safeJson(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export async function post(path, body = {}, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || API_TIMEOUT_MS);

  try {
    const response = await fetch(joinUrl(options.baseUrl || API_BASE_URL, path), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = await safeJson(response);

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

export const backendApi = {
  login: (params) => post("/login", params),
  getListPosts: (params) => post("/get_list_posts", params),
  getPost: (params) => post("/get_post", params),
  like: (params) => post("/like", params),
  getComment: (params) => post("/get_comment", params),
  setComment: (params) => post("/set_comment", params),
};
