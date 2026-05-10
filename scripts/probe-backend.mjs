#!/usr/bin/env node

const DEFAULT_ROOT = "http://group1.it4788.sukkaito.id.vn";
const ROOT_URL = (process.env.PROBE_BACKEND_ROOT || DEFAULT_ROOT).replace(/\/+$/, "");
const TIMEOUT_MS = Number(process.env.PROBE_TIMEOUT_MS || 6000);
const MUTATION_ENABLED = process.env.PROBE_MUTATION === "1";
const COMPACT_OUTPUT = process.env.PROBE_COMPACT === "1";

const loginBody = {
  phonenumber: process.env.PROBE_PHONE || "0900000001",
  password: process.env.PROBE_PASSWORD || "123456",
  devtoken: process.env.PROBE_DEVICE_TOKEN || "expo-web-demo",
};

const endpointSpecs = [
  {
    name: "login",
    paths: ["/it4788/login", "/login"],
    body: loginBody,
    transports: ["json", "form", "multipart"],
    authSensitive: false,
  },
  {
    name: "get_list_posts",
    paths: ["/it4788/get_list_posts"],
    body: ({ token }) => ({ token, index: 0, count: 1, last_id: "", category_id: "" }),
    transports: ["json", "form", "multipart"],
    authSensitive: true,
  },
  {
    name: "get_post",
    paths: ["/it4788/get_post"],
    body: ({ token, postId }) => ({ token, id: postId || "1" }),
    transports: ["json", "form", "multipart"],
    authSensitive: true,
  },
  {
    name: "like",
    paths: ["/it4788/like"],
    body: ({ token, postId }) => ({ token: MUTATION_ENABLED ? token : "__probe_invalid_token__", id: postId || "1" }),
    transports: ["json", "form", "multipart"],
    authSensitive: true,
    mutation: true,
  },
  {
    name: "get_comment",
    paths: ["/it4788/get_comment"],
    body: ({ token, postId }) => ({ token, id: postId || "1", index: 0, count: 1 }),
    transports: ["json", "form", "multipart"],
    authSensitive: true,
  },
  {
    name: "set_comment",
    paths: ["/it4788/set_comment"],
    body: ({ token, postId }) => ({
      token: MUTATION_ENABLED ? token : "__probe_invalid_token__",
      id: postId || "1",
      comment: "probe-comment",
    }),
    transports: ["json", "form", "multipart"],
    authSensitive: true,
    mutation: true,
  },
  {
    name: "add_post",
    paths: ["/it4788/add_post"],
    body: ({ token }) => ({
      token: MUTATION_ENABLED ? token : "__probe_invalid_token__",
      described: "probe add_post",
      course_id: "course_marching_101",
      exercise_id: "exercise_salute_001",
      device_slave: "expo-web-demo",
    }),
    transports: ["json", "form", "multipart"],
    authSensitive: true,
    mutation: true,
  },
  {
    name: "search",
    paths: ["/it4788/search"],
    body: ({ token }) => ({ token, keyword: "chao", index: 0, count: 3 }),
    transports: ["json", "form", "multipart"],
    authSensitive: true,
  },
  {
    name: "get_list_courses_of_student",
    paths: ["/it4788/get_list_courses_of_student"],
    body: ({ token }) => ({ token, index: 0, count: 5 }),
    transports: ["json", "form", "multipart"],
    authSensitive: true,
  },
  {
    name: "get_notification",
    paths: ["/it4788/get_notification"],
    body: ({ token }) => ({ token, index: 0, count: 5 }),
    transports: ["json", "form", "multipart"],
    authSensitive: true,
  },
  {
    name: "get_user_info",
    paths: ["/it4788/get_user_info"],
    body: ({ token }) => ({ token, user_id: "" }),
    transports: ["json", "form", "multipart"],
    authSensitive: true,
  },
];

