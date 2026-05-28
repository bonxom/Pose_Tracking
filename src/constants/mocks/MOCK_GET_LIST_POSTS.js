import {
  DEMO_EXERCISES,
  DEMO_MOCK_POST_IDS,
  DEMO_STUDENT,
  DEMO_TEACHER,
  DEMO_VIDEO_ASSETS,
} from "@/constants/demo";

const TEACHER_AUTHOR = {
  id: DEMO_TEACHER.id,
  username: DEMO_TEACHER.displayName,
  avatar: DEMO_TEACHER.avatar,
  role: DEMO_TEACHER.role,
};

const STUDENT_AUTHOR = {
  id: DEMO_STUDENT.id,
  username: DEMO_STUDENT.displayName,
  avatar: DEMO_STUDENT.avatar,
  role: DEMO_STUDENT.role,
};

const VIDEO_PAIR = [
  {
    url: DEMO_VIDEO_ASSETS.left.url,
    thumb: DEMO_VIDEO_ASSETS.left.thumb,
  },
  {
    url: DEMO_VIDEO_ASSETS.right.url,
    thumb: DEMO_VIDEO_ASSETS.right.thumb,
  },
];

const MOCK_GET_LIST_POSTS = {
  code: "1000",
  message: "OK",
  data: {
    posts: [
      {
        post_id: DEMO_MOCK_POST_IDS.submissionPrimary,
        described:
          "#course_demo_teacher #exercise_001 Em nộp bài với 2 góc quay theo đúng yêu cầu.",
        video: VIDEO_PAIR,
        created: "2026-05-19T08:30:00.000Z",
        like: "12",
        comment: "3",
        is_liked: "0",
        is_blocked: "0",
        can_edit: "1",
        banned: "0",
        author: STUDENT_AUTHOR,
        exercise_id: DEMO_EXERCISES[0].id,
        course_id: DEMO_TEACHER.id,
      },
      {
        post_id: DEMO_MOCK_POST_IDS.teacherExercise01,
        described:
          "Bài tập số 1: động tác chào điều lệnh. Học viên xem mẫu và nộp đủ 2 video.",
        video: VIDEO_PAIR,
        time_series_poses: [
          {
            frame: [
              {
                frame_id: "frame_teacher_001",
                created: "2026-05-18T07:00:00.000Z",
                poses: [
                  {
                    pose_name: "left_arm",
                    pose_coord: { x: "0.12", y: "0.43", z: "0.03" },
                    confident: "0.97",
                  },
                ],
              },
            ],
          },
        ],
        created: "2026-05-18T07:00:00.000Z",
        like: "31",
        comment: "5",
        is_liked: "0",
        is_blocked: "0",
        can_edit: "0",
        banned: "0",
        author: TEACHER_AUTHOR,
      },
      {
        post_id: DEMO_MOCK_POST_IDS.studentSubmission02,
        described:
          "#course_demo_teacher #exercise_002 Em nộp bài bước đều tại chỗ, nhờ thầy góp ý thêm.",
        video: VIDEO_PAIR,
        created: "2026-05-17T10:10:00.000Z",
        like: "9",
        comment: "2",
        is_liked: "1",
        is_blocked: "0",
        can_edit: "1",
        banned: "0",
        author: STUDENT_AUTHOR,
        exercise_id: DEMO_EXERCISES[1].id,
        course_id: DEMO_TEACHER.id,
      },
      {
        post_id: DEMO_MOCK_POST_IDS.teacherExercise02,
        described:
          "Bài tập số 2: bước đều tại chỗ. Chú ý đánh tay đều và giữ vai cân bằng.",
        video: VIDEO_PAIR,
        time_series_poses: [
          {
            frame: [
              {
                frame_id: "frame_teacher_002",
                created: "2026-05-16T06:20:00.000Z",
                poses: [
                  {
                    pose_name: "right_leg",
                    pose_coord: { x: "0.34", y: "0.61", z: "0.09" },
                    confident: "0.94",
                  },
                ],
              },
            ],
          },
        ],
        created: "2026-05-16T06:20:00.000Z",
        like: "21",
        comment: "4",
        is_liked: "0",
        is_blocked: "0",
        can_edit: "0",
        banned: "0",
        author: TEACHER_AUTHOR,
      },
    ],
    new_items: "2",
    last_id: DEMO_MOCK_POST_IDS.teacherExercise02,
    has_more: "0",
    total: "4",
  },
};

export default MOCK_GET_LIST_POSTS;
