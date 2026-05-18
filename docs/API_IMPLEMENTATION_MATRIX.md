# Ma Trận Triển Khai API

Ngày cập nhật: 2026-05-18

Chú giải:

- `Yes`: đã triển khai ở layer đó và đã wire khi phù hợp.
- `Partial`: đã triển khai nhưng UI chưa đủ sâu, normalize chưa đầy đủ, hoặc chưa xác minh server success.
- `No`: chưa triển khai.
- `Blocked`: frontend đã có nhưng backend deployed, token/OTP hoặc dữ liệu thật chặn xác minh.
- `Empty`: backend trả empty state hợp lệ.
- `Compatibility`: frontend phải retry payload compatibility do deployed runtime khác spec.

Ma trận này tách riêng wrapper, repository, UI usage và verified server success. Chỉ có wrapper không được tính là hoàn thành.

| API | Params / behavior chính theo spec | Wrapper | Repository | UI / flow usage | Real success verified | Deployed status / notes |
|---|---|---:|---:|---:|---:|---|
| `login` | `phonenumber`, `password`; deployed cần thêm `devtoken` | Yes | Yes | Yes | Yes | HV/GV env-only accounts trả code `1000` và token qua HTTPS/HTTP fallback |
| `logout` | `token` | Yes | Yes | Yes | Yes | HV logout trả code `1000` |
| `signup` | `phonenumber`, `password`, `uuid`, `role` | Yes | Yes | Yes | No | Cần số điện thoại thật/OTP |
| `get_verify_code` | `phonenumber` | Yes | Yes | Yes | No | Cần số điện thoại thật |
| `check_verify_code` | verify code field theo slide/runtime | Yes | Yes | Yes | No | Cần valid signup probe để chốt field |
| `change_info_after_signup` | profile completion có token | Yes | Yes | Yes | No | Deployed reject `user_name`; frontend thử spec fields rồi legacy auth-completion fields |
| `get_list_posts` | `token`, `index`, `count`, `last_id`, `category_id`, `new_items` | Yes | Yes | Yes | Empty | Existing accounts trả `9994 No data`; pagination UI hoàn chỉnh nhưng chưa có post thật |
| `get_post` | `token`, post id; giữ `time_series_poses` | Yes | Yes | Yes | No | Thiếu post id thật |
| `add_post` | multipart, đúng 2 video, `course_id`, `device_slave`; slide cũ có `exercise_id` | Yes | Yes | Yes | No | Team nói không có exercise entity; deployed vẫn reject file field `Unexpected field`, HV metadata-only vẫn đòi `exercise_id` |
| `edit_post` | owner HV edit với rule replacement-video | Yes | Yes | Yes | No | UI edit detail đã có; thiếu post thật |
| `delete_post` | owner HV delete | Yes | Yes | Yes | No | Deployed `/delete_post` trả 404 |
| `get_comment` | `token`, post id, pagination | Yes | Yes | Yes | No | Thiếu post id thật |
| `set_comment` | text/link/emoticon, giới hạn length | Yes | Yes | Yes | No | Form payload tới token validation |
| `report_post` | non-owner report | Yes | Yes | Yes | No | UI report detail đã có; thiếu post thật |
| `like` | like/unlike server post | Yes | Yes | Yes | No | Deployed `/like` trả 404 |
| `search` | keyword, optional `user_id`, pagination | Yes | Yes | Yes | Empty | Existing accounts trả empty search hợp lệ; repository gửi `user_id` |
| `get_saved_search` | saved search list | Yes | Yes | Yes | Yes | Existing accounts trả code `1000` |
| `del_saved_search` | delete saved-search item | Yes | Yes | Yes | Not run | Mutation xóa không chạy mặc định trên shared accounts |
| `get_list_students` | teacher course student list | Yes | Yes | Yes | Empty / role-gated | GV trả empty; HV trả `1009 Not access` |
| `get_user_info` | `token`, `user_id` | Yes | Yes | Yes | Compatibility | Spec payload bị reject `user_id`; retry không có `user_id` trả `1000` |
| `set_user_info` | `token`, `user_name`, `avatar`, `cover_image` | Yes | Yes | Yes | No | Đã bỏ assumption sai về `height` |
| `get_list_courses_of_student` | `token`, `user_id` | Yes | Yes | Yes | Empty / intermittent risk | Latest HV/GV trả `9994 No data`; một lần HV cũ trả `1001 Can not connect to DB` |
| `get_list_blocks` | `token`, `index`, `count`, `user_id` | Yes | Yes | Yes | Yes | Existing accounts trả code `1000` |
| `set_block` | block/unblock user | Yes | Yes | Yes | No | UI block/unblock đã có |
| `set_approve_enrollment` | `token`, `user_id`, `is_accept` | Yes | Yes | Yes | No | Cần pending request thật |
| `get_requested_enrollment` | pending enrollment requests | Yes | Yes | Yes | No | Courses screen có hiển thị requests |
| `set_request_course` | course enrollment request | Yes | Yes | Yes | No | Repository gửi `course_id` + session `user_id`; latest run vẫn có backend/data issue |
| `get_push_settings` | settings groups từ slide | Yes | Yes | Yes | Yes | Existing accounts trả code `1000` |
| `set_push_settings` | update settings groups | Yes | Yes | Yes | No | Settings screen dùng repository |
| `change_password` | old/new password | Yes | Yes | Yes | No | Không chạy mutation nhạy cảm |
| `check_new_version` | lifecycle/settings version check | Yes | Yes | Yes | Compatibility | Spec `last_update` bị reject; deployed `lastUpdate` trả `1000` |
| `set_devtoken` | register device token | Yes | Yes | Yes | Yes | Mutation trả `1000` với numeric `devtype` |
| `get_conversation` | messages theo conversation id | Yes | Yes | Yes | No | Thiếu conversation id |
| `delete_message` | delete message | Yes | Yes | Yes | No | Detail delete action có sẵn |
| `get_list_conversation` | conversation list | Yes | Yes | Yes | Yes | Existing accounts trả code `1000`, chưa có objects |
| `delete_conversation` | delete conversation | Yes | Yes | Yes | No | Thiếu conversation id |
| `check_new_item` | `token`, `last_id`, `category_id`; new-items UX | Yes | Yes | Yes | Compatibility | Spec token payload bị reject; retry không token trả `1000` |
| `get_notification` | fields notification/cache: `notification_id`, `type`, `object_id`, `title`, `created`, `avatar`, `group`, `read`, `badge`, `last_update` | Yes | Yes | Yes | Compatibility | Spec `last_update` bị reject; retry không có field này trả `1000` |
| `set_read_message` | mark conversation read | Yes | Yes | Yes | No | Open conversation sẽ mark read |
| `set_read_notification` | `notification_id` read state | Yes | Yes | Yes | No | Tap notification sẽ mark read |

