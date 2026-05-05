# Frontend Baseline Audit

Audit date: 2026-05-06

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
- `src/api`: local-first auth plus lightweight backend client helpers.
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

## Implemented Features

- Auth route guarding based on stored session.
- Demo login, mock signup/verification/profile completion flow.
- Web-compatible session storage fallback using `localStorage`.
- Seeded Facebook-style feed for marching pose-training posts.
- Like toggling, post detail, local post creation, and local comments.
- Teacher exercise submission flow with two demo video placeholders.
- Automatic local scoring comment for student submissions.
- Course tab, search tab, notification tab, and menu/profile tab.
- Lightweight backend API client/config layer with safe fallback behavior.
- Local persistence for feed data, post drafts, comment drafts, and session.
- Docker-based Expo Web workflow for host machines without npm.

## Mock Or Local-Only Features

- Demo authentication is handled by `src/api/auth.js`, `src/constants/demo.js`, and `src/constants/mocks/users.js`.
- Verification code is always mock code `123456` and stored in memory.
- Feed/posts/comments use `src/services/postStore.js` and `src/constants/mocks/posts.js`.
- Post videos are `mock://` placeholders and are not playable uploaded assets.
- Likes, comments, post creation, and avatar changes are not synced to a server.
- Course, exercise, notification, enrollment, and search behavior is local-first.
- Pose scoring comments are simulated demo results, not backend scoring results.

## Missing Major Product Features

- Real backend auth token lifecycle.
- Backend-connected teacher/student course enrollment and course detail flows.
- Backend-connected exercise assignment/submission flow.
- Video upload, validation, preview, and backend processing status.
- Pose comparison/scoring result screens connected to authoritative scoring data.
- Friends/groups, moderation, full account settings, and real chat.
- Robust offline/error states around network behavior.
- Automated tests or smoke tests.

## Risks

- App behavior depends on local demo response shapes that may not match the deployed backend.
- Signup flow route names in the existing README were stale compared with actual files; audit docs now list current routes.
- `expo-secure-store` needs web fallbacks, which are already present in session and post storage helpers.
- Expo Web can expose native/browser behavior differences for image picker and camera.
- The named Docker `node_modules` volume can become stale after dependency changes unless rebuilt/reset.
- The mock feed stores data locally, so demos may vary after user interaction until browser storage is cleared.

## Recommended Next Phase

Integrate the prepared backend client without risking the local demo:

1. Verify backend API contracts and document mismatches.
2. Add token storage and authenticated request headers.
3. Map backend auth, feed, post detail, comment, and like endpoints into the local store adapter.
4. Keep local demo data available as fallback until all contracts are stable.
5. Add media upload and scoring-status integration after backend behavior is confirmed.
