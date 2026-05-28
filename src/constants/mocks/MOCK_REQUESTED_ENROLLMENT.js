const MOCK_REQUESTED_ENROLLMENT = {
  code: "1000",
  message: "OK",
  data: {
    data: [
      {
        request: {
          id: "123e4567-e89b-12d3-a456-426614174000",
          user_name: "Phương Lý",
          avatar: "https://api.dicebear.com/9.x/adventurer/png?seed=phuong_ly",
          created: "2026-05-18T09:20:00.000Z",
        },
      },
      {
        request: {
          id: "223e4567-e89b-12d3-a456-426614174001",
          user_name: "Tuấn Đặng",
          avatar: "https://api.dicebear.com/9.x/adventurer/png?seed=tuan_dang",
          created: "2026-05-12T14:30:00.000Z",
        },
      },
      {
        request: {
          id: "323e4567-e89b-12d3-a456-426614174002",
          user_name: "Ngọc Đinh",
          avatar: "https://api.dicebear.com/9.x/adventurer/png?seed=ngoc_dinh",
          created: "2026-05-16T18:45:00.000Z",
        },
      },
      {
        request: {
          id: "423e4567-e89b-12d3-a456-426614174003",
          user_name: "Huy Phan",
          avatar: "https://api.dicebear.com/9.x/adventurer/png?seed=huy_phan",
          created: "2026-05-10T10:00:00.000Z",
        },
      },
      {
        request: {
          id: "523e4567-e89b-12d3-a456-426614174004",
          user_name: "Trang Mai",
          avatar: "https://api.dicebear.com/9.x/adventurer/png?seed=trang_mai",
          created: "2026-05-19T11:10:00.000Z",
        },
      },
      {
        request: {
          id: "623e4567-e89b-12d3-a456-426614174005",
          user_name: "Phong Lâm",
          avatar: "https://api.dicebear.com/9.x/adventurer/png?seed=phong_lam",
          created: "2026-05-15T08:15:00.000Z",
        },
      },
      {
        request: {
          id: "723e4567-e89b-12d3-a456-426614174006",
          user_name: "Oanh Tôn",
          avatar: "https://api.dicebear.com/9.x/adventurer/png?seed=oanh_ton",
          created: "2026-05-18T16:00:00.000Z",
        },
      },
      {
        request: {
          id: "823e4567-e89b-12d3-a456-426614174007",
          user_name: "Quang Võ",
          avatar: "https://api.dicebear.com/9.x/adventurer/png?seed=quang_vo",
          created: "2026-05-17T09:10:00.000Z",
        },
      },
      {
        request: {
          id: "923e4567-e89b-12d3-a456-426614174008",
          user_name: "Sơn Bùi",
          avatar: "https://api.dicebear.com/9.x/adventurer/png?seed=son_bui",
          created: "2026-05-14T12:05:00.000Z",
        },
      },
      {
        request: {
          id: "a23e4567-e89b-12d3-a456-426614174009",
          user_name: "Tùng Đỗ",
          avatar: "https://api.dicebear.com/9.x/adventurer/png?seed=tung_do",
          created: "2026-05-13T16:22:00.000Z",
        },
      },
      {
        request: {
          id: "b23e4567-e89b-12d3-a456-42661417400a",
          user_name: "Uyên Trần",
          avatar: "https://api.dicebear.com/9.x/adventurer/png?seed=uyen_tran",
          created: "2026-05-11T11:45:00.000Z",
        },
      },
      {
        request: {
          id: "c23e4567-e89b-12d3-a456-42661417400b",
          user_name: "Vinh Nguyễn",
          avatar:
            "https://api.dicebear.com/9.x/adventurer/png?seed=vinh_nguyen",
          created: "2026-05-18T10:15:00.000Z",
        },
      },
      {
        request: {
          id: "d23e4567-e89b-12d3-a456-42661417400c",
          user_name: "Yến Lê",
          avatar: "https://api.dicebear.com/9.x/adventurer/png?seed=yen_le",
          created: "2026-05-16T14:30:00.000Z",
        },
      },
      {
        request: {
          id: "e23e4567-e89b-12d3-a456-42661417400d",
          user_name: "Anh Phạm",
          avatar: "https://api.dicebear.com/9.x/adventurer/png?seed=anh_pham",
          created: "2026-05-17T17:00:00.000Z",
        },
      },
      {
        request: {
          id: "f23e4567-e89b-12d3-a456-42661417400e",
          user_name: "Bảo Hồ",
          avatar: "https://api.dicebear.com/9.x/adventurer/png?seed=bao_ho",
          created: "2026-05-15T19:25:00.000Z",
        },
      },
      {
        request: {
          id: "033e4567-e89b-12d3-a456-42661417400f",
          user_name: "Châu Huỳnh",
          avatar: "https://api.dicebear.com/9.x/adventurer/png?seed=chau_huynh",
          created: "2026-05-14T08:55:00.000Z",
        },
      },
      {
        request: {
          id: "133e4567-e89b-12d3-a456-426614174010",
          user_name: "Đức Trương",
          avatar: "https://api.dicebear.com/9.x/adventurer/png?seed=duc_truong",
          created: "2026-05-12T13:40:00.000Z",
        },
      },
      {
        request: {
          id: "233e4567-e89b-12d3-a456-426614174011",
          user_name: "Giang Đào",
          avatar: "https://api.dicebear.com/9.x/adventurer/png?seed=giang_dao",
          created: "2026-05-13T20:10:00.000Z",
        },
      },
      {
        request: {
          id: "333e4567-e89b-12d3-a456-426614174012",
          user_name: "Hiếu Đinh",
          avatar: "https://api.dicebear.com/9.x/adventurer/png?seed=hieu_dinh",
          created: "2026-05-18T22:30:00.000Z",
        },
      },
      {
        request: {
          id: "433e4567-e89b-12d3-a456-426614174013",
          user_name: "Khang Vũ",
          avatar: "https://api.dicebear.com/9.x/adventurer/png?seed=khang_vu",
          created: "2026-05-19T07:15:00.000Z",
        },
      },
      {
        request: {
          id: "533e4567-e89b-12d3-a456-426614174014",
          user_name: "Linh Dương",
          avatar: "https://api.dicebear.com/9.x/adventurer/png?seed=linh_duong",
          created: "2026-05-11T09:05:00.000Z",
        },
      },
      {
        request: {
          id: "633e4567-e89b-12d3-a456-426614174015",
          user_name: "Nhi Mai",
          avatar: "https://api.dicebear.com/9.x/adventurer/png?seed=nhi_mai",
          created: "2026-05-16T08:00:00.000Z",
        },
      },
    ],
    total: 22,
  },
};

export default MOCK_REQUESTED_ENROLLMENT;
