const mockReadIds = new Set();
const generatedNotifications = [];

let hasGeneratedRefreshNotification = false;

function buildBaseMockNotifications() {
  const now = Date.now();

  return [
    {
      notification_id: "mock_notification_like_001",
      type: "like",
      object_id: "post_seed_002",
      title: "Nguyen Van B đã thích bài viết của bạn",
      created: new Date(now - 1000 * 60 * 2).toISOString(),
      avatar: "",
      group: "1",
      read: "0",
    },
    {
      notification_id: "mock_notification_comment_001",
      type: "comment",
      object_id: "post_seed_002",
      title: "Tran Thi C đã bình luận về bài viết của bạn",
      created: new Date(now - 1000 * 60 * 15).toISOString(),
      avatar: "",
      group: "1",
      read: "0",
    },
    {
      notification_id: "mock_notification_post_001",
      type: "post",
      object_id: "post_teacher_exercise_001",
      title: "Đại úy Chính đã đăng bài tập mới",
      created: new Date(now - 1000 * 60 * 60 * 3).toISOString(),
      avatar: "",
      group: "1",
      read: "1",
    },
  ];
}

function buildOlderMockNotifications() {
  const now = Date.now();

  return Array.from({ length: 60 }, (_, index) => {
    const number = index + 1;
    const isComment = number % 2 === 0;

    return {
      notification_id: `mock_notification_old_${number}`,
      type: isComment ? "comment" : "like",
      object_id: "post_seed_002",
      title: isComment
        ? `Hoc vien ${number} đã bình luận về bài viết của bạn`
        : `Hoc vien ${number} đã thích bài viết của bạn`,
      created: new Date(
        now - 1000 * 60 * 60 * (number + 8),
      ).toISOString(),
      avatar: "",
      group: "1",
      read: "1",
    };
  });
}

function getCreatedTime(item) {
  const time = new Date(item.created).getTime();
  return Number.isFinite(time) ? time : 0;
}

function buildAllItems() {
  const items = [
    ...generatedNotifications,
    ...buildBaseMockNotifications(),
    ...buildOlderMockNotifications(),
  ];

  return items
    .map((item) => ({
      ...item,
      read: mockReadIds.has(item.notification_id) ? "1" : item.read,
    }))
    .sort((a, b) => getCreatedTime(b) - getCreatedTime(a));
}

function maybeGenerateRefreshNotification(params = {}) {
  const index = Number(params?.index || 0);
  const lastUpdate = params?.last_update || params?.lastUpdate || "";

  if (index !== 0 || !lastUpdate || hasGeneratedRefreshNotification) {
    return;
  }

  hasGeneratedRefreshNotification = true;

  generatedNotifications.push({
    notification_id: "mock_notification_refresh_001",
    type: "comment",
    object_id: "post_seed_002",
    title: "Le Van D vừa bình luận mới về bài viết của bạn",
    created: new Date().toISOString(),
    avatar: "",
    group: "1",
    read: "0",
  });
}

export function getMockNotificationResponse(params = {}) {
  maybeGenerateRefreshNotification(params);

  const index = Math.max(0, Number(params?.index || 0));
  const count = Math.max(1, Number(params?.count || 20));

  const allItems = buildAllItems();
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
