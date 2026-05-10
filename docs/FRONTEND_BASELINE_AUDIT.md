# Frontend Baseline Audit

Audit date: 2026-05-10

## Tech Stack Detected

- React Native `0.83.4`
- Expo SDK `~55.0.11`
- Expo Router `~55.0.10`
- React `19.2.0`
- React Navigation bottom tabs
- React Native Web
- Expo SecureStore, ImagePicker, WebBrowser, Splash Screen, Status Bar
- ESLint with `eslint-config-expo`
- JavaScript/JSX with `@/*` path aliases from `jsconfig.json`

## Repository Shape

- `src/app`: Expo Router route files and layouts.
- `src/api`: server-backed auth helpers plus 40-API backend client helpers.
- `src/repositories`: server-authoritative adapter layer with developer local fallback.
- `src/services`: local post/comment/feed storage.
- `src/components`: common UI, post, and profile components.
- `src/config`: environment config for backend base URL and timeout.
- `src/constants`: color/size tokens, demo constants, and mock users/posts.
- `src/styles`: screen and component style modules.
- `src/utils`: validation, formatting, and session helpers.
- `example`: unused Expo template example code.

## Implemented Routes And Screens

- `/`: session bootstrap redirect.
- `/(auth)`: auth stack.
- `/(auth)/login`: mock phone/password login.
- `/(auth)/signup-start`: entry screen for signup.
- `/(auth)/signup-profile`: signup profile data step.
- `/(auth)/signup-birthday`: birthday step.
- `/(auth)/signup`: phone/password/role signup step.
- `/(auth)/signup-terms`: terms acceptance step.
- `/(auth)/verify`: mock verification code step.
- `/(auth)/change-info-after-signup`: profile completion step.
- `/(auth)/signup-success`: signup success screen.
- `/(tabs)/home`: social feed tab with exercise/submission posts.
- `/(tabs)/courses`: demo course and exercise tab.
- `/(tabs)/search`: local search tab.
- `/(tabs)/notifications`: local notification tab.
- `/(tabs)/profile`: menu/profile tab with logout.
- `/post/create`: local post creation and exercise submission screen.
- `/post/[id]`: post detail screen with comments and scoring result.
- `/comment/[postId]`: local comment thread screen.
- `/settings`: profile/push/password/device/version settings hub.
- `/settings/profile-edit`: profile edit screen.
- `/settings/push`: push settings screen.
- `/settings/change-password`: change password screen.
- `/settings/blocks`: block list screen.
- `/chat`: conversation list.
- `/chat/[id]`: conversation detail.

## Implemented Features

- Auth route guarding based on stored session.
- Server login plus server-backed signup/verification/profile completion helpers.
- Explicit developer-local demo login shortcuts.
- Web-compatible session storage fallback using `localStorage`.
- Seeded Facebook-style feed for marching pose-training posts.
- Repository-backed like toggling, post detail, post creation, and comments.
- Teacher exercise submission flow with server multipart upload for real videos and local placeholders only in dev fallback.
- Automatic local scoring comment for student submissions.
- Course tab, search tab, notification tab, menu/profile tab, settings screens, blocks, and conversations.
- Backend API client wrappers for all 40 IT4788 APIs.
- Backend probe script and documented deployed-contract findings.
- Data-source modes: default `server`, plus `auto` and `local` for development fallback.
- Local persistence for feed data, post drafts, comment drafts, and session.
- Docker-based Expo Web workflow for host machines without npm.

## Mock Or Local-Only Features

- Demo authentication is handled by `src/api/auth.js`, `src/constants/demo.js`, and `src/constants/mocks/users.js`.
- Verification code is always mock code `123456` and stored in memory.
- Feed/posts/comments use `src/services/postStore.js` and `src/constants/mocks/posts.js`.
- Post videos are `mock://` placeholders and are not playable uploaded assets.
- Likes, comments, post creation, and avatar changes are not synced to a server.
- Course, exercise, notification, enrollment, search, settings, and chat behavior still has local fallback for developer/demo sessions.
- Demo-account shortcut auth is explicitly local.
- Pose scoring comments are simulated demo results, not backend scoring results.

## Missing Major Product Features

- Verified successful backend auth token lifecycle with a valid test account.
- Fully verified backend-connected teacher/student course enrollment and course detail flows.
- Fully verified backend-connected exercise assignment/submission flow.
- Successful two-video upload and backend processing/scoring status.
- Pose comparison/scoring result screens connected to authoritative scoring data.
- Full teacher approval dashboard, post action menus, and send-message flow if backend adds an API.
- Robust offline/error states around network behavior.
- Automated tests or smoke tests.

## Risks

- Server repository behavior is defensive, but successful backend payload mapping is not verified without a valid token.
- `/it4788/like` returned 404 during probing, so server likes are wired but likely blocked by deployed route mismatch.
- `/it4788/delete_post` also returned 404 during the 40-API probe.
- `expo-secure-store` needs web fallbacks, which are already present in session and post storage helpers.
- Expo Web can expose native/browser behavior differences for image picker and camera.
- The named Docker `node_modules` volume can become stale after dependency changes unless rebuilt/reset.
- The mock feed stores data locally, so demos may vary after user interaction until browser storage is cleared.

## Recommended Next Phase

Complete server verification with real accounts:

1. Obtain/create valid backend HV and GV accounts.
2. Verify all 40 APIs with a real token and update normalizers.
3. Finish teacher approval UI and post edit/delete/report menus.
4. Add centralized invalid-token handling.
5. Decide whether client-side scoring must be implemented beyond backend scoring display.
