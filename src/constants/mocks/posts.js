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
    <td>00:03</td>
    <td>-1</td>
    <td>Tay phải đưa lên cao quá</td>
  </tr>
  <tr>
    <td>2</td>
    <td>00:08</td>
    <td>-1</td>
    <td>Đầu chưa quay đúng hướng</td>
  </tr>
</table>
`;

const FIRST_POST_COMMENTS = [
  {
    id: "comment_score_client_001",
    authorName: "Ứng dụng tự chấm",
    content: "Điểm tạm thời: 8.0/10. Đã phát hiện 2 lỗi chính trong bài nộp.",
    createdAt: "2026-04-08T07:06:00.000Z",
    score: "8.0",
    detailMistakes: SCORE_HTML,
    isScoreComment: true,
  },
  ...Array.from({ length: 22 }, (_, index) => ({
    id: `comment_seed_long_${index + 1}`,
    authorName: index % 2 === 0 ? "Nguyen Van A" : "Tran Thi B",
    content:
      index % 4 === 0
        ? 'Mình đã xem lại và thấy luồng comment này đủ để test nút "Xem các bình luận trước...".'
        : "Đây là bình luận mẫu để kiểm tra việc phân trang bình luận và giữ bản nháp khi mất mạng.",
    createdAt: new Date(Date.UTC(2026, 3, 7, 8, index, 0)).toISOString(),
  })),
];

export const DEFAULT_POSTS = [
  {
    id: "post_seed_001",
    author: {
      id: "user_teacher_001",
      name: "Đại úy Chính",
      handle: "@btt_gv",
      role: "GV",
      online: true,
      avatar: "",
    },
    createdAt: "2026-04-08T07:00:00.000Z",
    content: `Bài tập mẫu của GV cho tuần này. Khi HV nộp bài, hệ thống sẽ đối sánh 2 video, tự chấm điểm và thêm bình luận lỗi sai. Bài viết này được giữ dài hơn để test đúng giao diện "Xem thêm/Thu gọn" ngoài trang chủ.`,
    described: `Bài tập mẫu của GV cho tuần này. Khi HV nộp bài, hệ thống sẽ đối sánh 2 video, tự chấm điểm và thêm bình luận lỗi sai. Bài viết này được giữ dài hơn để test đúng giao diện "Xem thêm/Thu gọn" ngoài trang chủ.`,
    videos: [
      {
        id: "video_seed_left_001",
        name: "left-demo.mp4",
        uri: "mock://left-demo.mp4",
        duration: 18000,
        fileSize: 18_000_000,
      },
      {
        id: "video_seed_right_001",
        name: "right-demo.mp4",
        uri: "mock://right-demo.mp4",
        duration: 17500,
        fileSize: 19_000_000,
      },
    ],
    likeCount: 18,
    commentCount: FIRST_POST_COMMENTS.length,
    isLiked: false,
    canComment: true,
    canEdit: false,
    exerciseId: "",
    courseId: "",
    comments: FIRST_POST_COMMENTS,
  },
  {
    id: "post_seed_002",
    author: {
      id: "user_student_001",
      name: "Nguyen Van A",
      handle: "@hv_nguyenvana",
      role: "HV",
      online: false,
      avatar: "",
    },
    createdAt: "2026-04-06T14:30:00.000Z",
    content: "#course_12 #exercise_34 Em đã nộp bài với đủ 2 video. Bài này dùng để test luồng HV nộp bài theo exercise_id và course_id.",
    described: "#course_12 #exercise_34 Em đã nộp bài với đủ 2 video. Bài này dùng để test luồng HV nộp bài theo exercise_id và course_id.",
    videos: [
      {
        id: "video_seed_left_002",
        name: "student-left.mp4",
        uri: "mock://student-left.mp4",
        duration: 15000,
        fileSize: 15_400_000,
      },
      {
        id: "video_seed_right_002",
        name: "student-right.mp4",
        uri: "mock://student-right.mp4",
        duration: 15200,
        fileSize: 16_100_000,
      },
    ],
    likeCount: 7,
    commentCount: 3,
    isLiked: true,
    canComment: true,
    canEdit: true,
    exerciseId: "exercise_34",
    courseId: "course_12",
    comments: [
      {
        id: "comment_seed_201",
        authorName: "Ứng dụng tự chấm",
        content: "Điểm tạm thời: 7.5/10. Có lỗi ở pha xoay đầu và nhịp chân trái.",
        createdAt: "2026-04-06T14:35:00.000Z",
        score: "7.5",
        detailMistakes: SCORE_HTML,
        isScoreComment: true,
      },
      {
        id: "comment_seed_202",
        authorName: "Admin - Easy Mocap",
        content: "Điểm từ server: 7.8/10. Kết quả đã đồng bộ với hệ thống chấm chính thức.",
        createdAt: "2026-04-06T14:45:00.000Z",
        score: "7.8",
        detailMistakes: SCORE_HTML,
        isScoreComment: true,
      },
      {
        id: "comment_seed_203",
        authorName: "Đại úy Chính",
        content: "Động tác đã ổn hơn, nhưng cần giữ thẳng tay phải ở nhịp thứ 3.",
        createdAt: "2026-04-06T15:00:00.000Z",
      },
    ],
  },
  {
    id: "post_seed_003",
    author: {
      id: "user_teacher_002",
      name: "Trung đội trưởng Cường",
      handle: "@gv_cuong",
      role: "GV",
      online: true,
      avatar: "",
    },
    createdAt: "2026-04-02T09:10:00.000Z",
    content: "Bài viết này đang khóa bình luận để test đúng trường can_comment từ API get_list_posts / get_post.",
    described: "Bài viết này đang khóa bình luận để test đúng trường can_comment từ API get_list_posts / get_post.",
    videos: [
      {
        id: "video_seed_left_003",
        name: "locked-left.mp4",
        uri: "mock://locked-left.mp4",
        duration: 12100,
        fileSize: 10_200_000,
      },
      {
        id: "video_seed_right_003",
        name: "locked-right.mp4",
        uri: "mock://locked-right.mp4",
        duration: 11800,
        fileSize: 9_900_000,
      },
    ],
    likeCount: 2,
    commentCount: 0,
    isLiked: false,
    canComment: false,
    canEdit: false,
    comments: [],
  },
];
