export const DEMO_STUDENT = {
  id: "demo_student_001",
  username: "Nguyen Van A",
  displayName: "Nguyen Van A",
  phonenumber: "0900000001",
  password: "123456",
  role: "HV",
  handle: "@hv_nguyenvana",
  height: "170",
  avatar: "",
};

export const DEMO_TEACHER = {
  id: "demo_teacher_001",
  username: "Dai uy Chinh",
  displayName: "Đại úy Chính",
  phonenumber: "0900000002",
  password: "123456",
  role: "GV",
  handle: "@gv_chinh",
  height: "176",
  avatar: "",
};

export const DEMO_COURSE = {
  id: "course_marching_101",
  hashtag: "#course_marching_101",
  title: "Tập động tác diễu binh diễu hành",
  teacherId: DEMO_TEACHER.id,
  teacherName: DEMO_TEACHER.displayName,
  description:
    "Khóa luyện tập tư thế, nhịp bước, động tác tay và quay đầu theo chuẩn đội hình diễu binh.",
  enrolled: true,
  studentCount: 42,
  exerciseCount: 3,
  latestExerciseId: "exercise_salute_001",
};

export const DEMO_EXERCISES = [
  {
    id: "exercise_salute_001",
    sourcePostId: "post_teacher_exercise_001",
    hashtag: "#exercise_chao_dieu_lenh",
    title: "Động tác chào điều lệnh",
    summary: "Giữ thân thẳng, tay phải lên đúng góc, mắt nhìn thẳng theo khẩu lệnh.",
    dueText: "Hạn nộp: 07/05/2026",
  },
  {
    id: "exercise_march_002",
    sourcePostId: "post_teacher_exercise_002",
    hashtag: "#exercise_buoc_deu",
    title: "Bước đều tại chỗ",
    summary: "Luyện nhịp chân trái/phải, giữ tay đánh đều và không lệch hàng.",
    dueText: "Hạn nộp: 08/05/2026",
  },
  {
    id: "exercise_turn_003",
    sourcePostId: "post_teacher_exercise_003",
    hashtag: "#exercise_quay_phai",
    title: "Quay phải theo nhịp",
    summary: "Tập quay người đúng trục, dứt khoát ở nhịp cuối.",
    dueText: "Hạn nộp: 09/05/2026",
  },
];

export const DEMO_VIDEO_PLACEHOLDERS = [
  {
    id: "demo_left_video",
    name: "demo-goc-trai.mp4",
    uri: "demo://submission-left-camera",
    angle: "Góc quay trái",
    duration: 16000,
    fileSize: 12_400_000,
  },
  {
    id: "demo_right_video",
    name: "demo-goc-phai.mp4",
    uri: "demo://submission-right-camera",
    angle: "Góc quay phải",
    duration: 16200,
    fileSize: 12_800_000,
  },
];

export const DEMO_SCORING_TEMPLATES = [
  {
    score: 86,
    label: "Đạt yêu cầu",
    mistakes: [
      "Tay phải chưa thẳng ở nhịp 3",
      "Bước chân trái lệch nhịp 5",
    ],
    suggestions: [
      "Giữ khuỷu tay cố định khi đưa tay lên",
      "Tập lại đoạn 00:08-00:12 với nhịp đếm chậm",
    ],
  },
  {
    score: 82,
    label: "Cần chỉnh nhịp",
    mistakes: [
      "Vai trái hơi nghiêng khi đổi nhịp",
      "Mắt chưa nhìn thẳng sau khẩu lệnh",
    ],
    suggestions: [
      "Giữ vai cân bằng trước khi bước",
      "Đánh dấu điểm nhìn cố định khi tập cá nhân",
    ],
  },
];

export const DEMO_NOTIFICATIONS = [
  {
    id: "notif_new_exercise",
    type: "new_exercise",
    title: "GV vừa đăng bài tập mới",
    body: "Động tác chào điều lệnh đã sẵn sàng để nộp bài.",
    createdAt: "2026-05-06T00:30:00.000Z",
    unread: true,
    targetType: "post",
    targetId: "post_teacher_exercise_001",
  },
  {
    id: "notif_enrolled",
    type: "enrollment",
    title: "Đã tham gia khóa học",
    body: "Bạn đã được duyệt vào khóa Tập động tác diễu binh diễu hành.",
    createdAt: "2026-05-05T13:00:00.000Z",
    unread: true,
    targetType: "course",
    targetId: DEMO_COURSE.id,
  },
  {
    id: "notif_scoring_done",
    type: "scoring",
    title: "Đã có kết quả chấm tự động",
    body: "Bài nộp gần nhất đạt 86/100. Mở bài viết để xem lỗi và gợi ý.",
    createdAt: "2026-05-05T12:20:00.000Z",
    unread: true,
    targetType: "post",
    targetId: "post_seed_002",
  },
  {
    id: "notif_comment",
    type: "comment",
    title: "Đại úy Chính đã bình luận",
    body: "Cần giữ tay phải chắc hơn ở nhịp thứ 3.",
    createdAt: "2026-05-04T15:15:00.000Z",
    unread: false,
    targetType: "post",
    targetId: "post_seed_002",
  },
  {
    id: "notif_like",
    type: "like",
    title: "Một học viên đã thích bài nộp",
    body: "Bài luyện tập của bạn có thêm lượt thích mới.",
    createdAt: "2026-05-04T10:10:00.000Z",
    unread: false,
    targetType: "post",
    targetId: "post_seed_002",
  },
];

export const DEMO_CONVERSATIONS = [
  {
    id: "conversation_teacher",
    title: "Đại úy Chính",
    lastMessage: "Em nộp đủ 2 góc quay, hệ thống sẽ chấm tự động.",
    messages: [
      {
        id: "msg_001",
        sender: "teacher",
        text: "Bài tuần này cần 2 góc quay: trái và phải.",
        createdAt: "2026-05-05T08:00:00.000Z",
      },
      {
        id: "msg_002",
        sender: "student",
        text: "Em đã rõ, em sẽ nộp bản demo sáng mai.",
        createdAt: "2026-05-05T08:03:00.000Z",
      },
    ],
  },
];
