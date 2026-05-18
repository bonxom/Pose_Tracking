# Backend Mismatches Và Ghi Chú Contract Chưa Giải Quyết

Ngày trạng thái: 2026-05-18

Các ghi chú này đến từ probe backend deployed tại `https://group1.it4788.sukkaito.id.vn` và HTTP fallback.

## Mismatch đã xác nhận

| Khu vực | Expected / assumption trước đó | Hành vi deployed | Frontend handling |
|---|---|---|---|
| Default transport | HTTP là base ban đầu | HTTPS hoạt động, HTTP redirect sang HTTPS; HTTP multipart probe có thể lỗi `Multipart: Unexpected end of form` | Default API base là HTTPS; HTTP chỉ fallback |
| API base path | `/login` có thể hoạt động | `/login` trả 404; `/it4788/login` active | Default `EXPO_PUBLIC_API_BASE_URL` giữ `/it4788` |
| Login payload | Chỉ `phonenumber` và `password` | Login cần thêm `devtoken`; các field `device_token`, `deviceToken`, `uuid` bị reject | Server login gửi `devtoken` |
| Demo accounts | Local demo credentials có thể login server | Demo credentials local trả `9995 User is not validated` | Demo buttons chỉ local/dev, không chứng minh backend success |
| Like endpoint | `/it4788/like` là expected endpoint | `POST /it4788/like` trả 404 | Repository gọi đúng spec nhưng không fake success nếu fail |
| Delete endpoint | `/it4788/delete_post` là expected endpoint | `POST /it4788/delete_post` trả 404 | Wrapper/repository giữ theo spec; server mode hiển thị lỗi an toàn |
| Feed params | JSON numeric `index`/`count` an toàn | JSON numeric `index` trả `index must be a string`; form-urlencoded tốt hơn | `get_list_posts` dùng form-urlencoded string values |
| add_post transport | Có thể JSON hoặc multipart | JSON/form trả `500 Exception error`; multipart tới token validation | `add_post` chỉ dùng multipart |
| add_post payload | Course/exercise/video fields | `device_slave` required trước token validation | Frontend gửi `device_slave` |
| add_post file fields | Spec yêu cầu 2 video | Real-account multipart tests reject mọi field set đã thử bằng `Unexpected field` | Frontend multipart-capable; cần backend xác nhận field file thật |
| set_comment payload | `token`, `id`, `comment` có thể đủ | Deployed route còn hỏi `index` | Frontend gửi thêm `index` và `count` best-effort |
| API availability | 40 API expected theo spec | Một số route chỉ quan sát được đến token validation; vài route 404 | Probe script bao phủ 40 API và ghi status/transport |
| Verification code field | Spec có `check_verify_code` | Deployed reject common code fields với invalid phone payloads | E2E thử common field names; cần valid signup/OTP probe |
| check_new_item auth | Authenticated freshness check có session token | Runtime reject `token`; no-token probe từng trả `1000 OK` | Repository gửi token theo spec trước, rồi retry không token có ghi chú |
| change_info_after_signup payload | Profile completion cần khớp auth slides; `set_user_info` dùng `user_name/avatar/cover_image` | Deployed reject `user_name` trước token validation | Auth adapter thử spec fields rồi legacy `username/height/avatar` |
| set_request_course payload | Course request theo metadata course | Deployed tới token validation chỉ khi có cả `course_id` và `user_id` | Repository gửi `course_id` và session `user_id`, không dùng course id làm user id |
| get_list_courses_of_student params | Slides: `token` + `user_id` | Runtime existing-account ổn hơn khi có pagination compatibility | Repository gửi `user_id` + string `index`/`count` |
| get_list_courses_of_student HV data | Phải trả joined courses hoặc empty state hợp lệ | Một run HV trả `1001 Can not connect to DB`; run mới nhất trả `9994 No data` | UI giữ error state và coi đây là rủi ro backend/data |
| course_id identity | Trước đó course id chưa rõ | Backend team nói `course_id` là teacher/GV id | Mock data và E2E helper dùng GV id khi bật flag |
| exercise entity | Slide/modeling từng được hiểu có `exercise_id` riêng | Backend team nói không có exercise entity, nhưng deployed HV `add_post` metadata-only vẫn báo cần `exercise_id and course_id` | Adapter có thể omit `exercise_id`; mock mode model exercise-like item là teacher post; mismatch còn mở |
| search payload | General/profile search là spec flows | Runtime cần/chấp nhận `user_id` | Repository gửi current session user id |
| check_new_version field | Slides dùng style snake-case `last_update` | Runtime reject `last_update`, accept `lastUpdate` | Repository thử spec trước rồi retry camelCase |
| get_user_info field | Slides: `token` + `user_id` | Runtime reject `user_id` | Repository thử spec trước rồi retry không `user_id` |
| get_notification field | Slides có `last_update` cho cache | Runtime reject `last_update` và accept không có field | Repository thử spec trước rồi retry không `last_update` |
| set_devtoken payload | Device token registration bắt buộc | Runtime cần numeric `devtype` | Repository/probe gửi `devtype: "1"` |
| Friend/user-social APIs | Slide mới có vẻ nhắc tới `get_user_friends` | `POST /it4788/get_user_friends`, `/get_list_friends`, `/get_friends` đều trả 404 | Friends tab do UI owner; handoff khuyến nghị dùng `search`, `get_user_info`, `get_list_blocks`, `set_block` tới khi backend xác nhận route |

