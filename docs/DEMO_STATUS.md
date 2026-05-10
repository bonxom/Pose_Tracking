# Server-Backed MVP Status

Status date: 2026-05-10

## Current Product Direction

The temporary demo-only phase is finished. The default app path is server-authoritative with:

```bash
EXPO_PUBLIC_DATA_SOURCE=server
```

`auto` and `local` remain available for development and emergency fallback. Demo account buttons are explicitly local and should not be treated as backend verification.

## Completed Server-Oriented Features

- Docker-based Expo Web workflow remains the required run path.
- API client wrappers exist for all 40 IT4788 APIs.
- Backend probe script covers all 40 IT4788 APIs with mutation-safe defaults.
- Repository adapters cover auth, posts, comments, courses/enrollment, notifications, user/profile, settings, blocks, and conversations.
- Login form uses backend in default server mode.
- Signup/verify/profile-completion screens now call backend auth helpers in server mode.
- Feed/post detail/comment/like/search paths call repositories instead of directly using local stores.
- Two-video submission uses multipart `add_post` for real server sessions and rejects demo placeholders in strict server mode.
- Courses tab calls course/student/enrollment repositories.
- Notifications tab calls `get_notification` and `set_read_notification`.
- Profile tab calls `get_user_info` and backend logout best-effort.
- Settings screens exist for profile edit, push settings, password change, device token, version check, and blocks.
- Conversation list/detail screens exist for read/delete HTTP flows.

## Local Fallback Features

- Developer demo users, course, exercises, notifications, conversations, video placeholders, and scoring templates live in `src/constants/demo.js`.
- Local feed/post/comment persistence remains in `src/services/postStore.js`.
- Demo buttons on login intentionally create local sessions.
- Local scoring comments remain available only for local/demo submissions.
- Creating a new chat message is local-only because the 40-API list does not include a send-message endpoint.

## Backend-Blocked Or Unverified

- No valid backend token was available during this pass.
- Successful authenticated responses for feed, post detail, comments, likes, courses, notifications, settings, blocks, and conversations are not token-verified.
- Deployed `/it4788/like` returned 404 in prior probe findings.
- `add_post` appears to require multipart and `device_slave`; successful real upload is not verified.
- Full client-side pose scoring is not implemented.
- Teacher approval dashboard and post edit/delete/report menus need final UI work.
- Central invalid/stale token handling remains incomplete.

## Documentation Added For Real Implementation

- [IT4788_SOURCE_OF_TRUTH.md](IT4788_SOURCE_OF_TRUTH.md)
- [API_IMPLEMENTATION_MATRIX.md](API_IMPLEMENTATION_MATRIX.md)
- [SCREEN_FLOW_MATRIX.md](SCREEN_FLOW_MATRIX.md)
- [BACKEND_CONTRACT_REPORT.md](BACKEND_CONTRACT_REPORT.md)
- [BACKEND_MISMATCHES.md](BACKEND_MISMATCHES.md)
- [E2E_TEST_REPORT.md](E2E_TEST_REPORT.md)
