import { backendApi } from "@/api/client";
import { extractList } from "@/repositories/normalizers";
import { getExercisePosts } from "@/repositories/postRepository";
import { assertBackendOk } from "@/repositories/serverResponse";
import { ACTIVE_SOURCES, getCurrentSession } from "@/repositories/source";

function normalizeCourse(raw = {}, source = ACTIVE_SOURCES.SERVER) {
  const requestStatus =
    raw.enrollmentStatus ||
    raw.enrollment_status ||
    raw.status ||
    raw.request_status ||
    "";
  const enrolled =
    raw.enrolled === true ||
    raw.is_enrolled === true ||
    raw.is_enrolled === "1" ||
    requestStatus === "enrolled" ||
    requestStatus === "accepted";
  const requested =
    !enrolled &&
    (raw.requested === true ||
      raw.is_requested === true ||
      raw.is_requested === "1" ||
      requestStatus === "pending" ||
      requestStatus === "requested");

  return {
    id: String(raw.id || raw.course_id),
    source,
    title: raw.title || raw.name || raw.course_name,
    teacherName: raw.teacherName || raw.teacher_name || raw.teacher?.name,
    description: raw.description || raw.described,
    enrolled,
    requested,
    enrollmentStatus: enrolled ? "enrolled" : requested ? "requested" : "none",
    studentCount: Number(raw.studentCount || raw.student_count),
    exerciseCount: Number(raw.exerciseCount || raw.exercise_count),
    latestExerciseId: raw.latestExerciseId || raw.latest_exercise_id,
    hashtag: raw.hashtag,
  };
}

function emptyServerCourse() {
  return {
    id: "",
    source: ACTIVE_SOURCES.SERVER,
    title: "Chưa có khóa học",
    teacherName: "Chưa có giảng viên",
    description: "Server chưa trả về khóa học cho tài khoản hiện tại.",
    enrolled: false,
    requested: false,
    enrollmentStatus: "none",
    studentCount: 0,
    exerciseCount: 0,
    latestExerciseId: "",
    hashtag: "",
  };
}

function normalizeStudent(item = {}, source = ACTIVE_SOURCES.SERVER) {
  return {
    id: String(item.id || item.user_id || item.student_id || ""),
    username: item.username || item.name || item.fullname || "Học viên",
    name: item.name || item.username || item.fullname || "Học viên",
    avatar: item.avatar || "",
    role: item.role || "HV",
    phonenumber: item.phonenumber || item.phone || "",
    source,
    raw: item,
  };
}

function buildStudentCollection(
  items = [],
  total = items.length,
  source = ACTIVE_SOURCES.SERVER,
) {
  const students = items.map((item) => normalizeStudent(item, source));
  return Object.assign(students, {
    students,
    total: String(total ?? students.length),
  });
}

export async function getCurrentCourse() {
  const session = await getCurrentSession();

  try {
    const response = await backendApi.getListCoursesOfStudent({
      token: session.token,
      user_id: session.id || session.user_id || session.identifier || "",
      index: "0",
      count: "20",
    });

    await assertBackendOk(response, {
      allowNoData: true,
      message: "Backend course list failed",
    });

    const course = extractList(response)[0];
    return course
      ? normalizeCourse(course, ACTIVE_SOURCES.SERVER)
      : emptyServerCourse();
  } catch (error) {
    console.info("[DATA] Server course fallback", error.message);
    throw error;
  }
}

export async function getCourseExercises() {
  return getExercisePosts();
}

export async function getStudentCourses(params = {}) {
  const session = await getCurrentSession();

  try {
    const response = await backendApi.getListCoursesOfStudent({
      token: session.token,
      user_id:
        params.userId ||
        params.user_id ||
        session.id ||
        session.user_id ||
        session.identifier ||
        "",
      index: String(params.index || 0),
      count: String(params.count || 20),
    });

    await assertBackendOk(response, {
      allowNoData: true,
      message: "Backend get_list_courses_of_student failed",
    });

    const courses = extractList(response).map((item) =>
      normalizeCourse(item, ACTIVE_SOURCES.SERVER),
    );
    return courses.length ? courses : [];
  } catch (error) {
    console.info("[DATA] Server student courses fallback", error.message);
    throw error;
  }
}

export async function getCourseStudents() {
  const session = await getCurrentSession();

  const response = await backendApi.getListStudents({
    token: session.token,
    index: "0",
    count: "50",
  });

  await assertBackendOk(response, {
    allowNoData: true,
    message: "Backend get_list_students failed",
  });

  const students = Array.isArray(response?.data?.students)
    ? response.data.students
    : extractList(response);
  return buildStudentCollection(
    students,
    response?.data?.total,
    ACTIVE_SOURCES.SERVER,
  );
}

export async function getRequestedEnrollments() {
  const session = await getCurrentSession();

  const response = await backendApi.getRequestedEnrollment({
    token: session.token,
    index: "0",
    count: "50",
  });

  await assertBackendOk(response, {
    allowNoData: true,
    message: "Backend get_requested_enrollment failed",
  });

  return extractList(response);
}

export async function requestCourse(courseId) {
  const session = await getCurrentSession();

  const response = await backendApi.setRequestCourse({
    token: session.token,
    course_id: courseId,
    user_id: session.id || session.user_id || session.identifier || "",
  });

  await assertBackendOk(response, {
    message: "Backend set_request_course failed",
  });

  return {
    requested: true,
    enrolled: false,
    enrollmentStatus: "requested",
    source: ACTIVE_SOURCES.SERVER,
  };
}

export async function approveEnrollment(requestId, isApproved = true) {
  const session = await getCurrentSession();

  const response = await backendApi.setApproveEnrollment({
    token: session.token,
    user_id: requestId,
    is_accept: isApproved ? "1" : "0",
  });

  await assertBackendOk(response, {
    message: "Backend set_approve_enrollment failed",
  });

  return { approved: isApproved, source: ACTIVE_SOURCES.SERVER };
}
