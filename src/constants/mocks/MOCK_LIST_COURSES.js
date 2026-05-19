const MOCK_LIST_COURSES = {
  code: "1000",
  message: "OK",
  data: {
    total: "2",
    courses: [
      {
        course_id: "teacher-uuid-aaaa-bbbb-cccc",
        description: "Đông tác đi đều tại chỗ",
        username: "Nguyen_Van_A",
        avatar: "https://api.dicebear.com/9.x/adventurer/png?seed=nguyen_van_a",
        left_video: {
          url: "assets/vid_first.mp4",
          thumb:
            "https://storage.googleapis.com/mercari-bucket/proxied/video-yoga-left.png",
        },
        right_video: {
          url: "assets/vid_second.mp4",
          thumb:
            "https://storage.googleapis.com/mercari-bucket/proxied/video-yoga-right.png",
        },
        is_enrolled: "1",
        is_requested: "0",
      },
      {
        course_id: "teacher-uuid-dddd-eeee-ffff",
        description: "Động tác chào hiệu lệnh",
        username: "Tran_Thi_B",
        avatar: "https://api.dicebear.com/9.x/adventurer/png?seed=tran_thi_b",
        left_video: {
          url: "assets/vid_first.mp4",
          thumb:
            "https://storage.googleapis.com/mercari-bucket/proxied/video-gym-left.png",
        },
        right_video: {
          url: "assets/vid_second.mp4",
          thumb:
            "https://storage.googleapis.com/mercari-bucket/proxied/video-gym-right.png",
        },
        is_enrolled: "0",
        is_requested: "1",
      },
    ],
  },
};

export default MOCK_LIST_COURSES;
