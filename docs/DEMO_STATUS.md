# Trạng Thái Demo / Server MVP

Ngày cập nhật: 2026-05-18

## Hoàn thành cho demo chạy được

- Docker web workflow chạy app qua Expo Web.
- Navigation 4 section theo leader: Home, Friends, Notifications, Profile.
- Backend mode mặc định với HTTPS base URL.
- Mock mode rõ ràng bằng `EXPO_PUBLIC_API_TYPE=mock`.
- Repository/API layer cho auth, feed/posts/comments/search/courses/notifications/profile/settings/blocks/conversations.
- Postman assets và docs handoff cho UI/backend team.
- Probe backend và E2E harness có thể chạy bằng Docker.

## Server-backed đã xác minh một phần

- HV/GV login thật trả token khi credential truyền qua env vars.
- Logout, saved searches, blocks, push settings, conversation list, check version, set devtoken, một số compatibility notification/user calls trả code `1000`.
- Feed/search/course list có thể trả empty state hợp lệ.

## Mock/local fallback

`mock mode` hỗ trợ:

- auth/signup/mock OTP/login/logout
- feed pagination/new-items
- create/edit/delete/report/like/comment local
- search/saved search
- course/enrollment pending/approval state
- notifications read/unread/badge `99+`
- profile/settings/push/password/device token local
- blocks/conversations stateful local data
- friend/user rows cho Friends UI

Mock mode không được dùng để claim backend integration.

## Backend/data blockers

- `/like` và `/delete_post` trả 404.
- Multipart upload thật bị `Unexpected field` với mọi field name đã thử.
- Backend team nói không có exercise entity, nhưng deployed HV `add_post` vẫn đòi `exercise_id` trong control metadata-only.
- `check_new_item`, `get_user_info`, `get_notification`, `check_new_version` có payload mismatch cần compatibility retry.
- Friend/user-social candidates `get_user_friends`, `get_list_friends`, `get_friends` trả 404.
- Shared accounts hiện không có object-rich data đủ để xác minh post detail, notification read, conversation detail, enrollment approval thật.

## Nên dùng mode nào

- Dev/API verification: `EXPO_PUBLIC_API_TYPE=backend`.
- UI build/demo backup khi backend không ổn định: `EXPO_PUBLIC_API_TYPE=mock`.
- Không dùng `auto` cho luồng sản phẩm mới nếu không có lý do rõ.
