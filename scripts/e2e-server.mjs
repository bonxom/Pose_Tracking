#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || "http://group1.it4788.sukkaito.id.vn/it4788").replace(/\/+$/, "");
const RUN_MUTATIONS = process.env.E2E_RUN_MUTATIONS === "1";
const PASSWORD = process.env.E2E_PASSWORD || "123456";
const DEVICE_TOKEN = process.env.E2E_DEVICE_TOKEN || "expo-web-e2e";
const VERIFY_FIELDS = ["code", "verify_code", "code_verify", "otp"];

const report = {
  generatedAt: new Date().toISOString(),
  apiBaseUrl: API_BASE_URL,
  mutationEnabled: RUN_MUTATIONS,
  steps: [],
};

function addStep(name, status, details = {}) {
  report.steps.push({ name, status, ...details });
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

function tokenFrom(result) {
  const data = result?.json?.data || result?.json?.user || result?.json || {};
  return data.token || data.access_token || data.accessToken || "";
}

function userIdFrom(result, fallback = "") {
  const data = result?.json?.data || result?.json?.user || result?.json || {};
  return String(data.id || data.user_id || data.phonenumber || fallback || "");
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
    return;
  }

  const readChecks = [
    ["get_list_posts", "/get_list_posts", { token: session.token, index: "0", count: "20", last_id: "", category_id: "" }, "form"],
    ["check_new_item", "/check_new_item", { token: session.token, last_id: "", category_id: "" }, "json"],
    ["get_notification", "/get_notification", { token: session.token, index: "0", count: "20", last_update: "" }, "json"],
    ["get_push_settings", "/get_push_settings", { token: session.token }, "json"],
    ["get_user_info", "/get_user_info", { token: session.token, user_id: session.userId }, "json"],
    ["get_list_courses_of_student", "/get_list_courses_of_student", { token: session.token, user_id: session.userId }, "json"],
    ["get_list_blocks", "/get_list_blocks", { token: session.token, user_id: session.userId, index: "0", count: "20" }, "json"],
    ["get_list_conversation", "/get_list_conversation", { token: session.token, index: "0", count: "20" }, "json"],
  ];

  for (const [name, endpoint, body, transport] of readChecks) {
    const result = await request(endpoint, body, transport);
    addStep(`${label} ${name}`, ok(result) ? "passed" : "failed", {
      status: result.status,
      code: result.json?.code,
      message: result.json?.message,
    });
  }
}

async function verifyOptionalMutations(hv, gv) {
  if (!RUN_MUTATIONS) return;

  const courseId = process.env.E2E_COURSE_ID || "";
  if (hv?.token && courseId) {
    const requestCourse = await request("/set_request_course", { token: hv.token, course_id: courseId, user_id: hv.userId });
    addStep("HV set_request_course", ok(requestCourse) ? "passed" : "failed", {
      status: requestCourse.status,
      code: requestCourse.json?.code,
      message: requestCourse.json?.message,
    });
  }

  if (gv?.token && hv?.userId) {
    const approve = await request("/set_approve_enrollment", { token: gv.token, user_id: hv.userId, is_accept: "1" });
    addStep("GV set_approve_enrollment", ok(approve) ? "passed" : "failed", {
      status: approve.status,
      code: approve.json?.code,
      message: approve.json?.message,
    });
  }

  const left = process.env.E2E_VIDEO_LEFT;
  const right = process.env.E2E_VIDEO_RIGHT;
  if (hv?.token && left && right) {
    const upload = await multipartPost("/add_post", {
      token: hv.token,
      described: "E2E two-video submission",
      course_id: courseId,
      exercise_id: process.env.E2E_EXERCISE_ID || "",
      device_slave: DEVICE_TOKEN,
    }, [left, right]);
    addStep("HV add_post two-video upload", ok(upload) ? "passed" : "failed", {
      status: upload.status,
      code: upload.json?.code,
      message: upload.json?.message,
    });
  } else {
    addStep("HV add_post two-video upload", "blocked", {
      reason: "Set E2E_VIDEO_LEFT and E2E_VIDEO_RIGHT with two >=10s mp4 files",
    });
  }
}

async function main() {
  const hvPhone = process.env.E2E_HV_PHONE || "";
  const gvPhone = process.env.E2E_GV_PHONE || "";

  const hv = await signupRole("HV", hvPhone, process.env.E2E_HV_VERIFY_CODE || "");
  const gv = await signupRole("GV", gvPhone, process.env.E2E_GV_VERIFY_CODE || "");

  const hvSession = hv || await loginRole("HV existing", hvPhone);
  const gvSession = gv || await loginRole("GV existing", gvPhone);

  await verifyAuthenticatedReads("HV", hvSession);
  await verifyAuthenticatedReads("GV", gvSession);
  await verifyOptionalMutations(hvSession, gvSession);

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
