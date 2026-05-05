# Demo MVP Status

Status date: 2026-05-06

## Completed Demo Features

- Docker-based Expo Web workflow remains the required run path.
- Demo-ready login screen with visible HV and GV demo account shortcuts.
- Local session persistence on web.
- Five bottom tabs: Home, Courses, Search, Notifications, Menu/Profile.
- Facebook-style local feed with marching/parade exercise content.
- Teacher exercise posts with `Nộp bài`, course metadata, exercise metadata, hashtags, two video placeholders, likes, and comments.
- Student submission posts with score summary and scoring comments.
- Post detail view with local comments, local likes, and submission entry.
- Exercise submission mode on `/post/create` with two web-safe demo video placeholders.
- Automatic local scoring result comment after submission.
- Course screen with enrollment state, teacher info, exercise list, and demo stats.
- Local search over posts, authors, hashtags, courses, and exercises.
- Local notifications with unread/read state and simple navigation.
- Menu/Profile screen with user info, demo-mode label, navigation rows, and logout.

## Local Or Mock Features

- Demo users, course, exercises, notifications, conversations, scoring templates, and video placeholders are seeded locally.
- Feed persistence, post creation, likes, comments, submission creation, enrollment changes, and notification read state use local storage.
- Video upload is represented by two placeholder cards: `Góc quay trái` and `Góc quay phải`.
- Auto scoring is simulated with a fixed realistic score, mistakes, suggestions, and time-range hint.
- Signup remains a draft mock flow and is preserved for continuity.
- Demo chat data exists as constants, but no full chat route was added in this urgent pass.

## Backend-Opportunistic Behavior

- Backend base URL defaults to:

```text
http://group1.it4788.sukkaito.id.vn/it4788
```

- `EXPO_PUBLIC_API_BASE_URL` can override the base URL.
- `src/api/client.js` includes safe URL joining, timeout, POST helper, safe JSON parsing, and normalized errors.
- Prepared endpoints include login, list posts, post detail, like, get comments, and set comment.
- Login accepts known demo users locally first. Unknown local users may attempt backend login, then fail safely back to demo behavior.
- The core demo path does not require backend availability.

## Known Gaps After This MVP

- No real backend token lifecycle, refresh, or authenticated request headers.
- No contract-mapped backend feed, post creation, comment, like, course, notification, or enrollment integration.
- No real media picker/upload path for web demo submissions.
- No real pose-estimation or scoring service integration.
- No teacher content-management flow beyond seeded exercise posts.
- No real push notification or socket chat implementation.
- No automated end-to-end test for the click-through demo path.
- Local browser storage can make repeated demos differ until logout or site data reset.

## Recommended Next Task

Integrate the backend API client into auth, feed, post detail, comments, and likes with a local fallback adapter. Keep the local demo data as a safety net while documenting any backend contract mismatch separately.
