# Backend Mismatches And Unresolved Contract Notes

Status date: 2026-05-10

These notes come from the deployed backend probe against `http://group1.it4788.sukkaito.id.vn`.

## Confirmed Mismatches

| Area | Expected or prior assumption | Deployed behavior | Frontend handling |
|---|---|---|---|
| API base path | `/login` might work | `/login` returns 404; `/it4788/login` is active | Default `EXPO_PUBLIC_API_BASE_URL` remains `/it4788` |
| Login payload | `phonenumber` and `password` only | Login also requires `devtoken`; `device_token`, `deviceToken`, `uuid`, and similar fields are rejected | Server login sends `devtoken` |
| Demo accounts | Local demo credentials might validate server login | `0900000001 / 123456` returns `9995 User is not validated` | Demo buttons are explicitly local and no longer imply backend success |
| Like endpoint | `/it4788/like` listed as expected endpoint | `POST /it4788/like` returns 404 | Repository calls it for server posts but does not fake success if it fails |
| Delete endpoint | `/it4788/delete_post` listed as expected endpoint | `POST /it4788/delete_post` returns 404 | Wrapper/repository remain implemented to spec; server mode surfaces safe error |
| Feed params | JSON numeric `index`/`count` assumed safe | JSON with numeric `index` returns `index must be a string`; form-urlencoded works better | `get_list_posts` uses form-urlencoded string values |
| add_post transport | Could be JSON or multipart | JSON/form return `500 Exception error`; multipart reaches token validation | `add_post` uses multipart only |
| add_post payload | Course/exercise/video fields only | `device_slave` is required before token validation | Frontend sends `device_slave` |
| set_comment payload | `token`, `id`, `comment` likely enough | Deployed route also asks for `index` | Frontend includes `index` and `count` in best-effort calls |
| API availability | All 40 APIs are expected by the spec | Only a subset has been route-observed so far without a valid token | Probe script now covers all 40 and records route/status/transport |
| Verification code field | Spec names `check_verify_code` | Deployed probe rejected common code fields with invalid phone payloads | Frontend and E2E harness try common field names; needs valid signup/OTP probe |
| check_new_item auth | Authenticated freshness check expected with session token | Deployed runtime rejects `token` with `property token should not exist`; earlier no-token probe returned `1000 OK` | Repository sends `token` first per spec, then retries without token as an isolated compatibility workaround |
| change_info_after_signup payload | Profile completion should be reconciled with auth slides; `set_user_info` uses `user_name/avatar/cover_image` | Deployed `change_info_after_signup` rejects `user_name` before token validation | Auth adapter tries spec-style fields first, then deployed legacy `username/height/avatar` shape |
| set_request_course payload | Course request expected with course metadata | Deployed probe reaches token validation only with both `course_id` and `user_id` | Repository sends `course_id` and actual session `user_id`; no longer sends course id as user id |
| get_list_courses_of_student params | Slides specify `token` + `user_id` | Runtime existing-account tests returned clean empty state only when compatibility pagination fields were also included | Repository sends `user_id` plus string `index`/`count` compatibility fields |
| search payload | General search and profile search are spec flows | Runtime requires/accepts `user_id` in existing-account checks | Repository includes the current session user id for normal and profile search |
| check_new_version field | Slides use snake-case freshness field style (`last_update`) | Runtime rejects `last_update` and accepts `lastUpdate` | Repository tries spec payload first, then isolated camelCase compatibility retry |
| get_user_info field | Slides specify `token` + `user_id` | Runtime rejects `user_id` with `property user_id should not exist` | Repository tries spec payload first, then compatibility retry without `user_id` |
| get_notification field | Slides include `last_update` for notification cache behavior | Runtime rejects `last_update` and accepts request without it | Repository tries spec payload first, then compatibility retry without `last_update` |
| set_devtoken payload | Device token registration is required in lifecycle | Runtime requires numeric `devtype`; non-numeric values are rejected | Repository and probe send `devtype: "1"` |

## Real Existing-Account Runtime Findings

The team-provided HV/GV accounts were used through environment variables only. Both accounts successfully logged in with backend code `1000` and produced real tokens.

Authenticated read/write findings:

- `get_list_posts`, `search`, and `get_list_courses_of_student` returned `9994 No data`, so real object detail/pagination flows could not be exercised.
- `get_saved_search`, `get_list_blocks`, `get_push_settings`, `get_list_conversation`, deployed-compatible `get_user_info`, deployed-compatible `get_notification`, deployed-compatible `check_new_item`, and deployed-compatible `check_new_version` returned backend code `1000`.
- `set_devtoken` returned backend code `1000` after adding numeric `devtype`.
- HV receives `1009 Not access` for teacher-only `get_list_students` and `get_requested_enrollment`; GV receives empty data for those flows.
- Real upload remains blocked by missing real `course_id` and `exercise_id` from the existing-account server data, not by a frontend placeholder path.

## Still Unverified Or Blocked

- Real signup/verify/profile-completion flow for a fresh HV/GV.
- Real server feed shape from `get_list_posts`.
- Real post detail shape from `get_post`, including `time_series_poses`.
- Successful comment creation shape from `set_comment`.
- Successful multipart `add_post` response shape and scoring/result payload.
- Search, courses, notifications, and user-info success payloads.
- Blocks, settings, conversations, read-state, enrollment approval, and saved-search success payloads.

## Implementation Decision

The app now defaults to `EXPO_PUBLIC_DATA_SOURCE=server`. In this mode, server repositories do not silently fake success. `auto` and `local` remain available for development and emergency fallback, and local demo shortcuts are visibly separate from backend login.
