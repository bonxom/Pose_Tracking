#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";

const API_BASE_URL = (
  process.env.API_BASE_URL ||
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  "https://group1.it4788.sukkaito.id.vn/it4788"
).replace(/\/+$/, "");
const RUN_MUTATIONS = process.env.E2E_RUN_MUTATIONS === "1";
const USE_EXISTING_ACCOUNTS = process.env.E2E_USE_EXISTING_ACCOUNTS === "1";
const USE_GV_ID_AS_COURSE_ID = process.env.E2E_USE_GV_ID_AS_COURSE_ID === "1";
const PASSWORD = process.env.E2E_PASSWORD || "123456";
const DEVICE_TOKEN = process.env.E2E_DEVICE_TOKEN || "expo-web-e2e";
const VERIFY_FIELDS = ["code", "verify_code", "code_verify", "otp"];

const report = {
  generatedAt: new Date().toISOString(),
  apiBaseUrl: API_BASE_URL,
  mutationEnabled: RUN_MUTATIONS,
  useExistingAccounts: USE_EXISTING_ACCOUNTS,
  steps: [],
};

function addStep(name, status, details = {}) {
  const { status: httpStatus, ...rest } = details;
  report.steps.push({
    name,
    status,
    ...(httpStatus !== undefined ? { httpStatus } : {}),
    ...rest,
  });
}

function url(endpoint) {
  return `${API_BASE_URL}/${endpoint.replace(/^\/+/, "")}`;
}

async function request(endpoint, body = {}, transport = "json") {
  const headers = { Accept: "application/json" };
  let payload = body;

  if (transport === "json") {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  if (transport === "form") {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    payload = new URLSearchParams(body).toString();
  }

  const response = await fetch(url(endpoint), {
    method: "POST",
    headers,
    body: payload,
  });
  const text = await response.text();
  let json = null;

  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text.slice(0, 500) };
  }

  return { status: response.status, json };
}

function ok(result) {
  return result?.json?.code === "1000" || result?.json?.code === 1000 || result?.json?.success === true;
}

function statusForRead(result) {
  if (ok(result)) return "passed";
  if (String(result?.json?.code) === "9994") return "passed-empty";
  return "failed";
}

function tokenFrom(result) {
  const data = result?.json?.data || result?.json?.user || result?.json || {};
  return data.token || data.access_token || data.accessToken || "";
}

function userIdFrom(result, fallback = "") {
  const data = result?.json?.data || result?.json?.user || result?.json || {};
  return String(data.id || data.user_id || data.phonenumber || fallback || "");
}

function dataFrom(result) {
  return result?.json?.data || result?.json?.result || result?.json || {};
}

function listFrom(result) {
  const data = dataFrom(result);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.post)) return data.post;
  if (Array.isArray(data.posts)) return data.posts;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.list)) return data.list;
  if (Array.isArray(result?.json?.posts)) return result.json.posts;
  if (Array.isArray(result?.json?.items)) return result.json.items;
  return [];
}

function firstId(items = [], fields = ["id", "post_id", "conversation_id", "notification_id", "course_id"]) {
  for (const item of items) {
    for (const field of fields) {
      if (item?.[field]) return String(item[field]);
    }
  }

  return "";
}

async function multipartPost(endpoint, fields, filePaths) {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) form.append(key, String(value));
  });

  for (const [index, filePath] of filePaths.entries()) {
    const bytes = await readFile(filePath);
    const blob = new Blob([bytes], { type: "video/mp4" });
    form.append(index === 0 ? "video1" : "video2", blob, path.basename(filePath));
  }

  const response = await fetch(url(endpoint), {
    method: "POST",
    headers: { Accept: "application/json" },
    body: form,
  });
  const text = await response.text();
  let json = null;

  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text.slice(0, 500) };
  }

  return {
    status: response.status,
    json,
  };
}

