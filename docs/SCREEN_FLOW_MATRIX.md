# Ma Trận Luồng Màn Hình

Ngày cập nhật: 2026-05-18

| Flow | Route / screen | Server APIs used | Status | Notes |
|---|---|---|---|---|
| Login | `/(auth)/login` | `login`, `set_devtoken` | Server-first | Form thường gọi backend. Local demo buttons chỉ developer fallback trong server mode. |
| Signup | `/(auth)/signup-*`, `/(auth)/verify`, `/(auth)/change-info-after-signup` | `signup`, `get_verify_code`, `check_verify_code`, `change_info_after_signup`, `set_devtoken` | Server-ready, OTP-blocked | UI/runbook hỗ trợ manual OTP continuation. |
| Session resume / invalid token | root layout + repository errors | stored token/session | Partial | Central `SessionExpiredError` clear session; screens dùng `redirectIfSessionExpired`. Chưa có global fetch interceptor. |
| Home feed | `/(tabs)/home` | `get_list_posts`, `check_new_item`, `like` | Server-backed | Dùng server `last_id`, page size 20, refresh, load-more, new-items reload button. Existing accounts verified empty-feed state. |
| Friends | `/(tabs)/friends` | `search`, `get_user_info`, `get_list_blocks`, `set_block` | UI shell + API-ready fallback | Candidate `get_user_friends`, `get_list_friends`, `get_friends` hiện 404; dùng search/user/block APIs tới khi backend xác nhận route. |
| Post detail | `/post/[id]` | `get_post`, `like`, `get_comment`, `set_comment`, `edit_post`, `delete_post`, `report_post` | Server-backed | Owner HV edit/delete và non-owner report actions có sẵn. Edit UI hỗ trợ text + optional two-video replacement validation. |
| Create post / submit exercise | `/post/create` | `add_post` | Server-backed | Server mode cần đúng 2 video thật >=10s với duration tương tự. Placeholder chỉ local/dev. |
| Comments | `/comment/[postId]` và post detail | `get_comment`, `set_comment` | Server-backed | Hide comment input khi `can_comment=false`; giới hạn 500 ký tự. |
| Search | `/search` | `search`, `get_saved_search`, `del_saved_search` | Server-backed compact UI | Route non-tab mở từ top search actions; hỗ trợ profile search bằng `user_id`; có saved search delete. |
| Courses / enrollment | `/courses` | `get_list_courses_of_student`, `get_list_students`, `get_requested_enrollment`, `set_request_course`, `set_approve_enrollment` | Server-backed compact UI | Route non-tab; student request state là pending/requested tới khi backend approval. |
| Profile menu | `/(tabs)/profile` | `get_user_info`, `logout` | Server-backed | Hiển thị user/source và link settings/search/chat. |
| Edit profile | `/settings/profile-edit` | `get_user_info`, `set_user_info` | Server-backed | Dùng fields `user_name`, `avatar`, `cover_image`. |
| Push settings | `/settings/push` | `get_push_settings`, `set_push_settings` | Server-backed | Settings groups compact/defensive. |
| Change password | `/settings/change-password` | `change_password` | Server-backed | Safe error handling. |
| Device/version | `/settings` | `set_devtoken`, `check_new_version` | Server-backed | Device token cũng chạy sau server auth. |
| Blocks | `/settings/blocks` | `get_list_blocks`, `set_block` | Server-backed | Deduped block list, blurred avatars, block/unblock. |
| Notifications | `/(tabs)/notifications` | `get_notification`, `set_read_notification` | Server-backed | Normalize notification id/type/object/group/read/badge/last_update; unread badge `99+`; refresh/load-more. |
| Conversations | `/chat`, `/chat/[id]` | `get_list_conversation`, `get_conversation`, `set_read_message`, `delete_message`, `delete_conversation` | Server-backed | Composer hidden/disabled trong server mode vì spec 40 API không có send-message endpoint. |
| Logout | Profile menu | `logout` | Server-backed best effort | Local session clear dù backend logout không verify được. |

## UI depth còn lại

- Cần verify native media duration validation trên thiết bị thật.
- Object-level post/course/notification/conversation flows cần backend seed data thật.
- Notification cache có thể làm sâu hơn nếu slide yêu cầu persistent disk cache ngoài screen state.
- Full client-side scoring vẫn là gap riêng nếu môn học yêu cầu ngoài server scoring.
