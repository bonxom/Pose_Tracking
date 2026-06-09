function normalizeHashtagValue(value = "") {
  const normalized = String(value || "")
    .trim()
    .replace(/^#+/, "")
    .replace(/^@+/, "")
    .replace(/\s+/g, "_")
    .replace(/[^0-9A-Za-zÀ-ỹ_.\-/]/gu, "");

  return normalized;
}

function normalizeHashtagCollection(values = []) {
  const normalizedValues = Array.isArray(values) ? values : [values];
  const uniqueValues = new Set();

  normalizedValues.forEach((value) => {
    const normalized = normalizeHashtagValue(value);
    if (normalized) {
      uniqueValues.add(`#${normalized}`);
    }
  });

  return Array.from(uniqueValues);
}

function padDateNumber(value) {
  return String(value).padStart(2, "0");
}

function formatHashtagDate(dateValue = new Date()) {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return formatHashtagDate(new Date());
  }

  return [
    padDateNumber(date.getDate()),
    padDateNumber(date.getMonth() + 1),
    date.getFullYear(),
  ].join("/");
}

function buildDescriptionToken(described = "") {
  const matchedLetters = String(described || "").match(/[0-9A-Za-zÀ-ỹ]/gu) || [];
  const letters = matchedLetters.slice(0, 3).map((letter) => letter.toLowerCase());

  if (!letters.length) {
    return "n_a";
  }

  return letters.join("_");
}

export function buildPostHashtag({
  username = "",
  createdAt = new Date(),
  described = "",
} = {}) {
  const usernameToken = normalizeHashtagValue(username) || "giaovien";
  const dateToken = formatHashtagDate(createdAt);
  const describedToken = buildDescriptionToken(described);

  return `#${usernameToken}_${dateToken}_${describedToken}`;
}

export function mergeHashtags(...values) {
  return normalizeHashtagCollection(values.flat());
}

export function appendHashtagsToContent(content = "", hashtags = []) {
  const normalizedContent = String(content || "").trim();
  const normalizedHashtags = mergeHashtags(hashtags);

  if (!normalizedHashtags.length) {
    return normalizedContent;
  }

  return [normalizedContent, normalizedHashtags.join(" ")].filter(Boolean).join("\n");
}

export function extractTrailingHashtags(content = "") {
  const normalizedContent = String(content || "").trim();
  const match = normalizedContent.match(/(?:\s+|^)(#[^\s#]+(?:\s+#[^\s#]+)*)$/u);

  if (!match?.[1]) {
    return [];
  }

  return mergeHashtags(match[1].match(/#[^\s#]+/gu) || []);
}

export function stripTrailingHashtags(content = "") {
  return String(content || "")
    .replace(/(?:\s+|^)(#[^\s#]+(?:\s+#[^\s#]+)*)\s*$/u, "")
    .trim();
}

export function splitContentAndHashtags(content = "", explicitHashtags = []) {
  const appendedHashtags = extractTrailingHashtags(content);
  const mergedHashtags = mergeHashtags(appendedHashtags, explicitHashtags);

  return {
    content: stripTrailingHashtags(content),
    hashtags: mergedHashtags,
    generatedHashtag: appendedHashtags[0] || "",
    appendedHashtags,
  };
}
