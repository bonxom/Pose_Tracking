import {
  DEMO_COURSE,
  DEMO_EXERCISES,
  DEMO_SCORING_TEMPLATES,
  DEMO_STUDENT,
  DEMO_TEACHER,
} from "@/constants/demo";

const SCORE_HTML = `
<table>
  <tr>
    <th>STT</th>
    <th>Thời điểm lỗi</th>
    <th>Điểm trừ</th>
    <th>Chi tiết lỗi</th>
  </tr>
  <tr>
    <td>1</td>
    <td>00:08</td>
    <td>-7</td>
    <td>Tay phải chưa thẳng ở nhịp 3</td>
  </tr>
  <tr>
    <td>2</td>
    <td>00:12</td>
    <td>-7</td>
    <td>Bước chân trái lệch nhịp 5</td>
  </tr>
</table>
`;

const scoringTemplate = DEMO_SCORING_TEMPLATES[0];

const teacherAuthor = {
  id: DEMO_TEACHER.id,
  name: DEMO_TEACHER.displayName,
  handle: DEMO_TEACHER.handle,
  role: DEMO_TEACHER.role,
  online: true,
  avatar: "",
};

const studentAuthor = {
  id: DEMO_STUDENT.id,
  name: DEMO_STUDENT.displayName,
  handle: DEMO_STUDENT.handle,
  role: DEMO_STUDENT.role,
  online: false,
  avatar: "",
};

const FIRST_POST_COMMENTS = [
  {
    id: "comment_teacher_001",
    authorName: "Chu Đức Nghính",
    content: "Các em nộp đủ 2 góc quay để hệ thống chấm tư thế chính xác hơn.",
    createdAt: "2026-05-06T00:40:00.000Z",
  },
  {
    id: "comment_student_001",
    authorName: "Nguyen Van A",
    content: "Em đã xem mẫu, sáng mai em sẽ nộp bài demo.",
    createdAt: "2026-05-06T01:10:00.000Z",
  },
];

