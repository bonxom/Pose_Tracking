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
  id: DEMO_TEACHER.id,
  hashtag: `#course_${DEMO_TEACHER.id}`,
  title: "Tập động tác diễu binh diễu hành",
  teacherId: DEMO_TEACHER.id,
  teacherName: DEMO_TEACHER.displayName,
  description:
    "Khóa luyện tập tư thế, nhịp bước, động tác tay và quay đầu theo chuẩn đội hình diễu binh.",
  enrolled: true,
  studentCount: 42,
  exerciseCount: 3,
  latestExerciseId: "post_teacher_exercise_001",
};

export const DEMO_EXERCISES = [
  {
    id: "post_teacher_exercise_001",
    sourcePostId: "post_teacher_exercise_001",
    hashtag: "#exercise_chao_dieu_lenh",
    title: "Động tác chào điều lệnh",
    summary: "Giữ thân thẳng, tay phải lên đúng góc, mắt nhìn thẳng theo khẩu lệnh.",
    dueText: "Hạn nộp: 07/05/2026",
  },
  {
    id: "post_teacher_exercise_002",
    sourcePostId: "post_teacher_exercise_002",
    hashtag: "#exercise_buoc_deu",
    title: "Bước đều tại chỗ",
    summary: "Luyện nhịp chân trái/phải, giữ tay đánh đều và không lệch hàng.",
    dueText: "Hạn nộp: 08/05/2026",
  },
  {
    id: "post_teacher_exercise_003",
    sourcePostId: "post_teacher_exercise_003",
    hashtag: "#exercise_quay_phai",
    title: "Quay phải theo nhịp",
    summary: "Tập quay người đúng trục, dứt khoát ở nhịp cuối.",
    dueText: "Hạn nộp: 09/05/2026",
  },
];

export const DEMO_MOCK_POST_IDS = {
  submissionPrimary: "12345678",
  teacherExercise01: "post_teacher_exercise_001",
  studentSubmission02: "post_student_submission_002",
  teacherExercise02: "post_teacher_exercise_002",
};

export const DEMO_VIDEO_ASSETS = {
  left: {
    url: "assets/vid_first.mp4",
    thumb:
      "https://scontent.fhan15-1.fna.fbcdn.net/v/t39.30808-6/558141326_2249246405590900_261624433520061036_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=94e2a3&_nc_eui2=AeGdg74i1AkXDVbdozDSKl6BGxYHR7mPN9MbFgdHuY830yJZnOQGW8Y1ndkBZGiQHhj6GDgpAMYTTd8Dy-MMZgOr&_nc_ohc=KnO6bb2yB_QQ7kNvwGX-b0E&_nc_oc=AdqmcXtIwlqZ2UMS0VhA44y8E1fKQjdQVjM_bYz1bFNm7zuN-SAqiLAUG19EhkZQ_n0eKldOk72gFIgBtpgI4UB1&_nc_zt=23&_nc_ht=scontent.fhan15-1.fna&_nc_gid=9prgd3po8mhh5ys5IBFa6w&_nc_ss=7b2a8&oh=00_Af6nqYQ2m2P-2ilId02pOVGMVaRXaNTMYSwURy2RnZvAKA&oe=6A11B148",
  },
  right: {
    url: "assets/vid_second.mp4",
    thumb: "https://picsum.photos/seed/vid_second_thumb/480/270",
  },
};

