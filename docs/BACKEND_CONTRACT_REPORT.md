# Báo Cáo Probe Contract Backend

Ngày probe: 2026-05-18 local time

Lệnh probe:

```bash
docker compose run --rm expo sh -lc 'PROBE_COMPACT=1 npm run backend:probe'
```

Backend root đã test:

```text
https://group1.it4788.sukkaito.id.vn
```

Probe chủ động tắt `PROBE_MUTATION`. Endpoint mutation được gọi bằng token không hợp lệ hoặc payload an toàn để nhận diện route/transport/auth mà không thay đổi production data.

Latest compact HTTPS summary: `2026-05-18T01:51:40.924Z`.

HTTP fallback cũng đã probe với `API_BASE_URL=http://group1.it4788.sukkaito.id.vn/it4788`; HTTP vẫn tới được API nhưng redirect sang HTTPS và multipart probe kém ổn định hơn.

## Tóm tắt

- API prefix deployed là `/it4788`; `/login` không có prefix trả 404.
- HTTPS là mặc định frontend. HTTP chỉ là fallback.
- `/it4788/login` reachable và cần `devtoken`; local demo account trả `9995 User is not validated`.
- Probe không ghi credential thật vào repo. E2E riêng với account thật đã xác minh HV/GV login và một số authenticated reads.
- CORS preflight trả `204` với `Access-Control-Allow-Origin: *` trên endpoint được kiểm tra.
- Probe bao phủ đủ 40 API IT4788.
- Candidate friend/user-social từ slide mới cũng đã probe: `get_user_friends`, `get_list_friends`, `get_friends` hiện 404; mutation candidates chỉ chạy nếu bật `PROBE_FRIEND_MUTATIONS=1`.
- `/it4788/like` và `/it4788/delete_post` trả 404 trên deployed server.
- `check_new_item` reject field `token` trong runtime deployed dù app vẫn gọi payload theo spec trước.
- `set_request_course` chỉ tới token validation khi có cả `course_id` và `user_id`.
- Backend team nói `course_id` là teacher/GV id và không có backend exercise entity riêng.
- E2E no-exercise với real account cho thấy mismatch: HV metadata-only `add_post` vẫn trả `exercise_id and course_id are required for students`.
- Upload thật 2 file hiện bị chặn bởi multipart validation: tất cả field set đã thử (`video1/video2`, `videos`, `video`, `image`, `images`, `image1/image2`, `file1/file2`, `files`, `file`) đều trả `Unexpected field`.
- Runtime existing-account còn split spec/runtime: `check_new_version` cần `lastUpdate`, `get_user_info` reject `user_id`, `get_notification` reject `last_update`, `check_new_item` reject `token`.

## Kết quả probe 40 API

