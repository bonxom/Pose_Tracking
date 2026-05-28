import {
  DEMO_EXERCISES,
  DEMO_MOCK_POST_IDS,
  DEMO_STUDENT,
  DEMO_TEACHER,
  DEMO_VIDEO_ASSETS,
} from "@/constants/demo";

const MOCK_GET_POST = {
  code: "1000",
  message: "OK",
  data: [
    {
      id: DEMO_MOCK_POST_IDS.submissionPrimary,
      type: "submission",
      described:
        "#course_demo_teacher #exercise_001 Em nộp bài với 2 góc quay theo đúng yêu cầu.",
      created: "2026-05-19T08:30:00.000Z",
      modified: "2026-05-19T08:45:00.000Z",
      like: "12",
      comment: "3",
      like_count: 12,
      comment_count: 3,
      is_liked: 0,
      isLiked: false,
      can_submit: "0",
      canSubmit: false,
      video: [
        {
          url: DEMO_VIDEO_ASSETS.left.url,
          thumb: DEMO_VIDEO_ASSETS.left.thumb,
        },
        {
          url: DEMO_VIDEO_ASSETS.right.url,
          thumb: DEMO_VIDEO_ASSETS.right.thumb,
        },
      ],
      author: {
        id: DEMO_STUDENT.id,
        name: DEMO_STUDENT.displayName,
        avatar: DEMO_STUDENT.avatar,
        role: DEMO_STUDENT.role,
      },
      course_id: DEMO_TEACHER.id,
      exercise_id: DEMO_EXERCISES[0].id,
      source_post_id: DEMO_EXERCISES[0].id,
      edited_times: "1",
      is_blocked: "0",
      time_series_poses: [
        {
          frame: [
            {
              frame_id: "frame_001",
              created: "2026-05-19T08:30:00.000Z",
              poses: [
                {
                  pose_name: "left_arm",
                  pose_coord: {
                    x: "0.12",
                    y: "0.45",
                    z: "0.03",
                  },
                  confident: "0.95",
                },
                {
                  pose_name: "right_arm",
                  pose_coord: {
                    x: "0.52",
                    y: "0.42",
                    z: "0.05",
                  },
                  confident: "0.93",
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

export default MOCK_GET_POST;
