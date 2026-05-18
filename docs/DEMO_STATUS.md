# Server-Backed MVP Status

Status date: 2026-05-17

## Current Product Direction

The temporary demo-only phase is finished. The default app path is server-authoritative with:

```bash
EXPO_PUBLIC_API_TYPE=backend
```

`EXPO_PUBLIC_API_TYPE=mock` is the explicit no-backend UI-development path. Legacy `auto` and `local` data-source values remain compatibility aliases. Demo account buttons are explicitly local and should not be treated as backend verification.

## Completed Server-Oriented Features

- Docker-based Expo Web workflow remains the required run path.
- API client wrappers exist for all 40 IT4788 APIs.
- Backend probe script covers all 40 IT4788 APIs with mutation-safe defaults.
- Repository adapters cover auth, posts, comments, courses/enrollment, notifications, user/profile, settings, blocks, and conversations.
- Login form uses backend in default server mode.
- Signup/verify/profile-completion screens now call backend auth helpers in server mode.
- Feed/post detail/comment/like/search paths call repositories instead of directly using local stores.
- Two-video submission uses multipart `add_post` for real server sessions and rejects demo placeholders in strict server mode.
- Courses are API-backed through the non-tab `/courses` route after the leader's 4-section navigator change.
- Notifications tab calls `get_notification` and `set_read_notification`.
- Profile tab calls `get_user_info` and backend logout best-effort.
- Search is API-backed through the non-tab `/search` route, opened from top search actions/menu rows.
- Settings screens exist for profile edit, push settings, password change, device token, version check, and blocks.
- Conversation list/detail screens exist for read/delete HTTP flows.
- Existing real HV/GV accounts verified backend login/logout and several authenticated read/lifecycle endpoints.
- Student course request state now stays pending/requested until GV approval.
- Post detail edit UI supports optional two-video replacement with the same duration validation rules used by uploads.
- Notification unread/badge display uses normalized server fields and a `99+` cap.

## Local Fallback Features

- Developer demo users, course, exercises, notifications, conversations, video placeholders, and scoring templates live in `src/constants/demo.js`.
- Local feed/post/comment persistence remains in `src/services/postStore.js`.
- Demo buttons on login intentionally create local sessions.
- Local scoring comments remain available only for local/demo submissions.
- Creating a new chat message is local-only because the 40-API list does not include a send-message endpoint.

## Backend-Blocked Or Unverified

- Fresh signup/verify still requires unused real phone numbers and OTP.
- Existing real accounts returned no posts/courses/exercises/notifications/conversations, so object-level actions are still data-blocked.
- Feed, search, and course empty states are token-verified with real accounts.
- Saved search list, block list, push settings, device token, conversation list, logout, and deployed-compatibility profile/notification/version/check-new-item paths are token-verified with real accounts.
- Deployed `/it4788/like` returned 404 in prior probe findings.
- Deployed `/it4788/delete_post` returned 404 in prior probe findings.
- `add_post` requires multipart and `device_slave`; successful real upload is currently blocked by deployed multipart file-field mismatch. The latest backend-team clarification says there is no separate exercise entity, while the deployed HV metadata-only response still requires `exercise_id`.
- Full client-side pose scoring is not implemented.

## Documentation Added For Real Implementation

- [IT4788_SOURCE_OF_TRUTH.md](IT4788_SOURCE_OF_TRUTH.md)
- [API_IMPLEMENTATION_MATRIX.md](API_IMPLEMENTATION_MATRIX.md)
- [SCREEN_FLOW_MATRIX.md](SCREEN_FLOW_MATRIX.md)
- [BACKEND_CONTRACT_REPORT.md](BACKEND_CONTRACT_REPORT.md)
- [BACKEND_MISMATCHES.md](BACKEND_MISMATCHES.md)
- [E2E_TEST_REPORT.md](E2E_TEST_REPORT.md)
- [FRONTEND_SERVER_TEST_REPORT.md](FRONTEND_SERVER_TEST_REPORT.md)
