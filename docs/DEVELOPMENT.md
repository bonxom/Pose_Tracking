# Development Workflow

This repository is a React Native / Expo Router frontend for the IT4788 marching/parade pose-training social app. The current product strategy is server-authoritative: normal app usage should call the deployed IT4788 backend. Local mode remains available only for development, emergency demos, and isolated fallback testing.

Backend source of truth:

```text
https://group1.it4788.sukkaito.id.vn/it4788
```

HTTP fallback:

```text
http://group1.it4788.sukkaito.id.vn/it4788
```

Override when needed:

```bash
EXPO_PUBLIC_API_BASE_URL=http://group1.it4788.sukkaito.id.vn/it4788 docker compose up
```

## Developer Local Demo Accounts

```text
Student HV: 0900000001 / 123456
Teacher GV: 0900000002 / 123456
```

Important: these demo shortcuts are explicitly local and do not prove backend integration. In normal `server` mode, developer fallback controls are visually separated from the real login form.

## Data Source Modes

Default:

```bash
EXPO_PUBLIC_DATA_SOURCE=server
```

Modes:

- `server`: default product mode. Use backend repositories and show safe errors if backend/token/contracts fail.
- `auto`: development fallback. Use server repositories when a real server session/token exists and fall back to local data if compatible backend calls fail.
- `local`: developer-only local fallback.

Optional config:

```bash
EXPO_PUBLIC_API_BASE_URL=https://group1.it4788.sukkaito.id.vn/it4788
EXPO_PUBLIC_API_TIMEOUT_MS=4500
EXPO_PUBLIC_API_DEBUG=1
```

API-owner note: use `API_BASE_URL=...` for Node probe/E2E scripts and `EXPO_PUBLIC_API_BASE_URL=...` for Expo runtime.

## Run With Docker

The host machine does not need Node or npm installed. Docker installs dependencies inside the image with `npm ci` because `package-lock.json` exists.

Build the image:

```bash
docker compose build
```

Start Expo Web:

```bash
docker compose up
```

Open the web demo:

```text
http://localhost:8081
```

The Docker web script is:

```bash
npm run web:docker
```

That resolves to:

```bash
WEB_HOST=0.0.0.0 expo start --web --lan --port 8081
```

Expo SDK 55 rejects `--host 0.0.0.0`; `--lan` keeps Expo compatible while Docker publishes port `8081` to localhost.

## Useful Commands

Run lint inside Docker:

```bash
docker compose run --rm expo npm run lint
```

Align Expo package versions after SDK updates:

```bash
docker compose run --rm expo sh -lc 'npx expo install --fix'
docker compose run --rm expo sh -lc 'npx expo-doctor'
```

Latest result in this pass: `expo-doctor` reported `18/18 checks passed`.

Probe the deployed backend contract:

```bash
docker compose run --rm expo npm run backend:probe
```

Compact probe output:

```bash
docker compose run --rm expo sh -lc 'PROBE_COMPACT=1 npm run backend:probe'
```

Clear the Expo cache inside Docker:

```bash
docker compose run --rm expo npm run start:clear
```

Run the web command in a one-off container:

```bash
docker compose run --rm --service-ports expo npm run web:docker
```

Reset the dependency volume after package changes:

```bash
docker compose down -v
docker compose build
docker compose up
```

## Current Implemented Product Features

- Normal login attempts backend in default `server` mode.
- Demo login for HV and GV accounts remains available as explicit local fallback.
- Repository layer for auth, posts, comments, courses, notifications, user/profile, settings, blocks, and conversations.
- Four-section top navigator: Home, Friends, Notifications, Profile.
- Facebook-like local home feed with teacher exercise posts and student submission posts.
- Teacher exercise cards with course/exercise metadata, hashtags, two video placeholders, and a clear `Nộp bài` action.
- Exercise submission flow on `/post/create` with two web-safe demo video placeholders.
- Server-backed exercise submission uses multipart with two real videos when a server session exists; local demo placeholders are developer-only.
- Post detail with comments, like/unlike, submission navigation, owner edit/delete controls, and non-owner report controls.
- Non-tab `/courses` screen with course card, teacher info, enrollment state, stats, and exercise list.
- Non-tab `/search` screen over posts, authors, hashtags, and course/exercise text, opened from search buttons.
- Notifications tab with server read-state API integration.
- Menu/Profile tab with server user info, settings/chat navigation rows, and logout.
- Settings screens for profile edit, push settings, password change, device token/version check, and block list.
- Conversation list/detail screens with read/delete HTTP flows where the backend supports them.

