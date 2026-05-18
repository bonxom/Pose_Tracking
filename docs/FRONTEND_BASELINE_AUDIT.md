# Audit Baseline Frontend

Ngày cập nhật: 2026-05-18

## Tech stack phát hiện

- React Native + Expo.
- Expo Router.
- Expo Web cho demo trong Docker.
- Repository/API adapter layer trong `src/repositories/*`.
- Docker workflow dùng npm/package-lock.

## Route/screen chính

- `/(auth)/login`, signup/verify/change-info screens.
- `/(tabs)/home`: Home feed.
- `/(tabs)/friends`: Friends shell theo navigation mới.
- `/(tabs)/notifications`: Notifications.
- `/(tabs)/profile`: Profile/Menu.
- `/search`: non-tab search route.
- `/courses`: non-tab course/enrollment route.
- `/post/create`, `/post/[id]`, `/comment/[postId]`.
- `/chat`, `/chat/[id]`.
- `/settings`, `/settings/profile-edit`, `/settings/push`, `/settings/blocks`, `/settings/change-password`.

## Tính năng đã có

- Docker web demo.
- Backend/mock mode switch.
- Auth login/logout repository.
- Feed pagination, refresh, new-items hook.
- Post detail, comments, like/report/edit/delete hooks.
- Multipart create/upload path.
- Search/saved search hooks.
- Course/enrollment hooks.
- Notification list/read hooks.
- Profile/edit profile/settings/blocks/conversations hooks.
- Mock mode stateful cho UI backup.
- Probe/E2E scripts và Postman docs.

## Phần mock/local-only

- Mock auth/signup/OTP.
- Mock feed, post mutation, score/submission simulation nếu chạy mock mode.
- Mock friends/user rows.
- Mock conversation send; server mode không có send API trong danh sách 40 API.
- Mock notification/read/badge state.

## Thiếu hoặc bị backend chặn

- Upload thành công thật do multipart field mismatch.
- Object-rich feed/post/comment/notification/conversation data.
- Friend API thật nếu slide mới yêu cầu.
- Signup/OTP thật trong môi trường không có phone/OTP.
- Full client-side scoring nếu instructor yêu cầu ngoài server scoring.

## Rủi ro

- Backend deployed khác spec ở nhiều field.
- Shared accounts có thể không có dữ liệu seed đủ.
- Expo Go native qua Docker có thể advertise IP container; browser-over-LAN ổn định hơn.
- UI screens do nhiều teammate sửa nên API owner cần giữ repository contract rõ.

## Giai đoạn tiếp theo khuyến nghị

- Backend team xác nhận multipart file field names cho `add_post`/`edit_post`.
- Backend team xác nhận `exercise_id` sau khi đã nói không có exercise entity.
- Backend team xác nhận friend/user-social endpoint chính thức nếu slide mới yêu cầu.
- UI team wire Friends/Search/Courses vào thiết kế Facebook-like mà không gọi raw `fetch`.