export const DEFAULT_POSTS = [
  {
    id: "post_teacher_exercise_001",
    type: "exercise",
    author: teacherAuthor,
    createdAt: "2026-05-06T00:30:00.000Z",
    content:
      "Bài tập chú nghinh: động tác chào điều lệnh. Học viên xem 2 góc quay mẫu, tập theo khẩu lệnh, sau đó bấm Nộp bài và gửi đủ 2 video để hệ thống chấm tự động. Hạn cuối nộp bài là trước 8h sáng mai để thầy có thời gian chấm và feedback trước buổi học. Các em chú ý xem kỹ phần mô tả chi tiết và gợi ý chấm điểm để tập cho đúng nhé. Các em ơi các em lớn rồi, banh cái đầu chóa của mình ra mà suy nghĩ. #course_marching_101 #exercise_chao_dieu_lenh.",
    described:
      "Bài tập chú nghinh: động tác chào điều lệnh. Học viên xem 2 góc quay mẫu, tập theo khẩu lệnh, sau đó bấm Nộp bài và gửi đủ 2 video để hệ thống chấm tự động. Hạn cuối nộp bài là trước 8h sáng mai để thầy có thời gian chấm và feedback trước buổi học. Các em chú ý xem kỹ phần mô tả chi tiết và gợi ý chấm điểm để tập cho đúng nhé. Các em ơi các em lớn rồi, banh cái đầu chóa của mình ra mà suy nghĩ. #course_marching_101 #exercise_chao_dieu_lenh.",
    videos: [
      {
        id: "video_standard_left_001",
        name: "mau-chao-dieu-lenh-goc-trai.mp4",
        uri: "demo://standard-left-salute",
        angle: "Góc quay trái",
        duration: 18000,
        fileSize: 18_000_000,
      },
      {
        id: "video_standard_right_001",
        name: "mau-chao-dieu-lenh-goc-phai.mp4",
        uri: "demo://standard-right-salute",
        angle: "Góc quay phải",
        duration: 17500,
        fileSize: 19_000_000,
      },
    ],
    likeCount: 31,
    isLiked: false,
    canComment: true,
    canEdit: false,
    canSubmit: true,
    courseId: DEMO_COURSE.id,
    exerciseId: DEMO_EXERCISES[0].id,
    courseTitle: DEMO_COURSE.title,
    exerciseTitle: DEMO_EXERCISES[0].title,
    hashtags: [DEMO_COURSE.hashtag, DEMO_EXERCISES[0].hashtag],
    comments: FIRST_POST_COMMENTS,
  },
  {
    id: "post_seed_002",
    type: "submission",
    author: studentAuthor,
    createdAt: "2026-05-05T13:20:00.000Z",
    content:
      `${DEMO_COURSE.hashtag} #exercise_chao_dieu_lenh Em nộp bài luyện tập với đủ 2 góc quay. Hệ thống đã tự chấm và gợi ý đoạn cần sửa.`,
    described:
      `${DEMO_COURSE.hashtag} #exercise_chao_dieu_lenh Em nộp bài luyện tập với đủ 2 góc quay. Hệ thống đã tự chấm và gợi ý đoạn cần sửa.`,
    videos: [
      {
        id: "video_seed_left_002",
        name: "student-left-salute.mp4",
        uri: "demo://student-left-salute",
        angle: "Góc quay trái",
        duration: 15000,
        fileSize: 15_400_000,
      },
      {
        id: "video_seed_right_002",
        name: "student-right-salute.mp4",
        uri: "demo://student-right-salute",
        angle: "Góc quay phải",
        duration: 15200,
        fileSize: 16_100_000,
      },
    ],
    likeCount: 12,
    isLiked: true,
    canComment: true,
    canEdit: true,
    canSubmit: false,
    courseId: DEMO_COURSE.id,
    exerciseId: DEMO_EXERCISES[0].id,
    sourcePostId: "post_teacher_exercise_001",
    courseTitle: DEMO_COURSE.title,
    exerciseTitle: DEMO_EXERCISES[0].title,
    hashtags: [DEMO_COURSE.hashtag, DEMO_EXERCISES[0].hashtag],
    scoreSummary: {
      score: scoringTemplate.score,
      label: scoringTemplate.label,
      mistakes: scoringTemplate.mistakes,
      suggestions: scoringTemplate.suggestions,
    },
    comments: [
      {
        id: "comment_seed_201",
        authorName: "Ứng dụng tự chấm",
        content:
          "Kết quả chấm tự động: 86/100. Lỗi chính: tay phải chưa thẳng ở nhịp 3; bước chân trái lệch nhịp 5. Gợi ý: giữ khuỷu tay cố định và tập lại đoạn 00:08-00:12.",
        createdAt: "2026-05-05T13:22:00.000Z",
        score: "86",
        detailMistakes: SCORE_HTML,
        isScoreComment: true,
      },
      {
        id: "comment_seed_203",
        authorName: "Đại úy Chính",
        content: "Bài đã ổn hơn, em chú ý giữ thân thẳng khi đưa tay lên.",
        createdAt: "2026-05-05T14:00:00.000Z",
      },
    ],
  },
  {
    id: "post_teacher_exercise_002",
    type: "exercise",
    author: teacherAuthor,
    createdAt: "2026-05-05T08:00:00.000Z",
    content:
      "Bài tập số 2: bước đều tại chỗ. Trọng tâm là giữ nhịp chân trái/phải đều, tay đánh cùng biên độ, không lệch vai khi nghe khẩu lệnh.",
    described:
      "Bài tập số 2: bước đều tại chỗ. Trọng tâm là giữ nhịp chân trái/phải đều, tay đánh cùng biên độ, không lệch vai khi nghe khẩu lệnh.",
    videos: [
      {
        id: "video_standard_left_002",
        name: "mau-buoc-deu-goc-trai.mp4",
        uri: "demo://standard-left-march",
        angle: "Góc quay trái",
        duration: 21000,
        fileSize: 20_000_000,
      },
      {
        id: "video_standard_right_002",
        name: "mau-buoc-deu-goc-phai.mp4",
        uri: "demo://standard-right-march",
        angle: "Góc quay phải",
        duration: 21000,
        fileSize: 20_500_000,
      },
    ],
    likeCount: 24,
    isLiked: false,
    canComment: true,
    canEdit: false,
    canSubmit: true,
    courseId: DEMO_COURSE.id,
    exerciseId: DEMO_EXERCISES[1].id,
    courseTitle: DEMO_COURSE.title,
    exerciseTitle: DEMO_EXERCISES[1].title,
    hashtags: [DEMO_COURSE.hashtag, DEMO_EXERCISES[1].hashtag],
    comments: [
      {
        id: "comment_seed_301",
        authorName: "Tran Thi B",
        content: "Thầy cho em hỏi có cần quay cả thân người không ạ?",
        createdAt: "2026-05-05T08:20:00.000Z",
      },
    ],
  },
  {
    id: "post_teacher_exercise_003",
    type: "exercise",
    author: {
      ...teacherAuthor,
      id: "demo_teacher_002",
      name: "Trung đội trưởng Cường",
      handle: "@gv_cuong",
    },
    createdAt: "2026-05-04T09:10:00.000Z",
    content:
      "Ôn tập quay phải theo nhịp. Bài này dùng để demo trạng thái khóa bình luận theo API can_comment.",
    described:
      "Ôn tập quay phải theo nhịp. Bài này dùng để demo trạng thái khóa bình luận theo API can_comment.",
    videos: [
      {
        id: "video_standard_left_003",
        name: "mau-quay-phai-goc-trai.mp4",
        uri: "demo://standard-left-turn",
        angle: "Góc quay trái",
        duration: 12100,
        fileSize: 10_200_000,
      },
      {
        id: "video_standard_right_003",
        name: "mau-quay-phai-goc-phai.mp4",
        uri: "demo://standard-right-turn",
        angle: "Góc quay phải",
        duration: 11800,
        fileSize: 9_900_000,
      },
    ],
    likeCount: 9,
    isLiked: false,
    canComment: false,
    canEdit: false,
    canSubmit: true,
    courseId: DEMO_COURSE.id,
    exerciseId: DEMO_EXERCISES[2].id,
    courseTitle: DEMO_COURSE.title,
    exerciseTitle: DEMO_EXERCISES[2].title,
    hashtags: [DEMO_COURSE.hashtag, DEMO_EXERCISES[2].hashtag],
    comments: [],
  },
];
