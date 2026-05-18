# IT4788 Postman Assets

Import `IT4788.postman_collection.json` và `IT4788.local.postman_environment.json` vào Postman.

## Setup

1. Chọn environment `IT4788 Local / Shared Server`.
2. Giữ `baseUrl` mặc định là HTTPS: `{{baseUrlHttps}}`.
3. Nếu cần test HTTP fallback, đổi `baseUrl` thành `{{baseUrlHttp}}`. HTTP hiện redirect sang HTTPS.
4. Tự điền `hvPhone`, `gvPhone`, `password` trong Postman local. Không export credential thật ngược lại repo.
5. `apiType` chỉ phản ánh frontend development mode; Postman request vẫn gọi `baseUrl` bạn chọn.

## Login và token

- Chạy `Auth / HV Login` để lưu `hvToken` và `currentToken`.
- Chạy `Auth / GV Login` để lưu `gvToken` và `currentToken`.
- Với test theo role, copy token cần dùng vào `currentToken` nếu cần.

## Test upload

- Dùng một request `Feed / Posts / Add Post Multipart - ...`.
- Chọn 2 file local cho multipart file fields trong Postman. Collection giữ contract frontend hiện tại `video1`/`video2`, nhưng deployed backend vẫn reject các field name đã thử và cần backend team xác nhận.
- Backend team nói `courseId` bằng teacher/GV id, nên có thể copy `teacherId` vào `courseId`.
- Backend team nói không có exercise entity riêng. Giữ `noExerciseEntity=true` cho cách hiểu deployed hiện tại. `exerciseId` chỉ optional khi test strict spec path cũ.
- Dùng `exercisePostId` khi muốn probe giả thuyết teacher post là exercise-like object.
- Không dùng `mock://` placeholders với server thật.

## Known backend mismatches

- `/like` trả 404 trong deployed probes.
- `/delete_post` trả 404 trong deployed probes.
- Friend/user-social candidates `get_user_friends`, `get_list_friends`, `get_friends` trả 404 trong deployed probes.
- `check_new_item` reject `token`; frontend gửi spec payload trước rồi retry không token.
- `get_user_info` reject `user_id`; frontend retry không có field này.
- `get_notification` reject `last_update`; frontend retry không có field này.
- `check_new_version` reject `last_update`; frontend retry với `lastUpdate`.
- `set_devtoken` cần numeric `devtype`, thường là `1`.

## Seed data cần có

Nhiều flow cần ID thật từ backend: `postId`, `teacherId`, `courseId`, `exercisePostId`, `notificationId`, `conversationId`, `messageId`. Theo team, `courseId` có thể là GV id. `exerciseId` hiện chỉ cần khi probe strict spec payload cũ. Shared accounts có thể trả empty feed/course data; đó là data blocker, không phải lỗi Postman.

## No-exercise upload probes

Collection có các variant `add_post` riêng:

- omit `exercise_id`
- send `exercise_id=""`
- send `exercise_id={{courseId}}`
- send `exercise_id={{exercisePostId}}`
- send explicit `exercise_id={{exerciseId}}`

Dùng HTTPS, set `courseId={{teacherId}}`, chọn 2 local files cho file fields trước khi gửi. Theo run mới nhất, deployed backend reject mọi field name 2 file bằng `Unexpected field`, và metadata-only HV control vẫn yêu cầu `exercise_id`. Coi đây là backend mismatch cho tới khi server team xác nhận contract multipart thật.

## Friends / User Social

Collection có folder `Friends / User Social` cho thảo luận API từ slide mới:

- candidate read probes: `get_user_friends`, `get_list_friends`, `get_friends`
- fallback hiện có: search user qua `search`, get user info qua `get_user_info`, block/unblock qua `set_block`
- mutation candidates chỉ mô tả, không nên chạy nếu backend chưa cung cấp route chính xác và test data an toàn

Probe mới nhất chưa xác nhận route friend nào trên deployed backend. UI team có thể build Friends tab bằng mock data và repository search/user/block hiện có trong lúc chờ backend.