async function signupRole(role, phone, verifyCode) {
  if (!phone) {
    addStep(`${role} signup`, "blocked", { reason: `Missing E2E_${role}_PHONE` });
    return null;
  }

  if (USE_EXISTING_ACCOUNTS) {
    addStep(`${role} signup`, "skipped", { reason: "E2E_USE_EXISTING_ACCOUNTS=1" });
    return null;
  }

  if (!RUN_MUTATIONS) {
    addStep(`${role} signup`, "blocked", { reason: "Set E2E_RUN_MUTATIONS=1 to create real accounts" });
    return null;
  }

  const signup = await request("/signup", {
    phonenumber: phone,
    password: PASSWORD,
    uuid: `${role.toLowerCase()}-${Date.now()}`,
    role,
  });
  addStep(`${role} signup`, ok(signup) ? "passed" : "failed", {
    status: signup.status,
    code: signup.json?.code,
    message: signup.json?.message,
  });

  await request("/get_verify_code", { phonenumber: phone })
    .then((result) => addStep(`${role} get_verify_code`, ok(result) ? "passed" : "failed", {
      status: result.status,
      code: result.json?.code,
      message: result.json?.message,
    }))
    .catch((error) => addStep(`${role} get_verify_code`, "failed", { message: error.message }));

  if (!verifyCode) {
    addStep(`${role} check_verify_code`, "manual-blocked", {
      reason: `Set E2E_${role}_VERIFY_CODE after receiving OTP, then rerun`,
    });
    return null;
  }

  let verified = null;
  for (const field of VERIFY_FIELDS) {
    const result = await request("/check_verify_code", { phonenumber: phone, [field]: verifyCode });
    addStep(`${role} check_verify_code:${field}`, ok(result) ? "passed" : "failed", {
      status: result.status,
      code: result.json?.code,
      message: result.json?.message,
    });
    if (ok(result)) {
      verified = result;
      break;
    }
  }

  const token = tokenFrom(verified);
  if (token) {
    const profile = await request("/change_info_after_signup", {
      token,
      user_name: `${role} E2E`,
      avatar: "",
      cover_image: "",
    });
    addStep(`${role} change_info_after_signup`, ok(profile) ? "passed" : "failed", {
      status: profile.status,
      code: profile.json?.code,
      message: profile.json?.message,
    });
  }

  return loginRole(role, phone);
}

async function loginRole(role, phone) {
  if (!phone) return null;

  const result = await request("/login", {
    phonenumber: phone,
    password: PASSWORD,
    devtoken: DEVICE_TOKEN,
  });
  const token = tokenFrom(result);
  addStep(`${role} login`, ok(result) && token ? "passed" : "failed", {
    status: result.status,
    code: result.json?.code,
    message: result.json?.message,
    hasToken: Boolean(token),
  });

  return token ? { token, userId: userIdFrom(result, phone), raw: result.json } : null;
}