| API | Transport chọn | Status | Code | Message | Auth finding |
|---|---|---:|---|---|---|
| `login` | JSON | 200 | `9995` | `User is not validated` | Route hoạt động; demo account không valid |
| `logout` | JSON | 200 | `9998` | `Token is invalid` | Cần token |
| `signup` | JSON | 400 | `1004` | `Số điện thoại phải đủ 10 số và bắt đầu bằng 0` | Route validate phone; dùng phone invalid an toàn |
| `get_verify_code` | JSON | 400 | `1004` | `Số điện thoại phải đủ 10 số và bắt đầu bằng 0` | Route validate phone; dùng phone invalid an toàn |
| `check_verify_code` | JSON | 400 | `1004` | `property code_verify should not exist` | Chưa rõ contract field nếu không có valid OTP |
| `change_info_after_signup` | JSON | 400 | `1004` | `property user_name should not exist` | Shape runtime khác `set_user_info` spec |
| `get_list_posts` | form-urlencoded | 200 | `9994` | `No data` | Empty-token không phải auth error rõ ràng |
| `get_post` | JSON | 400 | `1004` | `token should not be empty` | Cần token |
| `add_post` | multipart | 200 | `9998` | `Token is invalid` | Route multipart tồn tại; cần token |
| `edit_post` | multipart | 200 | `9998` | `Token is invalid` | Route multipart tồn tại; cần token |
| `delete_post` | JSON | 404 | `9999` | `Cannot POST /it4788/delete_post` | Route deployed thiếu |
| `get_comment` | JSON | 400 | `1004` | `token should not be empty` | Cần token |
| `set_comment` | form-urlencoded | 200 | `9998` | `Token is invalid` | Cần token; form với index/count tới token validation |
| `report_post` | JSON | 200 | `9998` | `Token is invalid` | Cần token |
| `like` | JSON | 404 | `9999` | `Cannot POST /it4788/like` | Route deployed thiếu |
| `search` | JSON | 400 | `1004` | `token should not be empty` | Cần token |
| `get_saved_search` | JSON | 400 | `1004` | `token should not be empty` | Cần token |
| `del_saved_search` | JSON | 400 | `1004` | `property id should not exist` | Runtime field contract chưa rõ |
| `get_list_students` | JSON | 400 | `1004` | `token should not be empty` | Cần token |
| `get_user_info` | JSON | 401 | `9998` | `Token is invalid` | Cần token |
| `set_user_info` | JSON | 401 | `9998` | `Token is invalid` | Cần token |
| `get_list_courses_of_student` | JSON | 400 | `1004` | `token should not be empty` | Cần token |
| `get_list_blocks` | JSON | 401 | `9998` | `Token is invalid` | Cần token |
| `set_block` | JSON | 401 | `9998` | `Token is invalid` | Cần token |
| `set_approve_enrollment` | JSON | 200 | `9998` | `Token is invalid` | Cần token |
| `get_requested_enrollment` | JSON | 400 | `1004` | `token should not be empty` | Cần token |
| `set_request_course` | JSON | 200 | `9998` | `Token is invalid` | Cần `course_id`, deployed cũng hỏi `user_id` |
| `get_push_settings` | JSON | 401 | `9998` | `Token is invalid` | Cần token |
| `set_push_settings` | JSON | 401 | `9998` | `Token is invalid` | Cần token |
| `change_password` | JSON | 401 | `9998` | `Token is invalid` | Cần token |
| `check_new_version` | JSON | 401 | `9998` | `Token is invalid` | Deployed cần token |
| `set_devtoken` | JSON | 401 | `9998` | `Token is invalid` | Cần token |
| `get_conversation` | JSON | 401 | `9998` | `Token is invalid` | Cần token |
| `delete_message` | JSON | 401 | `9998` | `Token is invalid` | Cần token |
| `get_list_conversation` | JSON | 401 | `9998` | `Token is invalid` | Cần token |
| `delete_conversation` | JSON | 401 | `9998` | `Token is invalid` | Cần token |
| `check_new_item` | JSON | 400 | `1004` | `property token should not exist` | Runtime reject token dù spec là authenticated usage |
| `get_notification` | JSON | 401 | `9998` | `Token is invalid` | Cần token |
| `set_read_message` | JSON | 401 | `9998` | `Token is invalid` | Cần token |
| `set_read_notification` | JSON | 401 | `9998` | `Token is invalid` | Cần token |

## Findings về transport

- `login`: JSON và form-urlencoded tới route khi có `devtoken`; multipart không phù hợp.
- `get_list_posts`: form-urlencoded string params ổn nhất.
- `add_post` và `edit_post`: multipart tới token validation khi không có file; JSON/form gây exception cho `add_post`. Với file thật, deployed reject field name bằng `Unexpected field`.
- HTTP fallback redirect sang HTTPS và trả `Multipart: Unexpected end of form` cho multipart probe; dùng HTTPS cho upload.
- `set_comment`: form-urlencoded với `index`/`count` tới token validation.
- `check_new_item`: payload có token theo spec bị reject; repository có compatibility retry không token.
- `set_devtoken`: mutation existing-account pass khi `devtype` là numeric string (`"1"`).
- Hầu hết authenticated reads chấp nhận JSON. E2E existing-account xác minh login, saved search list, blocks, push settings, conversations list, logout và một số compatibility retries.

