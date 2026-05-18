# Báo Cáo Kiểm Thử Frontend Server

Ngày cập nhật: 2026-05-18

## Phạm vi

Kiểm thử tập trung vào frontend server-authoritative behavior, Docker web, repository calls và fallback mock. Không commit credential thật.

## Browser/web smoke cần chạy

```bash
EXPO_PUBLIC_API_TYPE=backend docker compose up -d
curl -I http://localhost:8081
```

Checklist backend mode:

1. Login bằng HV.
2. Kiểm tra Home feed/empty state.
3. Mở post nếu có dữ liệu.
4. Kiểm tra comment/like/report safe error khi backend mismatch.
5. Mở Friends, Notifications, Profile.
6. Mở `/search`, `/courses`, `/settings`, `/chat` nếu UI expose link.
7. Kiểm tra server mode không hiện composer chat send như product thật.
8. Logout.

Checklist mock mode:

```bash
EXPO_PUBLIC_API_TYPE=mock docker compose up -d --force-recreate
curl -I http://localhost:8081
```

1. Home có mock feed.
2. Search route hoạt động.
3. Courses route hoạt động.
4. Friends tab không crash và có dữ liệu mock nếu UI dùng.
5. Notifications có unread/badge mock.
6. Profile/settings/blocks/conversations dùng mock state.
7. Create/upload local path không gọi backend.

## Kết quả đã ghi nhận

- Web app mở ở `http://localhost:8081` khi Docker chạy.
- Top navigator 4 section được giữ: Home, Friends, Notifications, Profile.
- Search/Courses là route non-tab, không restore thành tab.
- Mock mode có guard để repository không gọi backend.
- Backend mode dùng repository và không fake success cho action server fail.

## Console/network risk cần theo dõi

- 404 từ `/like` và `/delete_post` là backend mismatch đã biết.
- Upload `Unexpected field` là backend multipart mismatch.
- Token-expired/session errors cần đi qua `redirectIfSessionExpired`.
- Nếu UI screen mới gọi raw `fetch`, cần refactor về repository.

## Kết luận

Frontend đủ sẵn sàng để UI team tiếp tục trên 4-section navigation. API owner scope còn lại là xác nhận contract backend thật, đặc biệt upload, friend APIs và dữ liệu seed object-rich.
