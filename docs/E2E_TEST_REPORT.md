# Báo Cáo E2E Server

Ngày cập nhật: 2026-05-18

E2E server chạy qua Docker và credential thật chỉ truyền bằng env vars. Không lưu credential trong repo.

## Lệnh chuẩn

```bash
docker compose run --rm expo sh -lc '
  E2E_USE_EXISTING_ACCOUNTS=1 \
  E2E_HV_PHONE=<hv-phone> \
  E2E_GV_PHONE=<gv-phone> \
  E2E_PASSWORD=<password> \
  npm run e2e:server
'
```

No-exercise / course id = GV id:

```bash
docker compose run --rm expo sh -lc '
  E2E_USE_EXISTING_ACCOUNTS=1 \
  E2E_USE_GV_ID_AS_COURSE_ID=1 \
  E2E_NO_EXERCISE_ENTITY=1 \
  E2E_RUN_MUTATIONS=1 \
  E2E_HV_PHONE=<hv-phone> \
  E2E_GV_PHONE=<gv-phone> \
  E2E_PASSWORD=<password> \
  E2E_VIDEO_LEFT=/app/video/cam1.mp4 \
  E2E_VIDEO_RIGHT=/app/video/cam2.mp4 \
  npm run e2e:server
'
```

## Kết quả đã xác minh

- HV login: success, backend code `1000`, có token.
- GV login: success, backend code `1000`, có token.
- Logout: success với HV token.
- `get_saved_search`: success code `1000`.
- `get_list_blocks`: success code `1000`.
- `get_push_settings`: success code `1000`.
- `get_list_conversation`: success code `1000`.
- `set_devtoken`: success code `1000` khi `devtype` numeric.
- Compatibility `get_user_info`: success code `1000` khi retry không `user_id`.
- Compatibility `get_notification`: success code `1000` khi retry không `last_update`.
- Compatibility `check_new_version`: success code `1000` khi dùng `lastUpdate`.
- Compatibility `check_new_item`: success code `1000` khi retry không `token`.

## Empty/data-blocked nhưng frontend xử lý được

- `get_list_posts`: `9994 No data` với shared accounts.
- `search`: `9994 No data` với shared accounts.
- `get_list_courses_of_student`: latest run trả `9994 No data`; từng có run HV trả `1001 Can not connect to DB`.
- `get_list_students`: GV empty, HV `1009 Not access` đúng role-gated expectation.
- `get_requested_enrollment`: GV empty.
- Không có `postId`, `notificationId`, `conversationId`, pending enrollment thật để test object-specific actions.

## Backend-blocked / mismatch

- `/like`: 404.
- `/delete_post`: 404.
- `check_new_item` reject `token` theo spec.
- `get_user_info` reject `user_id` theo spec.
- `get_notification` reject `last_update` theo spec.
- `check_new_version` reject `last_update`, accept `lastUpdate`.
- `set_request_course` latest mutation run trả `1001 Can not connect to DB` dù gửi `course_id = GV id`.
- Upload 2 video thật bị `Unexpected field` với mọi multipart field name đã thử.
- Backend team nói không có exercise entity nhưng deployed HV control vẫn yêu cầu `exercise_id`.
- Friend read candidates `get_user_friends`, `get_list_friends`, `get_friends` trả 404.

## Chưa xác minh do manual/physical constraints

- Signup mới + OTP thật.
- Verify code field contract với OTP thật.
- Complete profile sau signup thật.
- Native physical-device upload duration validation.
- Real scoring/pose result payload sau upload thành công.

## Kết luận E2E

Frontend API layer đã đủ để chạy server-backed flow và không fake success trong backend mode. Các phần còn lại chủ yếu bị chặn bởi dữ liệu backend, OTP/manual phone, hoặc mismatch deployed endpoint. Mock mode vẫn là backup demo đầy đủ khi backend không ổn định.
