# Backend Contract Probe Report

Probe date: 2026-05-18 local time

Probe command:

```bash
docker compose run --rm expo sh -lc 'PROBE_COMPACT=1 npm run backend:probe'
```

Backend root tested:

```text
https://group1.it4788.sukkaito.id.vn
```

The probe intentionally ran with `PROBE_MUTATION` disabled. Mutating endpoints were called with invalid tokens or validation-safe payloads to identify routes, transports, and auth behavior without changing production data.

Latest compact HTTPS summary generated at `2026-05-18T01:51:40.924Z`.

HTTP fallback was also probed at `2026-05-17T09:13:54.781Z` with `API_BASE_URL=http://group1.it4788.sukkaito.id.vn/it4788`; it still reaches the API, but HTTP redirects to HTTPS and multipart probes are less reliable on fallback.

## Summary

- The deployed API prefix is `/it4788`; `/login` without the prefix returns 404.
- HTTPS is now the frontend default. HTTP remains documented as fallback.
- `/it4788/login` is reachable and requires `devtoken`; the local demo account returns `9995 User is not validated`.
- The unauthenticated probe does not embed real credentials. Separate existing-account E2E runs verified real HV/GV login and authenticated reads where the server returned data or clean empty states.
- CORS preflight returned `204` with `Access-Control-Allow-Origin: *` on selected endpoints.
- The probe covers all 40 IT4788 APIs.
- Newer slide/user-social candidates were also probed: `get_user_friends`, `get_list_friends`, and `get_friends` currently return deployed 404; friend mutation candidates are documented but not executed unless `PROBE_FRIEND_MUTATIONS=1`.
- `/it4788/like` and `/it4788/delete_post` returned 404 on the deployed server.
- `check_new_item` rejects a `token` field in deployed runtime even though the app keeps the spec-shaped call first.
- `set_request_course` reaches token validation only after both `course_id` and `user_id` are present.
- Backend-team clarification now says `course_id` is the teacher/GV id and there is no separate backend exercise entity.
- Real-account no-exercise E2E runs show a deployed mismatch: HV metadata-only `add_post` still returns `exercise_id and course_id are required for students`.
- Real two-file `add_post` attempts are currently blocked earlier by deployed multipart validation: every tested field set (`video1/video2`, `videos`, `video`, `image`, `images`, `image1/image2`, `file1/file2`, `files`, `file`) returned `Unexpected field`.
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
- `add_post` and `edit_post`: multipart reaches token validation without files; JSON/form return backend exceptions for `add_post`. With real files, deployed `add_post` currently rejects all tested field names as `Unexpected field`.
- HTTP fallback redirects to HTTPS and returned `Multipart: Unexpected end of form` for multipart probe bodies; use HTTPS for upload testing.
- `set_comment`: form-urlencoded with `index`/`count` reaches token validation.
- `check_new_item`: spec-shaped token payload is rejected by deployed runtime; repository contains a documented compatibility retry without token.
- `set_devtoken`: existing-account mutation verification passes when `devtype` is numeric (`"1"`).
- Most authenticated reads accept JSON. Existing-account testing verified login, saved search list, blocks, push settings, conversations list, logout, and several deployed-compatibility retries.

## Existing-Account Verification Addendum

Credentials are not stored in this repository. With team-provided HV/GV credentials supplied via environment variables:

- HV and GV login both returned HTTP 200, backend code `1000`, and a token.
- `get_list_posts`, `search`, and `profile search` returned `9994 No data`; the frontend treats this as a valid empty state.
- `get_list_courses_of_student` returned `9994 No data` for both HV and GV in the latest HTTPS run. A prior HV run returned `1001 Can not connect to DB`, so the endpoint remains an intermittent deployed risk.
- `set_request_course` returned `1001 Can not connect to DB` in the latest mutation-enabled run even with `course_id = GV id`.
- No upload variant succeeded. The route rejected real two-file payloads before `exercise_id` validation, and the metadata-only HV control still required `exercise_id`.
- `get_saved_search`, `get_list_blocks`, `get_push_settings`, `get_list_conversation`, compatibility `get_user_info`, compatibility `get_notification`, compatibility `check_new_version`, compatibility `check_new_item`, and `logout` returned backend code `1000`.
- No real post, course, exercise, notification, or conversation object id was returned, so object-specific calls remain frontend-complete but not real-object verified.

## Friend / User-Social Probe Addendum

Newer slide context appears to mention friend/user-social behavior beyond the older 40-API list, so the probe now includes a guarded friend endpoint group. Real account values are supplied only through environment variables and are never written to tracked files.

Latest friend probe ran with multiple team-provided accounts and `PROBE_FRIEND_MUTATIONS` disabled. All supplied accounts logged in successfully, which allowed token-bearing route checks. Results:

| Candidate endpoint | Method / transport | Result | Notes |
|---|---|---|---|
| `get_user_friends` | POST form-urlencoded, JSON fallback | 404 | `Cannot POST /it4788/get_user_friends` |
| `get_list_friends` | POST form-urlencoded, JSON fallback | 404 | `Cannot POST /it4788/get_list_friends` |
| `get_friends` | POST form-urlencoded, JSON fallback | 404 | `Cannot POST /it4788/get_friends` |
| `set_request_friend` | POST form-urlencoded/JSON | Skipped | Mutation candidate; run only with `PROBE_FRIEND_MUTATIONS=1` |
| `request_friend` | POST form-urlencoded/JSON | Skipped | Mutation candidate; run only with `PROBE_FRIEND_MUTATIONS=1` |
| `send_friend_request` | POST form-urlencoded/JSON | Skipped | Mutation candidate; run only with `PROBE_FRIEND_MUTATIONS=1` |
| `accept_friend`, `accept_friend_request` | POST form-urlencoded/JSON | Skipped | Mutation candidates; run only with `PROBE_FRIEND_MUTATIONS=1` |
| `reject_friend`, `reject_friend_request` | POST form-urlencoded/JSON | Skipped | Mutation candidates; run only with `PROBE_FRIEND_MUTATIONS=1` |
| `delete_friend`, `unfriend` | POST form-urlencoded/JSON | Skipped | Mutation candidates; run only with `PROBE_FRIEND_MUTATIONS=1` |

Decision for the current frontend/API handoff: there is no confirmed deployed friend API yet. Until backend confirms an exact route and payload, the Friends section should use the existing server-backed scope: `search`, `get_user_info`, `get_list_blocks`, and `set_block`. Mock mode can still provide friend rows so UI teammates can design the Friends screen without backend dependency.

## Integration Decision

The frontend default is `EXPO_PUBLIC_API_TYPE=backend`. `EXPO_PUBLIC_API_TYPE=mock` is the explicit no-backend path for UI work; older `EXPO_PUBLIC_DATA_SOURCE` values remain compatibility aliases. Runtime deviations are isolated in repository payload choices and tracked in [BACKEND_MISMATCHES.md](BACKEND_MISMATCHES.md).
