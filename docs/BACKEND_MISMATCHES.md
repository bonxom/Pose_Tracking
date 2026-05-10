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
| Feed params | JSON numeric `index`/`count` assumed safe | JSON with numeric `index` returns `index must be a string`; form-urlencoded works better | `get_list_posts` uses form-urlencoded string values |
| add_post transport | Could be JSON or multipart | JSON/form return `500 Exception error`; multipart reaches token validation | `add_post` uses multipart only |
| add_post payload | Course/exercise/video fields only | `device_slave` is required before token validation | Frontend sends `device_slave` |
| set_comment payload | `token`, `id`, `comment` likely enough | Deployed route also asks for `index` | Frontend includes `index` and `count` in best-effort calls |

## Unverified Due To Missing Valid Token

- Successful backend login response shape and token field.
- Real server feed shape from `get_list_posts`.
- Real post detail shape from `get_post`, including `time_series_poses`.
- Successful comment creation shape from `set_comment`.
- Successful multipart `add_post` response shape and scoring/result payload.
- Search, courses, notifications, and user-info success payloads.

## Demo-Safety Decision

The app defaults to `EXPO_PUBLIC_DATA_SOURCE=auto`. In this mode, server repositories are used only after a real server session exists. If a backend call fails or returns an incompatible contract, the app falls back to the existing local demo data. `server` mode is available for integration testing and intentionally does not silently fake success.
