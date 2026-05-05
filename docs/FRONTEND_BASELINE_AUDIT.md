# Frontend Baseline Audit

Audit date: 2026-05-05

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
- `src/api`: mock auth API.
- `src/services`: local post/comment/feed storage.
- `src/components`: common UI, post, and profile components.
- `src/constants`: color/size tokens and mock users/posts.
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
- `/(tabs)/home`: social feed tab.
- `/(tabs)/profile`: profile tab with avatar actions.
- `/post/create`: local post creation screen.
- `/post/[id]`: post detail screen.
- `/comment/[postId]`: local comment thread screen.

## Implemented Features

- Auth route guarding based on stored session.
- Mock login/signup/verification/profile completion flow.
- Web-compatible session storage fallback using `localStorage`.
- Seeded Facebook-style feed for marching pose-training posts.
- Like toggling, post detail, local post creation, and local comments.
- Local persistence for feed data, post drafts, comment drafts, and session.
- Basic profile header and avatar picker/camera action sheet.
- Docker-based Expo Web workflow for host machines without npm.

## Mock Or Local-Only Features

- Authentication is handled by `src/api/auth.js` and `src/constants/mocks/users.js`.
- Verification code is always mock code `123456` and stored in memory.
- Feed/posts/comments use `src/services/postStore.js` and `src/constants/mocks/posts.js`.
- Post videos are `mock://` placeholders and are not playable uploaded assets.
- Likes, comments, post creation, and avatar changes are not synced to a server.
- Course and exercise IDs exist only as seed metadata.
- Pose scoring comments are seeded sample data, not backend scoring results.

## Missing Major Product Features

- Real backend API client and auth token lifecycle.
- Teacher/student course enrollment and course detail flows.
- Exercise assignment/submission flow.
- Video upload, validation, preview, and backend processing status.
- Pose comparison/scoring result screens connected to authoritative scoring data.
- Notifications, search, friends/groups, moderation, and account settings.
- Robust offline/error states around network behavior.
- Automated tests or smoke tests.

## Risks

- App behavior depends on mock API response shapes that may not match the deployed backend.
- Signup flow route names in the existing README were stale compared with actual files; audit docs now list current routes.
- `expo-secure-store` needs web fallbacks, which are already present in session and post storage helpers.
- Expo Web can expose native/browser behavior differences for image picker and camera.
- The named Docker `node_modules` volume can become stale after dependency changes unless rebuilt/reset.
- The mock feed stores data locally, so demos may vary after user interaction until browser storage is cleared.

## Recommended Next Phase

Add a small backend API client and auth integration phase:

1. Introduce environment config for `http://group1.it4788.sukkaito.id.vn`.
2. Implement a minimal fetch wrapper with timeout, JSON parsing, auth token attachment, and normalized error handling.
3. Replace `src/api/auth.js` mock calls with backend login/signup/verification calls.
4. Keep mock feed storage available as a fallback until post/feed API contracts are verified.
5. Document backend contract mismatches separately instead of blocking frontend progress.
