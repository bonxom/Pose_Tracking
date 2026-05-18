# Kịch Bản Demo

Tài liệu này dành cho demo nhanh khi cần chạy web bằng Docker. Luồng chính hiện tại là backend mode; mock mode chỉ là backup khi backend không ổn định.

## Chuẩn bị

```bash
docker compose build
EXPO_PUBLIC_API_TYPE=backend docker compose up
```

Mở:

```text
http://localhost:8081
```

Nếu cần backup demo không gọi backend:

```bash
EXPO_PUBLIC_API_TYPE=mock docker compose up
```

## Credential

Không ghi credential thật vào repo. Khi demo backend thật, nhập credential do team cung cấp trực tiếp trong UI hoặc truyền qua env var cho E2E script.

Mock mode có tài khoản seed nội bộ cho UI demo. Tài khoản này chỉ chứng minh mock mode, không chứng minh backend.

## Luồng click đề xuất

1. Mở `http://localhost:8081`.
2. Login bằng account backend thật nếu backend đang ổn định.
3. Vào Home.
4. Kiểm tra feed/empty state/load-more/refresh.
5. Mở post detail nếu backend có post thật.
6. Thử comment/like/report; nếu backend trả mismatch thì UI phải hiển thị lỗi an toàn.
7. Mở Notifications.
8. Mở Profile.
9. Từ Profile hoặc action search, mở `/search` nếu UI đang expose.
10. Mở `/courses` nếu UI đang expose.
11. Kiểm tra Settings/Blocks/Chat nếu có link trong Profile.
12. Logout.

## Luồng backup bằng mock mode

1. Chạy `EXPO_PUBLIC_API_TYPE=mock docker compose up`.
2. Login bằng mock/demo path nếu UI expose developer fallback.
3. Kiểm tra Home feed có post teacher/student.
4. Tạo post/submission local với placeholder/video metadata.
5. Like/comment/report local.
6. Search, Notifications, Profile, Blocks, Conversations hoạt động bằng mock data.

## Giới hạn cần nói rõ khi demo

- Mock mode không gọi backend.
- Backend mode không fake thành công nếu server trả 404 hoặc mismatch.
- Backend team nói `course_id` bằng GV/teacher id và không có exercise entity riêng, nhưng deployed upload vẫn có mismatch về `exercise_id` và multipart field name.
- Friend APIs từ slide mới hiện chưa confirmed trên deployed backend; Friends UI có thể dùng search/user/block fallback.
