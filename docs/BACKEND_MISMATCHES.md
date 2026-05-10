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
| Verification code field | Spec names `check_verify_code` | Deployed probe rejected `code`, `verify_code`, and `code_verify` as extra properties with invalid phone payloads | Frontend currently uses `code_verify` as a documented compatibility guess; needs valid signup probe |
| check_new_item auth | Authenticated freshness check expected | Deployed route returned `1000 OK` without token when sent `last_id` and `category_id` | Repository omits token for this endpoint as an isolated deployed compatibility workaround |
| set_request_course payload | Course request expected with course metadata | Deployed probe alternated between requiring `user_id` and `course_id` depending payload | Repository sends both fields; needs valid token/account verification |

## Unverified Due To Missing Valid Token

- Successful backend login response shape and token field.
- Real signup/verify/profile-completion flow for a fresh HV/GV.
- Real server feed shape from `get_list_posts`.
- Real post detail shape from `get_post`, including `time_series_poses`.
- Successful comment creation shape from `set_comment`.
- Successful multipart `add_post` response shape and scoring/result payload.
- Search, courses, notifications, and user-info success payloads.
- Blocks, settings, conversations, read-state, enrollment approval, and saved-search success payloads.

## Implementation Decision

The app now defaults to `EXPO_PUBLIC_DATA_SOURCE=server`. In this mode, server repositories do not silently fake success. `auto` and `local` remain available for development and emergency fallback, and local demo shortcuts are visibly separate from backend login.
