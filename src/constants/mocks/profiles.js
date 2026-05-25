import { DEMO_STUDENT, DEMO_TEACHER } from "@/constants/demo";

export const MOCK_PROFILE_RESPONSES = [
  {
    code: "1000",
    message: "OK",
    data: {
      id: DEMO_STUDENT.id,
      username: DEMO_STUDENT.username,
      avatar: "https://api.dicebear.com/9.x/adventurer/png?seed=demo-student",
      coverImage: "https://api.dicebear.com/9.x/adventurer/png?seed=demo-student-cover",
      description:
        "Hoc vien dang luyen tap dieu lenh doi ngu, uu tien cac bai nop du hai goc quay de he thong cham chinh xac hon.",
      online: "1",
      created: "2026-05-17T12:44:50.319Z",
      city: "Ha Noi",
      country: "Viet Nam",
    },
  },
  {
    code: "1000",
    message: "OK",
    data: {
      id: DEMO_TEACHER.id,
      username: DEMO_TEACHER.displayName,
      avatar: "https://api.dicebear.com/9.x/adventurer/png?seed=demo-teacher",
      coverImage: "https://api.dicebear.com/9.x/adventurer/png?seed=demo-teacher-cover",
      description:
        "Giang vien phu trach nhom bai tap dieu lenh. Ho so mock nay dung de test xem profile giao vien va bai tap mau hien thi ra sao.",
      online: "1",
      created: "2026-05-17T12:44:50.319Z",
      city: "Ha Noi",
      country: "Viet Nam",
    },
  },
  {
    code: "1000",
    message: "OK",
    data: {
      id: "86cfcb82-4821-45ac-85ef-de8f62e5a12e",
      username: "CoCaiDauBuoi",
      avatar: "https://api.dicebear.com/9.x/adventurer/png?seed=hv2",
      coverImage: "https://api.dicebear.com/9.x/adventurer/png?seed=hv2",
      description: "con cac",
      online: "1",
      created: "2026-05-17T12:44:50.319Z",
    },
  },
  {
    code: "1000",
    message: "OK",
    data: {
      id: "demo_teacher_002",
      username: "Trung doi truong Cuong",
      avatar: "https://api.dicebear.com/9.x/adventurer/png?seed=demo-teacher-2",
      coverImage: "https://api.dicebear.com/9.x/adventurer/png?seed=demo-teacher-2-cover",
      description:
        "Giao vien phu trach cac bai on tap va demo trang thai khoa binh luan trong luong mock.",
      online: "1",
      created: "2026-05-18T07:30:00.000Z",
      city: "Hai Phong",
      country: "Viet Nam",
    },
  },
  {
    code: "1000",
    message: "OK",
    data: {
      id: "user_001",
      username: "Nguyen Van A",
      avatar: "https://api.dicebear.com/9.x/adventurer/png?seed=user-001",
      coverImage: "https://api.dicebear.com/9.x/adventurer/png?seed=user-001-cover",
      description: "Tai khoan mock phu de test luong dang nhap local va cap nhat ho so.",
      online: "0",
      created: "2026-05-18T07:30:00.000Z",
      city: "Ha Noi",
      country: "Viet Nam",
    },
  },
  {
    code: "1000",
    message: "OK",
    data: {
      id: "user_002",
      username: "Tran Thi B",
      avatar: "https://api.dicebear.com/9.x/adventurer/png?seed=user-002",
      coverImage: "https://api.dicebear.com/9.x/adventurer/png?seed=user-002-cover",
      description: "Tai khoan mock phu vai tro giao vien de test profile local khong qua backend.",
      online: "0",
      created: "2026-05-18T07:30:00.000Z",
      city: "Ha Noi",
      country: "Viet Nam",
    },
  },
];

function toProfileRecord(response = {}) {
  const data = response.data || {};
  const id = String(data.id || data.user_id || "");

  return {
    ...data,
    id,
    displayName: data.displayName || data.username || "",
    profileLink: data.profileLink || `https://pose-tracking.local/profile/${id}`,
    listing: data.listing ?? true,
  };
}

const profileStore = new Map(
  MOCK_PROFILE_RESPONSES.map((response) => {
    const profile = toProfileRecord(response);
    return [profile.id, profile];
  }),
);

function cloneProfile(profile) {
  return profile ? { ...profile } : null;
}

function normalizeOptionalText(value = "") {
  return String(value ?? "")
    .replace(/^undefined$/i, "")
    .replace(/^null$/i, "")
    .trim();
}

export function getMockProfileById(userId = "") {
  return cloneProfile(profileStore.get(String(userId || "")));
}

export function getMockProfileByPhone(phonenumber = "") {
  const normalizedPhone = String(phonenumber || "");
  const profile = Array.from(profileStore.values()).find(
    (item) => String(item.phonenumber || "") === normalizedPhone,
  );

  return cloneProfile(profile);
}

export function resolveMockProfile(session = {}, userId = "") {
  if (userId) {
    return getMockProfileById(userId);
  }

  return (
    getMockProfileById(session?.id || session?.user_id || session?.identifier || "") ||
    getMockProfileByPhone(session?.phonenumber || "") ||
    null
  );
}

export function saveMockProfile(profile = {}) {
  const id = String(profile.id || profile.user_id || profile.identifier || profile.phonenumber || "");
  if (!id) return null;

  const current = profileStore.get(id) || {};
  const next = {
    ...current,
    ...profile,
    id,
    displayName: profile.displayName || profile.username || current.displayName || current.username || "",
    profileLink: profile.profileLink || current.profileLink || `https://pose-tracking.local/profile/${id}`,
    description: normalizeOptionalText(
      profile.description ?? current.description ?? "",
    ),
  };

  profileStore.set(id, next);
  return cloneProfile(next);
}

export function listMockProfiles() {
  return Array.from(profileStore.values()).map(cloneProfile);
}

