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

The probe intentionally ran with `PROBE_MUTATION` disabled. Mutating endpoints such as `like`, `set_comment`, and `add_post` were called with an invalid token or non-persistent minimal payloads to identify route/transport/auth behavior without changing production data.

## Summary

- The deployed API prefix is `/it4788`.
- `/login` without `/it4788` returns 404.
- Login accepts `POST /it4788/login` with JSON or form body containing `phonenumber`, `password`, and `devtoken`.
- The provided demo account `0900000001 / 123456` is not a validated backend account. The backend returns code `9995`.
- No real backend token was discovered, so authenticated feed/post/comment/notification behavior could only be verified up to token-required responses.
- CORS preflight for selected endpoints returned `204` and `Access-Control-Allow-Origin: *`.

## Endpoint Results

| Endpoint | Selected URL | Transport | Minimal body | Status | JSON | Code | Message | Auth/token finding |
|---|---|---:|---|---:|---|---|---|---|
| login | `/it4788/login` | JSON | `phonenumber`, `password`, `devtoken` | 200 | yes | `9995` | `User is not validated` | Route works; test account is not backend-valid |
| login root | `/login` | JSON/form/multipart | same login body | 404 | yes | `9999` | `Cannot POST /login` | Root path is wrong |
| get_list_posts | `/it4788/get_list_posts` | form-urlencoded | `token`, `index`, `count`, `last_id`, `category_id` | 200 | yes | `9994` | `No data` | Empty token did not return token error; no real feed verified |
| get_post | `/it4788/get_post` | JSON | `token`, `id` | 400 | yes | `1004` | `token should not be empty` | Token required |
| like | `/it4788/like` | JSON/form/multipart | invalid `token`, `id` | 404 | yes | `9999` | `Cannot POST /it4788/like` | Deployed route missing or docs mismatch |
| get_comment | `/it4788/get_comment` | JSON | `token`, `id`, `index`, `count` | 400 | yes | `1004` | `token should not be empty` | Token required |
| set_comment | `/it4788/set_comment` | JSON | invalid `token`, `id`, `comment` | 400 | yes | `1004` | `index should not be empty` | Requires extra paging/index fields; token behavior not fully verified |
| add_post | `/it4788/add_post` | multipart | invalid `token`, `described`, `course_id`, `exercise_id`, `device_slave` | 200 | yes | `9998` | `Token is invalid` | Multipart route exists; token required |
| search | `/it4788/search` | JSON | `token`, `keyword`, `index`, `count` | 400 | yes | `1004` | `token should not be empty` | Token required |
| get_list_courses_of_student | `/it4788/get_list_courses_of_student` | JSON | `token`, `index`, `count` | 400 | yes | `1004` | `token should not be empty` | Token required |
| get_notification | `/it4788/get_notification` | JSON | `token`, `index`, `count` | 401 | yes | `9998` | `Token is invalid` | Token required |
| get_user_info | `/it4788/get_user_info` | JSON | `token`, `user_id` | 401 | yes | `9998` | `Token is invalid` | Token required |

## Transport Findings

- `login`: JSON and form-urlencoded both reached the route when using `devtoken`. Multipart produced phone validation errors and should not be used for login.
- `get_list_posts`: form-urlencoded with numeric values serialized as strings was the most tolerant transport. JSON with numeric `index` returned `index must be a string`.
- `add_post`: multipart is required. JSON and form-urlencoded returned `500 Exception error` once `device_slave` was supplied.
- Most authenticated read endpoints accept JSON but could not be fully verified without a valid token.

## CORS Findings

For selected endpoints, OPTIONS returned:

```text
Status: 204
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE
```

No CORS blocker was observed from the Node/Docker probe. Browser behavior should still be checked with a real server token because authenticated requests may expose additional headers or failures.

## Integration Decision

The frontend now uses a server-first repository layer where a real server session exists. Because no valid backend credentials/token were available, tomorrow's demo remains safe through `auto` mode and explicit local demo shortcuts.
