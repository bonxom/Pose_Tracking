import { DEMO_STUDENT, DEMO_TEACHER } from "@/constants/demo";
import { getMockProfileById } from "@/constants/mocks/profiles";

export const MOCK_USERS = [
  {
    phonenumber: DEMO_STUDENT.phonenumber,
    password: DEMO_STUDENT.password,
    role: DEMO_STUDENT.role,
    verified: true,
    data: {
      ...getMockProfileById(DEMO_STUDENT.id),
      token: "demo_student_token",
      active: 1,
      role: DEMO_STUDENT.role,
      phonenumber: DEMO_STUDENT.phonenumber,
      identifier: DEMO_STUDENT.phonenumber,
      handle: DEMO_STUDENT.handle,
      height: DEMO_STUDENT.height,
      demoMode: true,
    },
  },
  {
    phonenumber: DEMO_TEACHER.phonenumber,
    password: DEMO_TEACHER.password,
    role: DEMO_TEACHER.role,
    verified: true,
    data: {
      ...getMockProfileById(DEMO_TEACHER.id),
      token: "demo_teacher_token",
      active: 1,
      role: DEMO_TEACHER.role,
      phonenumber: DEMO_TEACHER.phonenumber,
      identifier: DEMO_TEACHER.phonenumber,
      handle: DEMO_TEACHER.handle,
      height: DEMO_TEACHER.height,
      demoMode: true,
    },
  },
  {
    phonenumber: "0900000098",
    password: "Password123",
    role: "HV",
    verified: true,
    data: {
      ...getMockProfileById("user_001"),
      token: "token_001",
      active: 1,
      role: "HV",
      phonenumber: "0900000098",
      height: "170",
    },
  },
  {
    phonenumber: "0900000099",
    password: "Teacher123",
    role: "GV",
    verified: true,
    data: {
      ...getMockProfileById("user_002"),
      token: "token_002",
      active: 1,
      role: "GV",
      phonenumber: "0900000099",
      height: "165",
    },
  },
];
