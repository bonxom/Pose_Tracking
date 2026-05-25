const MOCK_SEARCH_DELAY_MS = 300;

const MOCK_SEARCH_POSTS = [
  {
    post_id: "2a681763-57bc-4fc3-9e6d-ca86c1f6f492",
    described:
      "Minh dang thu nghiem mot chuoi bai tap pose tracking cho lop moi. Neu ban muon tim cach rut gon prompt va to chuc workflow hoc tap, bai viet nay co vi du cu the.",
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
      id: "demo_teacher_001",
      username: "Dai uy Chinh",
      avatar: "https://api.dicebear.com/9.x/adventurer/png?seed=teacher",
      role: "GV",
    },
    exercise_id: "",
    time_series_poses: [],
  },
  {
    post_id: "dd0d7962-58c8-4b5c-9f0b-630dc8b3f111",
    described:
      "Hom nay minh tong hop cach dung AI de soan giao an, viet checklist cho tung buoi hoc, va phan loai loi sai thuong gap cua hoc vien trong khoa Pose Tracking.",
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
      id: "demo_teacher_001",
      username: "Dai uy Chinh",
      avatar: "https://api.dicebear.com/9.x/adventurer/png?seed=teacher",
      role: "GV",
    },
    exercise_id: "",
    time_series_poses: [],
  },
  {
    post_id: "58d2eafd-a6ee-4467-b2f9-7f4a6a381234",
    described:
      "Minh vua nop bai tap dong tac squat va plank. Dang tim them tai lieu de tu danh gia video tap, so sanh ket qua theo tuan, va ghi chu tien do cho de theo doi.",
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
      id: "demo_student_001",
      username: "Nguyen Van A",
      avatar: "https://api.dicebear.com/9.x/adventurer/png?seed=student",
      role: "HV",
    },
    exercise_id: "",
    time_series_poses: [],
  },
];

let mockSavedSearches = [
  {
    search_id: "saved_search_prompt",
    keyword: "prompt",
    created_at: "2026-05-24T08:00:00.000Z",
  },
  {
    search_id: "saved_search_pose",
    keyword: "Pose Tracking",
    created_at: "2026-05-24T09:00:00.000Z",
  },
  {
    search_id: "saved_search_giao_an",
    keyword: "giao an",
    created_at: "2026-05-24T10:00:00.000Z",
  },
];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export async function getMockSearchResponse(params = {}) {
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

    const haystack = [post.described, post.author?.username, post.author?.role]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedKeyword);
  });

  return {
    code: "1000",
    message: "OK",
    data: {
      posts: clone(
        filtered.slice(requestedIndex, requestedIndex + requestedCount),
      ),
    },
  };
}

export async function getMockSavedSearchResponse(params = {}) {
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
      saved_searches: clone(sliced),
      items: clone(sliced),
    },
  };
}

export async function deleteMockSavedSearchResponse(params = {}) {
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
      saved_searches: clone(mockSavedSearches),
      items: clone(mockSavedSearches),
    },
  };
}