async function verifyAuthenticatedReads(label, session) {
  if (!session?.token) {
    addStep(`${label} authenticated reads`, "blocked", { reason: "No token" });
    return {};
  }

  const context = {};

  async function check(name, endpoint, body, transport = "json") {
    const result = await request(endpoint, body, transport);
    addStep(`${label} ${name}`, statusForRead(result), {
      status: result.status,
      code: result.json?.code,
      message: result.json?.message,
      itemCount: listFrom(result).length,
    });
    return result;
  }

  const feed = await check("get_list_posts", "/get_list_posts", {
    token: session.token,
    index: "0",
    count: "20",
    last_id: "",
    category_id: "",
  }, "form");
  const feedItems = listFrom(feed);
  context.postId = firstId(feedItems);
  context.lastId = dataFrom(feed)?.last_id || dataFrom(feed)?.lastId || "";
  context.courseId = firstId(feedItems, ["course_id", "courseId", "category_id"]);
  context.exerciseId = firstId(feedItems, ["exercise_id", "exerciseId", "lesson_id"]);

  if (context.postId) {
    await check("get_post", "/get_post", { token: session.token, id: context.postId });
    await check("get_comment", "/get_comment", { token: session.token, id: context.postId, index: "0", count: "20" });
    addStep(`${label} like/report/edit/delete`, "blocked", { reason: "Mutation disabled for existing-account read run", postId: context.postId });
  } else {
    addStep(`${label} post detail/comment/like/report`, "blocked", { reason: "No post id returned by feed" });
  }

  await check("search", "/search", { token: session.token, keyword: "dieu hanh", user_id: session.userId, index: "0", count: "20" });
  await check("profile search", "/search", { token: session.token, keyword: "dieu hanh", user_id: session.userId, index: "0", count: "20" });
  const savedSearch = await check("get_saved_search", "/get_saved_search", { token: session.token, index: "0", count: "20" });
  const savedSearchId = firstId(listFrom(savedSearch), ["id", "search_id"]);
  if (savedSearchId) {
    addStep(`${label} del_saved_search`, "blocked", {
      reason: "Destructive saved-search deletion is not run by default against shared real accounts",
      savedSearchId,
    });
  }

  const courses = await check("get_list_courses_of_student", "/get_list_courses_of_student", {
    token: session.token,
    user_id: session.userId,
    index: "0",
    count: "20",
  });
  const courseId = context.courseId || firstId(listFrom(courses), ["course_id", "id"]);
  if (courseId) context.courseId = courseId;

  await check("get_list_students", "/get_list_students", { token: session.token, index: "0", count: "20" });
  await check("get_requested_enrollment", "/get_requested_enrollment", { token: session.token, index: "0", count: "20" });
  await check("get_list_blocks", "/get_list_blocks", { token: session.token, user_id: session.userId, index: "0", count: "20" });
  await check("get_push_settings", "/get_push_settings", { token: session.token });
  const version = await check("check_new_version spec payload", "/check_new_version", { token: session.token, last_update: "2026-05-10T00:00:00.000Z" });
  if (String(version.json?.message || "").includes("property last_update should not exist")) {
    await check("check_new_version deployed compatibility", "/check_new_version", {
      token: session.token,
      lastUpdate: "2026-05-10T00:00:00.000Z",
    });
  }
  const userInfo = await check("get_user_info spec payload", "/get_user_info", { token: session.token, user_id: session.userId });
  if (String(userInfo.json?.message || "").includes("property user_id should not exist")) {
    await check("get_user_info deployed compatibility", "/get_user_info", { token: session.token });
  }

  const notifications = await check("get_notification", "/get_notification", {
    token: session.token,
    index: "0",
    count: "20",
    last_update: "",
  });
  let notificationResult = notifications;
  if (String(notifications.json?.message || "").includes("property last_update should not exist")) {
    notificationResult = await check("get_notification deployed compatibility", "/get_notification", {
      token: session.token,
      index: "0",
      count: "20",
    });
  }
  context.notificationId = firstId(listFrom(notificationResult), ["notification_id", "id"]);
  if (context.notificationId) {
    addStep(`${label} set_read_notification`, "blocked", { reason: "Mutation disabled; set E2E_RUN_MUTATIONS=1 to mark read", notificationId: context.notificationId });
  }

  const conversations = await check("get_list_conversation", "/get_list_conversation", {
    token: session.token,
    index: "0",
    count: "20",
  });
  context.conversationId = firstId(listFrom(conversations), ["conversation_id", "id"]);
  if (context.conversationId) {
    await check("get_conversation", "/get_conversation", { token: session.token, id: context.conversationId, index: "0", count: "20" });
    addStep(`${label} set_read_message/delete_message/delete_conversation`, "blocked", { reason: "Mutation disabled; set E2E_RUN_MUTATIONS=1 for read/delete checks" });
  }

  const checkNewItem = await request("/check_new_item", {
    token: session.token,
    last_id: context.lastId || "",
    category_id: "",
  });
  addStep(`${label} check_new_item spec payload`, ok(checkNewItem) ? "passed" : "failed", {
    status: checkNewItem.status,
    code: checkNewItem.json?.code,
    message: checkNewItem.json?.message,
  });

  if (String(checkNewItem.json?.message || "").includes("property token should not exist")) {
    const compatibility = await request("/check_new_item", {
      last_id: context.lastId || "",
      category_id: "",
    });
    addStep(`${label} check_new_item deployed compatibility`, ok(compatibility) ? "passed" : "failed", {
      status: compatibility.status,
      code: compatibility.json?.code,
      message: compatibility.json?.message,
    });
  }

  return context;
}

