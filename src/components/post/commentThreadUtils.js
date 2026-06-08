export const COMMENT_MAX_LENGTH = 500;

export function sanitizeCommentText(value = "") {
  return String(value).trim().replace(/[\u0000-\u001F\u007F]/g, "");
}

export function validateCommentText(value = "") {
  const text = sanitizeCommentText(value);

  if (!text) {
    return {
      text,
      error: "Vui lòng nhập bình luận.",
    };
  }

  if (text.length > COMMENT_MAX_LENGTH) {
    return {
      text,
      error: `Bình luận tối đa ${COMMENT_MAX_LENGTH} ký tự.`,
    };
  }

  return {
    text,
    error: "",
  };
}

export function dedupeCommentsById(commentList = []) {
  const seen = new Set();
  const deduped = [];

  commentList.forEach((item) => {
    const id = String(item?.id || "");
    if (!id || seen.has(id)) return;
    seen.add(id);
    deduped.push(item);
  });

  return deduped;
}
