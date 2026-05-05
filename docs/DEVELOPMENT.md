# Development Workflow

This repository is a React Native / Expo Router draft for the IT4788 marching pose-training social app. The current priority is a runnable, demo-friendly frontend baseline, so the app still uses mock/local data and does not call the deployed backend yet.

Backend source of truth for future integration:

```text
http://group1.it4788.sukkaito.id.vn
```

## Run With Docker

The developer machine does not need Node or npm installed locally. Docker installs dependencies inside the image with `npm ci` because `package-lock.json` is present.

Build the image:

```bash
docker compose build
```

Start Expo Web:

```bash
docker compose up
```

The Docker web script uses Expo's accepted LAN host mode and publishes port `8081` to the host:

```bash
WEB_HOST=0.0.0.0 expo start --web --lan --port 8081
```

Expo SDK 55 rejects `--host 0.0.0.0`; `--lan` keeps the command compatible while Docker exposes the demo on localhost.

Open the web demo:

```text
http://localhost:8081
```

Stop the demo with `Ctrl+C`. If dependencies change, rebuild the image:

```bash
docker compose build
```

If the named `node_modules` volume gets stale after dependency changes, reset it:

```bash
docker compose down -v
docker compose build
docker compose up
```

## Useful Commands

Run lint inside Docker:

```bash
docker compose run --rm expo npm run lint
```

Clear the Expo cache inside Docker:

```bash
docker compose run --rm expo npm run start:clear
```

Run the same web command without compose after building the image:

```bash
docker compose run --rm --service-ports expo npm run web:docker
```

## Current Implemented Features

- Expo Router file-based navigation with auth, tabs, post, and comment stacks.
- Mock login/signup/verification/profile-completion flow.
- Session persistence through `expo-secure-store` on native and `localStorage` on web.
- Home feed with seeded marching pose-training posts.
- Post detail, like toggling, local post creation, and local comments.
- Basic profile screen with avatar picker/camera flows.
- Expo Web demo path through Docker at `http://localhost:8081`.

## Mock And Local-Only Parts

- `src/api/auth.js` is a mock API backed by in-memory users and verification codes.
- `src/services/postStore.js` seeds posts from `src/constants/mocks/posts.js` and persists changes locally.
- Likes, comments, drafts, newly created posts, avatar selection, and auth session are local-only.
- Video URIs use `mock://...` placeholders; no upload, streaming, pose comparison, or scoring API is wired.
- The official backend at `http://group1.it4788.sukkaito.id.vn` is documented but not integrated.

## Troubleshooting Expo In Docker

- If `http://localhost:8081` does not load, confirm the compose service is still running and that port `8081` is not used by another process.
- If file edits do not trigger reloads, restart compose. Polling is enabled through `CHOKIDAR_USEPOLLING=true` and `WATCHPACK_POLLING=true`.
- If Expo behaves as if dependencies are missing after package changes, run `docker compose down -v`, rebuild, then start again.
- If Docker cannot pull the Node image or npm packages, check network access and retry `docker compose build`.
- Browser camera/library APIs may differ from native device behavior; native compatibility is preserved, but this workflow is only the web demo.

## Known Gaps Versus Backend/API Source Of Truth

- No real authentication token exchange or API client configuration yet.
- No backend feed pagination, post retrieval, post creation, media upload, comment, like, or notification integration.
- No course/class/exercise screens beyond post seed data references.
- No pose-estimation upload workflow, scoring result rendering from backend, or authoritative mistake details.
- No role-based teacher/student permissions beyond mock fields.
- Backend mismatches should be documented during integration rather than blocking this baseline.

## Recommended Next Phases

1. Add a small backend API client and environment config for `http://group1.it4788.sukkaito.id.vn`.
2. Replace mock auth with backend login/signup/session handling.
3. Integrate feed/post/comment/like endpoints while keeping local fallback data during demos.
4. Add course and exercise navigation around the social feed.
5. Add media upload and pose-scoring result screens once backend contracts are verified.