## Runtime findings với real existing-account

Credential HV/GV thật chỉ dùng qua env vars. Cả hai account login thành công với backend code `1000` và có token.

Authenticated read/write findings:

- `get_list_posts` và `search` trả `9994 No data`, nên chưa test được object detail/pagination thật.
- `get_list_courses_of_student` trả `9994 No data` cho HV/GV trong run HTTPS mới nhất. Một run HV trước đó trả `1001 Can not connect to DB`.
- `get_saved_search`, `get_list_blocks`, `get_push_settings`, `get_list_conversation`, compatibility `get_user_info`, compatibility `get_notification`, compatibility `check_new_item`, compatibility `check_new_version` trả code `1000`.
- `set_devtoken` trả code `1000` sau khi dùng numeric `devtype`.
- HV nhận `1009 Not access` cho teacher-only `get_list_students` và `get_requested_enrollment`; GV nhận empty data.
- Real upload dùng teacher/GV id làm `course_id` được chuẩn bị, nhưng upload 2 video vẫn bị chặn do deployed reject mọi multipart file field name. Metadata-only HV control vẫn yêu cầu `exercise_id`, trái với clarification không có exercise entity.
- HTTPS và HTTP đều verified login/read. Ưu tiên HTTPS cho upload.
- Friend route probe với nhiều account login thành công, nhưng read candidates `get_user_friends`, `get_list_friends`, `get_friends` trả 404. Mutation candidates chưa chạy chờ backend xác nhận safe test data.

## Chưa xác minh hoặc đang bị chặn

- Signup/verify/profile-completion thật cho HV/GV mới.
- Shape feed thật từ `get_list_posts`.
- Shape post detail thật từ `get_post`, gồm `time_series_poses`.
- Shape comment creation thành công từ `set_comment`.
- Multipart `add_post` thành công và scoring/result payload.
- Payload object-rich cho search, courses, notifications, user-info.
- Mutations block/settings/conversations read-state, enrollment approval, saved-search deletion.
- Friend/user-social API chính thức nếu backend bổ sung.

## Quyết định triển khai

App mặc định dùng `EXPO_PUBLIC_API_TYPE=backend`. Ở mode này, repository không fake success. `EXPO_PUBLIC_API_TYPE=mock` là đường local-only rõ ràng. Legacy `EXPO_PUBLIC_DATA_SOURCE=server|local|auto` vẫn được hỗ trợ cho script cũ.
