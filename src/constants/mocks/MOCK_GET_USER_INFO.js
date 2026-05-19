import { DEMO_STUDENT, DEMO_TEACHER } from "@/constants/demo";

const MOCK_GET_USER_INFO = {
  code: "1000",
  message: "OK",
  data: [
    {
      id: DEMO_STUDENT.id,
      username: DEMO_STUDENT.username,
      phonenumber: DEMO_STUDENT.phonenumber,
      created: "2026-05-01T08:00:00.000Z",
      avatar: DEMO_STUDENT.avatar,
      cover_image: "",
      is_related: "1",
      listing: "6",
      followed: "3",
      is_blocked: "0",
      role: DEMO_STUDENT.role,
      online: "1",
      handle: DEMO_STUDENT.handle,
      displayName: DEMO_STUDENT.displayName,
      height: DEMO_STUDENT.height,
    },
    {
      id: DEMO_TEACHER.id,
      username: DEMO_TEACHER.displayName,
      phonenumber: DEMO_TEACHER.phonenumber,
      created: "2026-04-28T08:00:00.000Z",
      avatar: DEMO_TEACHER.avatar,
      cover_image: "",
      is_related: "1",
      listing: "14",
      followed: "42",
      is_blocked: "0",
      role: DEMO_TEACHER.role,
      online: "1",
      handle: DEMO_TEACHER.handle,
      displayName: DEMO_TEACHER.displayName,
      height: DEMO_TEACHER.height,
    },
  ],
};

export default MOCK_GET_USER_INFO;