## Addendum xác minh existing-account

Credential không lưu trong repo. Với HV/GV credential truyền qua env vars:

- HV và GV login trả HTTP 200, backend code `1000`, có token.
- `get_list_posts`, `search`, profile search trả `9994 No data`; frontend coi là empty state hợp lệ.
- `get_list_courses_of_student` trả `9994 No data` cho cả HV/GV trong run HTTPS mới nhất. Một run HV trước đó trả `1001 Can not connect to DB`, nên endpoint vẫn là rủi ro deployed/data.
- `set_request_course` trả `1001 Can not connect to DB` trong run mutation-enabled mới nhất dù `course_id = GV id`.
- Không upload variant nào thành công. Route reject real two-file payload trước bước validate `exercise_id`, và metadata-only HV control vẫn yêu cầu `exercise_id`.
- `get_saved_search`, `get_list_blocks`, `get_push_settings`, `get_list_conversation`, compatibility `get_user_info`, compatibility `get_notification`, compatibility `check_new_version`, compatibility `check_new_item`, `logout` trả code `1000`.
- Không có object id thật cho post, course, exercise, notification, conversation nên object-specific calls vẫn frontend-complete nhưng chưa real-object verified.

## Addendum Friend / User-Social

Slide mới có vẻ nhắc tới friend/user-social ngoài danh sách 40 API cũ, nên probe có thêm group endpoint friend được guard. Account thật được truyền qua env vars và không ghi vào tracked files.

Latest friend probe chạy với nhiều account và `PROBE_FRIEND_MUTATIONS` tắt. Tất cả account cung cấp login thành công, đủ để kiểm tra route có token.

| Candidate endpoint | Method / transport | Result | Notes |
|---|---|---|---|
| `get_user_friends` | POST form-urlencoded, JSON fallback | 404 | `Cannot POST /it4788/get_user_friends` |
| `get_list_friends` | POST form-urlencoded, JSON fallback | 404 | `Cannot POST /it4788/get_list_friends` |
| `get_friends` | POST form-urlencoded, JSON fallback | 404 | `Cannot POST /it4788/get_friends` |
| `set_request_friend` | POST form-urlencoded/JSON | Skipped | Mutation candidate; chỉ chạy với `PROBE_FRIEND_MUTATIONS=1` |
| `request_friend` | POST form-urlencoded/JSON | Skipped | Mutation candidate; chỉ chạy với `PROBE_FRIEND_MUTATIONS=1` |
| `send_friend_request` | POST form-urlencoded/JSON | Skipped | Mutation candidate; chỉ chạy với `PROBE_FRIEND_MUTATIONS=1` |
| `accept_friend`, `accept_friend_request` | POST form-urlencoded/JSON | Skipped | Mutation candidates; chỉ chạy với `PROBE_FRIEND_MUTATIONS=1` |
| `reject_friend`, `reject_friend_request` | POST form-urlencoded/JSON | Skipped | Mutation candidates; chỉ chạy với `PROBE_FRIEND_MUTATIONS=1` |
| `delete_friend`, `unfriend` | POST form-urlencoded/JSON | Skipped | Mutation candidates; chỉ chạy với `PROBE_FRIEND_MUTATIONS=1` |

Quyết định handoff: chưa có deployed friend API được xác nhận. Cho tới khi backend xác nhận route/payload, Friends section nên dùng scope server-backed hiện có: `search`, `get_user_info`, `get_list_blocks`, `set_block`. Mock mode vẫn cung cấp friend rows để UI team dựng màn không phụ thuộc backend.

## Quyết định tích hợp

Frontend mặc định là `EXPO_PUBLIC_API_TYPE=backend`. `EXPO_PUBLIC_API_TYPE=mock` là đường local-only rõ ràng cho UI work. Các giá trị cũ `EXPO_PUBLIC_DATA_SOURCE` vẫn là compatibility alias. Runtime deviations được cô lập trong repository payload choices và theo dõi ở [BACKEND_MISMATCHES.md](BACKEND_MISMATCHES.md).