export const DEMO_VIDEO_PLACEHOLDERS = [
  {
    id: "demo_left_video",
    name: "demo-goc-trai.mp4",
    uri: DEMO_VIDEO_ASSETS.left.url,
    thumb: DEMO_VIDEO_ASSETS.left.thumb,
    angle: "Góc quay trái",
    duration: 16000,
    fileSize: 12_400_000,
  },
  {
    id: "demo_right_video",
    name: "demo-goc-phai.mp4",
    uri: DEMO_VIDEO_ASSETS.right.url,
    thumb: DEMO_VIDEO_ASSETS.right.thumb,
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
    notification_id: "notif_new_exercise",
    type: "new_exercise",
    title: "GV vừa đăng bài tập mới",
    body: "Động tác chào điều lệnh đã sẵn sàng để nộp bài.",
    createdAt: "2026-05-06T00:30:00.000Z",
    unread: true,
    read: 0,
    badge: 3,
    group: "post",
    last_update: "2026-05-06T00:30:00.000Z",
    targetType: "post",
    targetId: "post_teacher_exercise_001",
  },
  {
    id: "notif_enrolled",
    notification_id: "notif_enrolled",
    type: "enrollment",
    title: "Đã tham gia khóa học",
    body: "Bạn đã được duyệt vào khóa Tập động tác diễu binh diễu hành.",
    createdAt: "2026-05-05T13:00:00.000Z",
    unread: true,
    read: 0,
    badge: 2,
    group: "course",
    last_update: "2026-05-05T13:00:00.000Z",
    targetType: "course",
    targetId: DEMO_COURSE.id,
  },
  {
    id: "notif_scoring_done",
    notification_id: "notif_scoring_done",
    type: "scoring",
    title: "Đã có kết quả chấm tự động",
    body: "Bài nộp gần nhất đạt 86/100. Mở bài viết để xem lỗi và gợi ý.",
    createdAt: "2026-05-05T12:20:00.000Z",
    unread: true,
    read: 0,
    badge: 1,
    group: "post",
    last_update: "2026-05-05T12:20:00.000Z",
    targetType: "post",
    targetId: "post_seed_002",
  },
  {
    id: "notif_comment",
    notification_id: "notif_comment",
    type: "comment",
    title: "Đại úy Chính đã bình luận",
    body: "Cần giữ tay phải chắc hơn ở nhịp thứ 3.",
    createdAt: "2026-05-04T15:15:00.000Z",
    unread: false,
    read: 1,
    badge: 0,
    group: "post",
    last_update: "2026-05-04T15:15:00.000Z",
    targetType: "post",
    targetId: "post_seed_002",
  },
  {
    id: "notif_like",
    notification_id: "notif_like",
    type: "like",
    title: "Một học viên đã thích bài nộp",
    body: "Bài luyện tập của bạn có thêm lượt thích mới.",
    createdAt: "2026-05-04T10:10:00.000Z",
    unread: false,
    read: 1,
    badge: 0,
    group: "post",
    last_update: "2026-05-04T10:10:00.000Z",
    targetType: "post",
    targetId: "post_seed_002",
  },
];

export const DEMO_CONVERSATIONS = [
  {
    id: "conversation_teacher",
    title: "Đại úy Chính",
    lastMessage: "Em nộp đủ 2 góc quay, hệ thống sẽ chấm tự động.",
    unread: true,
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

export const DEMO_FRIENDS = [
  {
    id: DEMO_TEACHER.id,
    username: DEMO_TEACHER.displayName,
    displayName: DEMO_TEACHER.displayName,
    role: DEMO_TEACHER.role,
    phonenumber: DEMO_TEACHER.phonenumber,
    avatar: DEMO_TEACHER.avatar,
  },
  {
    id: "demo_student_002",
    username: "Tran Thi B",
    displayName: "Tran Thi B",
    role: "HV",
    phonenumber: "0900000012",
    avatar: "",
  },
  {
    id: "demo_teacher_002",
    username: "Trung doi truong Cuong",
    displayName: "Trung đội trưởng Cường",
    role: "GV",
    phonenumber: "0900000022",
    avatar: "",
  },
];

export const DEMO_SAVED_SEARCHES = [
  {
    id: "saved_search_salute",
    keyword: "chao dieu lenh",
    createdAt: "2026-05-06T01:00:00.000Z",
  },
  {
    id: "saved_search_teacher",
    keyword: DEMO_TEACHER.displayName,
    createdAt: "2026-05-05T08:30:00.000Z",
  },
  {
    id: "saved_search_course",
    keyword: DEMO_COURSE.title,
    createdAt: "2026-05-04T09:30:00.000Z",
  },
];

export const DEMO_BLOCKS = [
  {
    id: "demo_blocked_user_001",
    username: "Nguoi dung bi chan",
    role: "HV",
    avatar: "",
  },
];

export const DEMO_ENROLLMENT_REQUESTS = [
  {
    id: "demo_pending_request_001",
    user_id: "demo_student_pending_001",
    username: "Le Thi C",
    role: "HV",
    phonenumber: "0900000033",
    status: "pending",
  },
];

export const DEMO_PUSH_SETTINGS = {
  like_comment: true,
  from_friends: true,
  requested_friend: true,
  suggested_friend: true,
  birthday: true,
  video: true,
  report: true,
  sound_on: true,
  notification_on: true,
  vibrant_on: true,
  led_on: true,
};