## Tóm tắt hoàn thành hiện tại

- Wrappers: tất cả 40 API có đại diện trong `src/api/client.js` trên feature branch API owner.
- Repositories: tất cả 40 API đi qua repository hoặc auth adapter; local adapters chỉ giữ cho development/mock mode.
- UI: các module bắt buộc có path UI, nhưng top navigator do leader sở hữu chỉ còn Home, Friends, Notifications, Profile. Search và Courses là route non-tab để UI team đặt vào vị trí mong muốn.
- Real success verification: account HV/GV thật xác minh login/logout và một số authenticated read/lifecycle API. Signup/OTP mới và object-specific post/course/notification/conversation mutations vẫn bị chặn bởi dữ liệu thật hoặc deployed mismatch.

## Candidate API Friend / User-Social từ slide mới

Các API này không thuộc danh sách 40 API cũ, nhưng slide mới có vẻ nhắc tới friend/user-social. Theo dõi riêng để không đánh dấu nhầm là complete.

| Candidate API | Wrapper | Repository | UI / flow usage | Real success verified | Deployed status / notes |
|---|---:|---:|---:|---:|---|
| `get_user_friends` | Probe only | No | Friends shell dùng search/user/block fallback | No | `POST /it4788/get_user_friends` trả 404 |
| `get_list_friends` | Probe only | No | Friends shell dùng search/user/block fallback | No | `POST /it4788/get_list_friends` trả 404 |
| `get_friends` | Probe only | No | Friends shell dùng search/user/block fallback | No | `POST /it4788/get_friends` trả 404 |
| `set_request_friend`, `request_friend`, `send_friend_request` | Probe candidate | No | Không expose | No | Bỏ qua trừ khi `PROBE_FRIEND_MUTATIONS=1` |
| `accept_friend`, `accept_friend_request`, `reject_friend`, `reject_friend_request`, `delete_friend`, `unfriend` | Probe candidate | No | Không expose | No | Bỏ qua trừ khi `PROBE_FRIEND_MUTATIONS=1` |

Phạm vi Friends server-backed hiện tại cho UI team: `search`, `get_user_info`, `get_list_blocks`, `set_block`. Mock mode có friend/user rows để dựng UI, nhưng backend mode chưa claim friend API thật cho tới khi backend xác nhận endpoint.
