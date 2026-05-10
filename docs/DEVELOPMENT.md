# Development Workflow

This repository is a React Native / Expo Router frontend for the IT4788 marching/parade pose-training social app. The current strategy is server-first hybrid: use the deployed backend when a real server session exists, but keep the local demo fallback so the app remains demo-safe if backend auth, routes, CORS, or contracts fail.

Backend source of truth for future integration:

```text
http://group1.it4788.sukkaito.id.vn
```

Prepared frontend API base URL:

```text
http://group1.it4788.sukkaito.id.vn/it4788
```

Override when needed:

```bash
EXPO_PUBLIC_API_BASE_URL=http://group1.it4788.sukkaito.id.vn/it4788 docker compose up
```

## Demo Accounts

```text
Student HV: 0900000001 / 123456
Teacher GV: 0900000002 / 123456
```

The login screen also has visible demo-account buttons, so the morning demo can start without typing credentials.

Important: these demo shortcuts are explicitly local. The normal login form attempts backend login first in `auto` and `server` modes.

## Data Source Modes

Default:

```bash
EXPO_PUBLIC_DATA_SOURCE=auto
```

Modes:

- `auto`: use server repositories only when a real server session/token exists; fall back to local demo data if a backend call fails.
- `server`: use backend repositories and show safe errors if backend/token/contracts fail.
- `local`: preserve the local demo behavior exactly.

Optional config:

```bash
EXPO_PUBLIC_API_BASE_URL=http://group1.it4788.sukkaito.id.vn/it4788
EXPO_PUBLIC_API_TIMEOUT_MS=4500
EXPO_PUBLIC_API_DEBUG=1
```

The Home/Menu UI shows a small data-source label such as `Nguồn dữ liệu: Server`, `Local fallback`, or `Demo local`.

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

## Current Implemented Demo Features

- Demo login for HV and GV accounts, with web session persistence.
- Normal login attempts backend first in `auto`/`server` modes.
- Repository layer for auth, posts, comments, courses, notifications, and server/local fallback.
- Five-tab app shell: Home, Courses, Search, Notifications, Menu/Profile.
- Facebook-like local home feed with teacher exercise posts and student submission posts.
- Teacher exercise cards with course/exercise metadata, hashtags, two video placeholders, and a clear `Nộp bài` action.
- Exercise submission flow on `/post/create` with two web-safe demo video placeholders.
- Local submission creation at the top of the feed, including a simulated auto-scoring comment.
- Post detail with comments, local comment creation, like/unlike, and submission navigation.
- Courses tab with course card, teacher info, enrollment state, stats, and exercise list.
- Search tab over posts, authors, hashtags, and course/exercise text.
- Notifications tab with local unread/read behavior and simple navigation targets.
- Menu/Profile tab with logged-in user info, demo-mode label, navigation rows, and logout.

## Server-Integrated Or Server-Ready Parts

- Backend probe script: `scripts/probe-backend.mjs`.
- API client supports JSON, form-urlencoded, and multipart requests.
- Server-first repositories are wired into actual UI paths: login, feed, post detail, likes, comments, search, courses, notifications, and exercise submission.
- `add_post` uses multipart in server-backed sessions with real selected videos.
- `backendStatus` no longer treats unauthenticated `get_list_posts` as a generic reachability probe.

## Mock And Local-Only Parts

- Demo users, course, exercises, notifications, conversations, video placeholders, and scoring templates come from `src/constants/demo.js`.
- Feed/posts/comments use `src/services/postStore.js` with browser/native local storage.
- Likes, comments, post creation, submissions, notification read state, enrollment state, and auth session are local-only for the demo.
- Video attachments are placeholders, not uploaded media.
- Pose scoring is a realistic fixed simulation, not a real pose-estimation algorithm.
- Chat data is prepared as demo constants, but no real socket chat is implemented.

## Backend Contract Findings

- `/it4788/login` is active; `/login` is not.
- Login requires `devtoken`.
- The local demo credentials are not validated backend accounts.
- `/it4788/like` returned 404 during the probe.
- `get_list_posts` worked best with form-urlencoded string values.
- `add_post` requires multipart and `device_slave`.

See [BACKEND_CONTRACT_REPORT.md](BACKEND_CONTRACT_REPORT.md) and [BACKEND_MISMATCHES.md](BACKEND_MISMATCHES.md).

## Troubleshooting Expo In Docker

- If `http://localhost:8081` does not load, confirm `docker compose up` is still running and port `8081` is free.
- If file edits do not trigger reloads, restart compose. Polling is enabled through `CHOKIDAR_USEPOLLING=true` and `WATCHPACK_POLLING=true`.
- If dependencies look stale after package changes, run `docker compose down -v`, rebuild, then start again.
- If Docker cannot pull the Node image or npm packages, check network access and retry `docker compose build`.
- If Expo starts but the browser shows an old session, log out from the Menu tab or clear browser site data for `localhost:8081`.
- Browser file-picker/camera behavior can differ from native mobile. The submission demo uses placeholders so Expo Web remains reliable.

## Known Gaps Versus Backend/API Source Of Truth

- No full backend auth token lifecycle is wired yet.
- No authoritative backend feed pagination, media upload, course enrollment, notifications, or scoring processing.
- No real two-video upload pipeline or backend pose-comparison status screen.
- Role-based permissions are demo-friendly but not enforced by the backend.
- Backend contract mismatches should be documented during the next integration phase instead of blocking this demo.

## Recommended Next Phases

1. Verify backend API contracts against the deployed source of truth.
2. Integrate backend login/session tokens while keeping demo fallback accounts.
3. Map feed, post detail, comment, and like endpoints into `postStore`.
4. Add media upload and scoring-status integration behind local fallback.
5. Replace local notifications/chat with backend or socket-backed implementations when contracts are stable.
