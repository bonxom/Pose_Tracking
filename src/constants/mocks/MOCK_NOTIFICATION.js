import { getPosts } from "@/services/postStore";

const mockReadIds = new Set();
const generatedNotifications = [];

let hasGeneratedRefreshNotification = false;

const FALLBACK_POST_ID = "post_seed_002";

function getCreatedTime(value) {
  const source =
    typeof value === "string" ? value : value?.created || value?.createdAt;

  const time = new Date(source).getTime();
  return Number.isFinite(time) ? time : 0;
}

function getLatestComment(post) {
  const comments = Array.isArray(post?.comments) ? post.comments : [];

  return [...comments]
    .filter((comment) => comment?.authorName && comment?.content)
    .sort((a, b) => getCreatedTime(b.createdAt) - getCreatedTime(a.createdAt))[0];
}

async function resolveCommentNotificationTarget() {
  try {
    const posts = await getPosts();

    const postWithLatestComment = posts
      .map((post) => ({
        post,
        comment: getLatestComment(post),
      }))
      .filter((item) => item.comment)
      .sort(
        (a, b) =>
          getCreatedTime(b.comment.createdAt) -
          getCreatedTime(a.comment.createdAt),
      )[0];

    if (postWithLatestComment) {
      return postWithLatestComment;
    }

    const fallbackPost =
      posts.find((post) => post.id === FALLBACK_POST_ID) || posts[0];

    return {
      post: fallbackPost,
      comment: null,
    };
  } catch {
    return {
      post: { id: FALLBACK_POST_ID },
      comment: null,
    };
  }
}

function buildBaseMockNotifications(targetPostId, comment, now) {
  const commentAuthor = comment?.authorName || "Người dùng";
  const commentText = comment?.content || "Đã bình luận về bài viết của bạn.";

  return [
    {
      notification_id: "mock_notification_comment_001",
      type: "comment",
      object_id: targetPostId,
      comment_id: comment?.id || "",
      title: `${commentAuthor} đã bình luận về bài viết của bạn`,
      actor_name: commentAuthor,
      comment_text: commentText,
      created: new Date(now - 1000 * 60 * 2).toISOString(),
      avatar: comment?.avatar || "https://api.dicebear.com/9.x/adventurer/png?seed=dung_tran",
      group: "1",
      read: "0",
    },
    {
      notification_id: "mock_notification_like_001",
      type: "like",
      object_id: targetPostId,
      title: `${commentAuthor} đã thích bài viết của bạn`,
      actor_name: commentAuthor,
      created: new Date(now - 1000 * 60 * 15).toISOString(),
      avatar: comment?.avatar || "https://api.dicebear.com/9.x/adventurer/png?seed=dung_tran",
      group: "1",
      read: "0",
    },
    {
      notification_id: "mock_notification_post_001",
      type: "post",
      object_id: targetPostId,
      title: "Bài viết của bạn có cập nhật mới",
      created: new Date(now - 1000 * 60 * 60 * 3).toISOString(),
      avatar: comment?.avatar || "https://api.dicebear.com/9.x/adventurer/png?seed=quyen_ngo",
      group: "1",
      read: "1",
    },
  ];
}

function buildOlderMockNotifications(targetPostId) {
  const now = Date.now();

  return Array.from({ length: 60 }, (_, index) => {
    const number = index + 1;
    const isComment = number % 2 === 0;

    return {
      notification_id: `mock_notification_old_${number}`,
      type: isComment ? "comment" : "like",
      object_id: targetPostId,
      title: isComment
        ? `Hoc vien ${number} đã bình luận về bài viết của bạn`
        : `Hoc vien ${number} đã thích bài viết của bạn`,
      actor_name: `Hoc vien ${number}`,
      actor_initial: String(number),
      comment_text: "Em thấy bài này rất hữu ích.",
      created: new Date(
        now - 1000 * 60 * 60 * (number + 8),
      ).toISOString(),
      avatar: "https://api.dicebear.com/9.x/adventurer/png?seed=minh_hoang",
      group: "1",
      read: "1",
    };
  });
}

function buildAllItems(baseItems = []) {
  const items = [
    ...generatedNotifications,
    ...baseItems,
  ];

  return items
    .map((item) => ({
      ...item,
      read: mockReadIds.has(item.notification_id) ? "1" : item.read,
    }))
    .sort((a, b) => getCreatedTime(b) - getCreatedTime(a));
}

function maybeGenerateRefreshNotification(targetPostId, params = {}) {
  const index = Number(params?.index || 0);
  const lastUpdate = params?.last_update || params?.lastUpdate || "";

  if (index !== 0 || !lastUpdate || hasGeneratedRefreshNotification) {
    return;
  }

  hasGeneratedRefreshNotification = true;

  generatedNotifications.push({
    notification_id: "mock_notification_refresh_001",
    type: "comment",
    object_id: targetPostId,
    comment_id: "mock_comment_refresh_001",
    title: "Le Duc C vừa bình luận mới về bài viết của bạn",
    actor_name: "Le Duc C",
    actor_initial: "C",
    comment_text: "Em vừa xem lại bài này, phần động tác rất rõ.",
    created: new Date().toISOString(),
    avatar: "https://api.dicebear.com/9.x/adventurer/png?seed=ha_vu",
    group: "1",
    read: "0",
  });
}

export async function getMockNotificationResponse(params = {}) {
  const { post, comment } = await resolveCommentNotificationTarget();
  const targetPostId = post?.id || FALLBACK_POST_ID;

  maybeGenerateRefreshNotification(targetPostId, params);

  const index = Math.max(0, Number(params?.index || 0));
  const count = Math.max(1, Number(params?.count || 20));

  const now = Date.now();
  const baseItems = buildBaseMockNotifications(targetPostId, comment, now);
  const allItems = buildAllItems([...baseItems, ...buildOlderMockNotifications(targetPostId)]);
  const pageItems = allItems.slice(index, index + count);
  const badge = allItems.filter((item) => item.read !== "1").length;

  return {
    code: "1000",
    message: "OK",
    data: {
      data: pageItems,
      badge: String(badge),
      last_update: new Date().toISOString(),
    },
  };
}

export function setMockNotificationRead(notificationId) {
  if (notificationId) {
    mockReadIds.add(String(notificationId));
  }

  const allItems = buildAllItems();
  const badge = allItems.filter((item) => item.read !== "1").length;

  return {
    code: "1000",
    message: "OK",
    data: {
      notification_id: String(notificationId || ""),
      read: "1",
      badge: String(badge),
      last_update: new Date().toISOString(),
    },
  };
}