async function verifyOptionalMutations(hv, gv, hvContext = {}, gvContext = {}) {
  if (!RUN_MUTATIONS) return;

  const courseId =
    process.env.E2E_COURSE_ID ||
    hvContext.courseId ||
    gvContext.courseId ||
    (USE_GV_ID_AS_COURSE_ID ? gv?.userId || "" : "");
  if (hv?.token && courseId) {
    const requestCourse = await request("/set_request_course", { token: hv.token, course_id: courseId, user_id: hv.userId });
    addStep("HV set_request_course", ok(requestCourse) ? "passed" : "failed", {
      status: requestCourse.status,
      code: requestCourse.json?.code,
      message: requestCourse.json?.message,
    });
  }

  if (gv?.token && hv?.userId && courseId && process.env.E2E_APPROVE_ENROLLMENT === "1") {
    const approve = await request("/set_approve_enrollment", { token: gv.token, user_id: hv.userId, is_accept: "1" });
    addStep("GV set_approve_enrollment", ok(approve) ? "passed" : "failed", {
      status: approve.status,
      code: approve.json?.code,
      message: approve.json?.message,
    });
  }

  if (hv?.token) {
    const devtoken = await request("/set_devtoken", { token: hv.token, devtoken: DEVICE_TOKEN, devtype: "1" });
    addStep("HV set_devtoken", ok(devtoken) ? "passed" : "failed", {
      status: devtoken.status,
      code: devtoken.json?.code,
      message: devtoken.json?.message,
    });
  }

  if (hv?.token && hvContext.postId) {
    const like = await request("/like", {
      token: hv.token,
      id: hvContext.postId,
    });
    addStep("HV like", ok(like) ? "passed" : "failed", {
      status: like.status,
      code: like.json?.code,
      message: like.json?.message,
    });

    const comment = await request("/set_comment", {
      token: hv.token,
      id: hvContext.postId,
      comment: "E2E verification comment",
      index: "0",
      count: "20",
    }, "form");
    addStep("HV set_comment", ok(comment) ? "passed" : "failed", {
      status: comment.status,
      code: comment.json?.code,
      message: comment.json?.message,
    });
  }

  const left = process.env.E2E_VIDEO_LEFT;
  const right = process.env.E2E_VIDEO_RIGHT;
  const exerciseId = process.env.E2E_EXERCISE_ID || hvContext.exerciseId || gvContext.exerciseId || "";
  if (hv?.token && left && right && courseId && exerciseId) {
    const upload = await multipartPost("/add_post", {
      token: hv.token,
      described: "E2E two-video submission",
      course_id: courseId,
      exercise_id: exerciseId,
      device_slave: DEVICE_TOKEN,
    }, [left, right]);
    addStep("HV add_post two-video upload", ok(upload) ? "passed" : "failed", {
      status: upload.status,
      code: upload.json?.code,
      message: upload.json?.message,
    });
  } else {
    addStep("HV add_post two-video upload", "blocked", {
      reason: "Requires E2E_VIDEO_LEFT, E2E_VIDEO_RIGHT, course_id, and exercise_id from real server data/env",
    });
  }
}

async function main() {
  const hvPhone = process.env.E2E_HV_PHONE || "";
  const gvPhone = process.env.E2E_GV_PHONE || "";

  const hv = USE_EXISTING_ACCOUNTS ? null : await signupRole("HV", hvPhone, process.env.E2E_HV_VERIFY_CODE || "");
  const gv = USE_EXISTING_ACCOUNTS ? null : await signupRole("GV", gvPhone, process.env.E2E_GV_VERIFY_CODE || "");

  if (USE_EXISTING_ACCOUNTS) {
    addStep("signup/OTP", "skipped", { reason: "Using existing real accounts from env" });
  }

  const hvSession = hv || await loginRole("HV existing", hvPhone);
  const gvSession = gv || await loginRole("GV existing", gvPhone);

  const hvContext = await verifyAuthenticatedReads("HV", hvSession);
  const gvContext = await verifyAuthenticatedReads("GV", gvSession);
  await verifyOptionalMutations(hvSession, gvSession, hvContext, gvContext);

  if (hvSession?.token) {
    const logout = await request("/logout", { token: hvSession.token });
    addStep("HV logout", ok(logout) ? "passed" : "failed", {
      status: logout.status,
      code: logout.json?.code,
      message: logout.json?.message,
    });
  }

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  addStep("fatal", "failed", { message: error.message });
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = 1;
});
