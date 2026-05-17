# Backend Contract Probe Report

Probe date: 2026-05-14 local time

Probe command:

```bash
docker compose run --rm expo sh -lc 'PROBE_COMPACT=1 npm run backend:probe'
```

Backend root tested:

```text
https://group1.it4788.sukkaito.id.vn
```

The probe intentionally ran with `PROBE_MUTATION` disabled. Mutating endpoints were called with invalid tokens or validation-safe payloads to identify routes, transports, and auth behavior without changing production data.

Latest compact HTTPS summary generated at `2026-05-14T17:13:54.030Z`.

HTTP fallback was also probed with `API_BASE_URL=http://group1.it4788.sukkaito.id.vn/it4788`; it still reaches the API, but HTTP redirects to HTTPS and multipart probes are less reliable on fallback.

## Summary

- The deployed API prefix is `/it4788`; `/login` without the prefix returns 404.
- HTTPS is now the frontend default. HTTP remains documented as fallback.
- `/it4788/login` is reachable and requires `devtoken`; the local demo account returns `9995 User is not validated`.
- The unauthenticated probe does not embed real credentials. Separate existing-account E2E runs verified real HV/GV login and authenticated reads where the server returned data or clean empty states.
- CORS preflight returned `204` with `Access-Control-Allow-Origin: *` on selected endpoints.
- The probe covers all 40 IT4788 APIs.
- `/it4788/like` and `/it4788/delete_post` returned 404 on the deployed server.
- `check_new_item` rejects a `token` field in deployed runtime even though the app keeps the spec-shaped call first.
- `set_request_course` reaches token validation only after both `course_id` and `user_id` are present.
- Existing-account runtime shows several spec/runtime payload splits: `check_new_version` wants `lastUpdate`, `get_user_info` rejects `user_id`, `get_notification` rejects `last_update`, and `check_new_item` rejects `token`.

## 40-API Probe Results

| API | Selected transport | Status | Code | Message | Auth finding |
|---|---|---:|---|---|---|
| `login` | JSON | 200 | `9995` | `User is not validated` | Route works; demo account not valid |
| `logout` | JSON | 200 | `9998` | `Token is invalid` | Token required |
| `signup` | JSON | 400 | `1004` | `Số điện thoại phải đủ 10 số và bắt đầu bằng 0` | Route validates phone; mutation-safe invalid phone used |
| `get_verify_code` | JSON | 400 | `1004` | `Số điện thoại phải đủ 10 số và bắt đầu bằng 0` | Route validates phone; mutation-safe invalid phone used |
| `check_verify_code` | JSON | 400 | `1004` | `property code_verify should not exist` | Runtime field contract unclear without valid OTP |
| `change_info_after_signup` | JSON | 400 | `1004` | `property user_name should not exist` | Deployed auth-completion shape differs from `set_user_info` spec |
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
| `set_request_course` | JSON | 200 | `9998` | `Token is invalid` | Requires `course_id` and deployed also asks for `user_id` |
| `get_push_settings` | JSON | 401 | `9998` | `Token is invalid` | Token required |
| `set_push_settings` | JSON | 401 | `9998` | `Token is invalid` | Token required |
| `change_password` | JSON | 401 | `9998` | `Token is invalid` | Token required |
| `check_new_version` | JSON | 401 | `9998` | `Token is invalid` | Token required on deployed backend |
| `set_devtoken` | JSON | 401 | `9998` | `Token is invalid` | Token required |
| `get_conversation` | JSON | 401 | `9998` | `Token is invalid` | Token required |
| `delete_message` | JSON | 401 | `9998` | `Token is invalid` | Token required |
| `get_list_conversation` | JSON | 401 | `9998` | `Token is invalid` | Token required |
| `delete_conversation` | JSON | 401 | `9998` | `Token is invalid` | Token required |
| `check_new_item` | JSON | 400 | `1004` | `property token should not exist` | Deployed runtime rejects token despite spec-authenticated usage |
| `get_notification` | JSON | 401 | `9998` | `Token is invalid` | Token required |
| `set_read_message` | JSON | 401 | `9998` | `Token is invalid` | Token required |
| `set_read_notification` | JSON | 401 | `9998` | `Token is invalid` | Token required |

## Transport Findings

- `login`: JSON and form-urlencoded reach the route when `devtoken` is present. Multipart is not suitable.
- `get_list_posts`: form-urlencoded string params are most tolerant.
- `add_post` and `edit_post`: multipart reaches token validation; JSON/form return backend exceptions for `add_post`.
- HTTP fallback redirects to HTTPS and returned `Multipart: Unexpected end of form` for multipart probe bodies; use HTTPS for upload testing.
- `set_comment`: form-urlencoded with `index`/`count` reaches token validation.
- `check_new_item`: spec-shaped token payload is rejected by deployed runtime; repository contains a documented compatibility retry without token.
- `set_devtoken`: existing-account mutation verification passes when `devtype` is numeric (`"1"`).
- Most authenticated reads accept JSON. Existing-account testing verified login, saved search list, blocks, push settings, conversations list, logout, and several deployed-compatibility retries.

## Existing-Account Verification Addendum

Credentials are not stored in this repository. With team-provided HV/GV credentials supplied via environment variables:

- HV and GV login both returned HTTP 200, backend code `1000`, and a token.
- `get_list_posts`, `search`, and `profile search` returned `9994 No data`; the frontend treats this as a valid empty state.
- `get_list_courses_of_student` returned `9994 No data` for GV but `1001 Can not connect to DB` for HV in the final HTTPS run.
- `get_saved_search`, `get_list_blocks`, `get_push_settings`, `get_list_conversation`, compatibility `get_user_info`, compatibility `get_notification`, compatibility `check_new_version`, compatibility `check_new_item`, and `logout` returned backend code `1000`.
- No real post, course, exercise, notification, or conversation object id was returned, so object-specific calls remain frontend-complete but not real-object verified.

## Integration Decision

The frontend default is `EXPO_PUBLIC_DATA_SOURCE=server`. Local/demo mode is still available but is no longer the product default. Runtime deviations are isolated in repository payload choices and tracked in [BACKEND_MISMATCHES.md](BACKEND_MISMATCHES.md).