## Server-Integrated Or Server-Ready Parts

- Backend probe script: `scripts/probe-backend.mjs`.
- Probe script covers all 40 APIs from the IT4788 spec.
- API client supports JSON, form-urlencoded, and multipart requests.
- API client has wrappers for all 40 IT4788 APIs.
- Server-first repositories are wired into actual UI paths: login/signup, feed, post detail, likes, comments, search, courses/enrollment, notifications, profile, settings, blocks, conversations, and exercise submission.
- `add_post` uses multipart in server-backed sessions with real selected videos.
- `backendStatus` no longer treats unauthenticated `get_list_posts` as a generic reachability probe.
- Existing real HV/GV accounts have verified server login/logout, saved-search list, block list, push settings, device token registration, conversation list, and deployed-compatibility profile/notification/version/check-new-item reads.

## Local Fallback And Development-Only Parts

- Demo users, course, exercises, notifications, conversations, video placeholders, and scoring templates come from `src/constants/demo.js` only in local/dev flows.
- `src/services/postStore.js` is retained for local mode and explicit demo shortcuts.
- Demo video placeholders are not sent to backend; server mode requires real files.
- Pose scoring simulation is local-only. Server-authoritative scoring/result fields are preserved when returned.
- There is no `send_message` API in the 40-API list, so composing a new chat message remains local-only.

## Backend Contract Findings

- `/it4788/login` is active; `/login` is not.
- HTTPS is the default and is verified with real-account E2E. HTTP remains available as a fallback, but redirects to HTTPS and is less reliable for multipart probes.
- Login requires `devtoken`.
- The local demo credentials are not validated backend accounts.
- `/it4788/like` returned 404 during the probe.
- `get_list_posts` worked best with form-urlencoded string values.
- `add_post` requires multipart and `device_slave`.
- Existing real accounts verified several authenticated paths, but returned no posts/courses/exercises, so object-specific flows remain data-blocked.
- Deployed runtime differs from the slides for `check_new_version.last_update`, `get_user_info.user_id`, `get_notification.last_update`, and `check_new_item.token`; repositories keep spec-shaped calls first and isolate compatibility retries.

See [BACKEND_CONTRACT_REPORT.md](BACKEND_CONTRACT_REPORT.md) and [BACKEND_MISMATCHES.md](BACKEND_MISMATCHES.md).

## Troubleshooting Expo In Docker

- If `http://localhost:8081` does not load, confirm `docker compose up` is still running and port `8081` is free.
- If file edits do not trigger reloads, restart compose. Polling is enabled through `CHOKIDAR_USEPOLLING=true` and `WATCHPACK_POLLING=true`.
- If dependencies look stale after package changes, run `docker compose down -v`, rebuild, then start again.
- If Docker cannot pull the Node image or npm packages, check network access and retry `docker compose build`.
- If Expo starts but the browser shows an old session, log out from the Menu tab or clear browser site data for `localhost:8081`.
- Browser file-picker/camera behavior can differ from native mobile. The submission demo uses placeholders so Expo Web remains reliable.

## Known Gaps Versus Backend/API Source Of Truth

- Fresh signup/verify requires an unused real phone number and OTP.
- Real existing accounts returned no post/course/exercise objects, so upload, post detail, comment, notification-read, conversation-detail, and approval flows need seeded backend data or a course fixture.
- Invalid/stale token handling uses shared `SessionExpiredError` and screen redirects, but there is still no global fetch interceptor.
- Feed load-more/cache reconciliation is implemented at the Home screen level; deeper persistent disk cache can be added if the slides require it.
- Full client-side scoring remains a separate gap unless backend scoring is accepted as authoritative by the course rubric.

## Recommended Next Phases

1. Seed or create a real course/exercise/post set for the provided HV/GV accounts.
2. Run the E2E harness with real `E2E_COURSE_ID`, `E2E_EXERCISE_ID`, and two video fixtures.
3. Complete physical-device testing for camera/file picker, native duration metadata, and phone-browser LAN access.
4. Decide whether full client-side scoring is required beyond displaying backend scoring fields.
