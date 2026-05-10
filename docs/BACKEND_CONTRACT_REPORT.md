# Backend Contract Probe Report

Probe date: 2026-05-10 local time

Probe command:

```bash
docker compose run --rm expo sh -lc 'PROBE_COMPACT=1 npm run backend:probe'
```

Backend root tested:

```text
http://group1.it4788.sukkaito.id.vn
```

The probe intentionally ran with `PROBE_MUTATION` disabled. Mutating endpoints were called with invalid tokens or validation-safe payloads to identify routes, transports, and auth behavior without changing production data.

Latest compact summary generated at `2026-05-10T08:37:05.661Z`.

## Summary

- The deployed API prefix is `/it4788`; `/login` without the prefix returns 404.
- `/it4788/login` is reachable and requires `devtoken`; the local demo account returns `9995 User is not validated`.
- No valid backend token was discovered, so authenticated success payloads remain unverified.
- CORS preflight returned `204` with `Access-Control-Allow-Origin: *` on selected endpoints.
- The probe now covers all 40 IT4788 APIs.
- `check_new_item` returned `1000 OK` with no token when called with `last_id` and `category_id`.
- `/it4788/like` and `/it4788/delete_post` returned 404 on the deployed server.

## 40-API Probe Results

| API | Selected transport | Status | Code | Message | Auth finding |
|---|---|---:|---|---|---|
| `login` | JSON | 200 | `9995` | `User is not validated` | Route works; demo account not valid |
| `logout` | JSON | 200 | `9998` | `Token is invalid` | Token required |
| `signup` | JSON | 400 | `1004` | `Số điện thoại phải đủ 10 số và bắt đầu bằng 0` | Route validates phone; mutation-safe invalid phone used |
| `get_verify_code` | JSON | 400 | `1004` | `Số điện thoại phải đủ 10 số và bắt đầu bằng 0` | Route validates phone; mutation-safe invalid phone used |
| `check_verify_code` | JSON | 400 | `1004` | `property code_verify should not exist` | Runtime field contract unclear |
| `change_info_after_signup` | JSON | 400 | `1004` | `Token không đúng định dạng (quá ngắn)` | Token required |
| `get_list_posts` | form-urlencoded | 200 | `9994` | `No data` | Empty-token behavior is not a clean auth error |
| `get_post` | JSON | 400 | `1004` | `token should not be empty` | Token required |
| `add_post` | multipart | 200 | `9998` | `Token is invalid` | Multipart route exists; token required |
| `edit_post` | multipart | 200 | `9998` | `Token is invalid` | Multipart route exists; token required |
| `delete_post` | JSON | 404 | `9999` | `Cannot POST /it4788/delete_post` | Deployed route missing |
| `get_comment` | JSON | 400 | `1004` | `token should not be empty` | Token required |
| `set_comment` | form-urlencoded | 200 | `9998` | `Token is invalid` | Requires token; form with index/count reaches token validation |
| `report_post` | JSON | 200 | `9998` | `Token is invalid` | Token required |
| `like` | JSON | 404 | `9999` | `Cannot POST /it4788/like` | Deployed route missing |
| `search` | JSON | 400 | `1004` | `token should not be empty` | Token required |
| `get_saved_search` | JSON | 400 | `1004` | `token should not be empty` | Token required |
| `del_saved_search` | JSON | 400 | `1004` | `property id should not exist` | Runtime field contract unclear |
| `get_list_students` | JSON | 400 | `1004` | `token should not be empty` | Token required |
| `get_user_info` | JSON | 401 | `9998` | `Token is invalid` | Token required |
| `set_user_info` | JSON | 401 | `9998` | `Token is invalid` | Token required |
| `get_list_courses_of_student` | JSON | 400 | `1004` | `token should not be empty` | Token required |
| `get_list_blocks` | JSON | 401 | `9998` | `Token is invalid` | Token required |
| `set_block` | JSON | 401 | `9998` | `Token is invalid` | Token required |
| `set_approve_enrollment` | JSON | 200 | `9998` | `Token is invalid` | Token required |
| `get_requested_enrollment` | JSON | 400 | `1004` | `token should not be empty` | Token required |
| `set_request_course` | JSON | 400 | `1004` | `course_id should not be empty` | Requires course id; valid format unknown |
| `get_push_settings` | JSON | 401 | `9998` | `Token is invalid` | Token required |
| `set_push_settings` | JSON | 401 | `9998` | `Token is invalid` | Token required |
| `change_password` | JSON | 401 | `9998` | `Token is invalid` | Token required |
| `check_new_version` | JSON | 401 | `9998` | `Token is invalid` | Token required on deployed backend |
| `set_devtoken` | JSON | 401 | `9998` | `Token is invalid` | Token required |
| `get_conversation` | JSON | 401 | `9998` | `Token is invalid` | Token required |
| `delete_message` | JSON | 401 | `9998` | `Token is invalid` | Token required |
| `get_list_conversation` | JSON | 401 | `9998` | `Token is invalid` | Token required |
| `delete_conversation` | JSON | 401 | `9998` | `Token is invalid` | Token required |
| `check_new_item` | JSON | 200 | `1000` | `OK` | Works without token in deployed probe |
| `get_notification` | JSON | 401 | `9998` | `Token is invalid` | Token required |
| `set_read_message` | JSON | 401 | `9998` | `Token is invalid` | Token required |
| `set_read_notification` | JSON | 401 | `9998` | `Token is invalid` | Token required |

## Transport Findings

- `login`: JSON and form-urlencoded reach the route when `devtoken` is present. Multipart is not suitable.
- `get_list_posts`: form-urlencoded string params are most tolerant.
- `add_post` and `edit_post`: multipart reaches token validation; JSON/form return backend exceptions for `add_post`.
- `set_comment`: form-urlencoded with `index`/`count` reaches token validation.
- Most authenticated reads accept JSON but were not success-verified without a valid token.

## Integration Decision

The frontend default is now `EXPO_PUBLIC_DATA_SOURCE=server`. Local/demo mode is still available but is no longer the product default. Runtime deviations are isolated in repository payload choices and tracked in [BACKEND_MISMATCHES.md](BACKEND_MISMATCHES.md).