function joinUrl(path) {
  return `${ROOT_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function bodyFor(spec, context) {
  return typeof spec.body === "function" ? spec.body(context) : spec.body;
}

function createBody(body, transport) {
  if (transport === "json") {
    return {
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      contentType: "application/json",
    };
  }

  if (transport === "form") {
    return {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(body).toString(),
      contentType: "application/x-www-form-urlencoded",
    };
  }

  const form = new FormData();
  Object.entries(body).forEach(([key, value]) => {
    form.append(key, value == null ? "" : String(value));
  });

  return {
    headers: {},
    body: form,
    contentType: "multipart/form-data",
  };
}

async function parseResponse(response) {
  const text = await response.text();
  if (!text) {
    return { validJson: false, bodyPreview: "", json: null };
  }

  try {
    const json = JSON.parse(text);
    return {
      validJson: true,
      bodyPreview: text.slice(0, 500),
      json,
    };
  } catch {
    return {
      validJson: false,
      bodyPreview: text.slice(0, 500),
      json: null,
    };
  }
}

async function request(url, body, transport, method = "POST") {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const payload = method === "POST" ? createBody(body, transport) : { headers: {}, body: undefined, contentType: "" };

  try {
    const response = await fetch(url, {
      method,
      headers: {
        Accept: "application/json",
        Origin: "http://localhost:8081",
        ...(payload.headers || {}),
      },
      body: payload.body,
      signal: controller.signal,
    });
    const parsed = method === "OPTIONS" ? { validJson: false, bodyPreview: "", json: null } : await parseResponse(response);

    return {
      ok: true,
      url,
      method,
      contentType: payload.contentType || "none",
      status: response.status,
      validJson: parsed.validJson,
      json: parsed.json,
      bodyPreview: parsed.bodyPreview,
      cors: {
        allowOrigin: response.headers.get("access-control-allow-origin") || "",
        allowMethods: response.headers.get("access-control-allow-methods") || "",
        allowHeaders: response.headers.get("access-control-allow-headers") || "",
      },
    };
  } catch (error) {
    return {
      ok: false,
      url,
      method,
      contentType: payload.contentType || "none",
      status: 0,
      validJson: false,
      json: null,
      bodyPreview: "",
      error: error.name === "AbortError" ? "timeout" : error.message,
      cors: {
        allowOrigin: "",
        allowMethods: "",
        allowHeaders: "",
      },
    };
  } finally {
    clearTimeout(timeout);
  }
}

function summarizeJson(json) {
  if (!json || typeof json !== "object") {
    return {
      code: "",
      message: "",
      dataShape: "none",
      keys: [],
    };
  }

  const data = json.data ?? json.posts ?? json.items ?? json.result ?? null;
  let dataShape = "none";
  if (Array.isArray(data)) dataShape = `array(${data.length})`;
  else if (data && typeof data === "object") dataShape = `object(${Object.keys(data).slice(0, 8).join(",")})`;
  else if (data != null) dataShape = typeof data;

  return {
    code: String(json.code ?? json.status ?? ""),
    message: String(json.message ?? json.msg ?? json.error ?? ""),
    dataShape,
    keys: Object.keys(json).slice(0, 10),
  };
}

function extractToken(json) {
  const data = json?.data || json?.user || json?.result || json;
  return data?.token || data?.access_token || data?.accessToken || json?.token || "";
}

function extractPostId(json) {
  const candidates = [
    json?.data,
    json?.data?.posts,
    json?.data?.items,
    json?.posts,
    json?.items,
  ].filter(Boolean);

  for (const candidate of candidates) {
    const item = Array.isArray(candidate) ? candidate[0] : candidate;
    const id = item?.id || item?.post_id || item?._id;
    if (id) return String(id);
  }

  return "";
}

function looksAuthRequired(result) {
  const statusSuggestsAuth = [401, 403].includes(result.status);
  const summary = summarizeJson(result.json);
  const text = `${summary.code} ${summary.message} ${result.bodyPreview}`.toLowerCase();
  return statusSuggestsAuth || /token|auth|unauthor|login|permission|not validated|9995|1009/.test(text);
}

function chooseBest(results) {
  const json2xx = results.find((item) => item.status >= 200 && item.status < 300 && item.validJson);
  if (json2xx) return json2xx;

  const jsonAny = results.find((item) => item.validJson);
  if (jsonAny) return jsonAny;

  const httpAny = results.find((item) => item.status > 0);
  return httpAny || results[0];
}

function compactAttempt(attempt) {
  return {
    transport: attempt.transport,
    status: attempt.status,
    validJson: attempt.validJson,
    code: attempt.summary.code,
    message: attempt.summary.message,
    dataShape: attempt.summary.dataShape,
    authRequired: attempt.authRequired,
  };
}

function compactResult(item) {
  return {
    endpoint: item.endpoint,
    selected: {
      url: item.selected.url,
      method: item.selected.method,
      contentType: item.selected.contentType,
      requestBody: item.selected.requestBody,
      status: item.selected.status,
      validJson: item.selected.validJson,
      code: item.selected.summary.code,
      message: item.selected.summary.message,
      dataShape: item.selected.summary.dataShape,
      authRequired: item.selected.authRequired,
      corsAllowOrigin: item.selected.cors.allowOrigin,
      corsOptionsStatus: item.options.status,
      corsOptionsAllowMethods: item.options.cors.allowMethods,
    },
    attempts: item.attempts.map(compactAttempt),
  };
}

async function main() {
  const context = {
    token: process.env.PROBE_TOKEN || "",
    postId: process.env.PROBE_POST_ID || "",
  };
  const results = [];

  for (const spec of endpointSpecs) {
    const endpointResults = [];

    for (const path of spec.paths) {
      for (const transport of spec.transports) {
        const body = bodyFor(spec, context);
        const result = await request(joinUrl(path), body, transport);
        endpointResults.push({
          endpoint: spec.name,
          path,
          transport,
          requestBody: body,
          mutation: Boolean(spec.mutation),
          ...result,
          summary: summarizeJson(result.json),
          authRequired: looksAuthRequired(result),
        });

        if (spec.name === "login" && !context.token) {
          const token = extractToken(result.json);
          if (token) context.token = token;
        }

        if (spec.name === "get_list_posts" && !context.postId) {
          const postId = extractPostId(result.json);
          if (postId) context.postId = postId;
        }
      }
    }

    const best = chooseBest(endpointResults);
    const optionsResult = await request(best.url, {}, "json", "OPTIONS");
    results.push({
      endpoint: spec.name,
      selected: best,
      options: optionsResult,
      attempts: endpointResults,
    });
  }

  const report = {
    generatedAt: new Date().toISOString(),
    rootUrl: ROOT_URL,
    timeoutMs: TIMEOUT_MS,
    mutationEnabled: MUTATION_ENABLED,
    loginPhone: loginBody.phonenumber,
    discoveredToken: Boolean(context.token),
    discoveredPostId: context.postId,
    results,
  };

  if (COMPACT_OUTPUT) {
    console.log(JSON.stringify({
      ...report,
      results: report.results.map(compactResult),
    }, null, 2));
    return;
  }

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
