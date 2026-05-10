import { backendApi } from "@/api/client";
import { DEMO_COURSE } from "@/constants/demo";
import { getExercisePosts } from "@/repositories/postRepository";
import { extractList, isBackendOk } from "@/repositories/normalizers";
import {
  ACTIVE_SOURCES,
  canFallbackToLocal,
  getCurrentSession,
  shouldUseServer,
} from "@/repositories/source";

function normalizeCourse(raw = {}, source = ACTIVE_SOURCES.SERVER) {
  return {
    id: String(raw.id || raw.course_id || DEMO_COURSE.id),
    source,
    title: raw.title || raw.name || raw.course_name || DEMO_COURSE.title,
    teacherName: raw.teacherName || raw.teacher_name || raw.teacher?.name || DEMO_COURSE.teacherName,
    description: raw.description || raw.described || DEMO_COURSE.description,
    enrolled: raw.enrolled ?? true,
    studentCount: Number(raw.studentCount || raw.student_count || DEMO_COURSE.studentCount),
    exerciseCount: Number(raw.exerciseCount || raw.exercise_count || DEMO_COURSE.exerciseCount),
    latestExerciseId: raw.latestExerciseId || raw.latest_exercise_id || DEMO_COURSE.latestExerciseId,
    hashtag: raw.hashtag || DEMO_COURSE.hashtag,
  };
}

export async function getCurrentCourse() {
  const session = await getCurrentSession();

  if (!shouldUseServer(session)) {
    return normalizeCourse(DEMO_COURSE, ACTIVE_SOURCES.LOCAL);
  }

  try {
    const response = await backendApi.getListCoursesOfStudent({
      token: session.token,
      index: "0",
      count: "5",
    });

    if (!isBackendOk(response) && response?.code !== "9994") {
      throw new Error(response?.message || "Backend course list failed");
    }

    const course = extractList(response)[0];
    return normalizeCourse(course || DEMO_COURSE, ACTIVE_SOURCES.SERVER);
  } catch (error) {
    console.info("[DATA] Server course fallback", error.message);

    if (canFallbackToLocal()) {
      return normalizeCourse(DEMO_COURSE, ACTIVE_SOURCES.LOCAL_FALLBACK);
    }

    throw error;
  }
}

export async function getCourseExercises() {
  return getExercisePosts();
}
