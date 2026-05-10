# Frontend Server Test Report

Report date: 2026-05-10

## Scope

This report covers the final server-backed frontend pass using Docker and the deployed IT4788 backend at `http://group1.it4788.sukkaito.id.vn/it4788`.

Real credentials supplied by the team were used only through shell environment variables. They are not stored in source files, docs, screenshots, or tracked config.

## Frontend Bugs Fixed In This Pass

| Area | Fix |
|---|---|
| Enrollment request state | Student course requests now enter `requested`/`pending` state instead of immediately marking the student as enrolled. UI text/buttons reflect pending approval until backend approval is confirmed. |
| Edit post media rules | Post detail edit mode now supports optional two-video replacement through the existing upload validation path. If either video is replaced, both left/right videos are required and duration rules are enforced. |
| Notification badge/read display | Notification list uses normalized `badge`, `read`, and `last_update` fields; unread count and item badges cap display at `99+`. |
| Misleading local UI | Normal server mode no longer presents local demo wording as the product path; local shortcuts remain developer fallback only. |
| Signup birthday warnings | Signup birthday step now propagates phone/request id correctly and no longer causes lint warnings. |
| Backend compatibility adapters | Added isolated compatibility retries for deployed deviations in `get_user_info`, `get_notification`, `check_new_version`, and `check_new_item`. |
| Device token lifecycle | `set_devtoken` now sends deployed-compatible numeric `devtype` while keeping the repository path server-backed. |

## Package Cleanup

Command:

```bash
docker compose run --rm expo sh -lc 'npx expo install --fix'
```

Result: passed. Expo SDK 55 package versions were aligned, including Expo, React Native, Expo Router, and related Expo packages.

Command:

```bash
docker compose run --rm expo sh -lc 'npx expo-doctor'
```

Result: `18/18 checks passed. No issues detected!`

## Real-Account Server Verification

Command shape:

```bash
docker compose run --rm expo sh -lc '
  E2E_USE_EXISTING_ACCOUNTS=1 \
  E2E_HV_PHONE=<provided-hv-phone> \
  E2E_GV_PHONE=<provided-gv-phone> \
  E2E_PASSWORD=<provided-password> \
  npm run e2e:server
'
```

Results:

- HV login: server success, code `1000`, token extracted.
- GV login: server success, code `1000`, token extracted.
- HV logout: server success, code `1000`.
- Empty-state server reads verified for feed, search, profile search, and courses.
- Success reads verified for saved search, blocks, push settings, conversation list, compatibility user info, compatibility notifications, compatibility version check, and compatibility check-new-item.
- Safe lifecycle mutation `set_devtoken` verified with backend code `1000`.

## Browser-Level Smoke

Automated browser tooling was not available in this session. The web runtime was verified through Docker start and HTTP checks, and the UI smoke path is documented for manual execution:

- `docker compose up -d` started `pose_tracking-expo-1`.
- `curl -I http://localhost:8081` returned `HTTP/1.1 200 OK` and `content-type: text/html`.
- Expo Web bundled successfully in about 14 seconds after container recreation.
- Non-blocking runtime warnings: React Native DevTools fallback download warning and a React Native Web `shadow*` deprecation warning.

1. Start `docker compose up -d`.
2. Open `http://localhost:8081`.
3. Log in as HV using the team-provided env-only account credentials.
4. Navigate Home, Courses, Search, Notifications, Profile/Menu, Settings, Blocks, and Chat.
5. Log out, then repeat login/navigation as GV.
6. Confirm server mode shows no local-demo submission placeholders as valid uploads.
7. Confirm chat composer is hidden/disabled in server mode.

## Module Test Matrix

| Module | Status |
|---|---|
| Auth/session | Server verified for existing-account HV/GV login and logout. Fresh signup remains manual phone/OTP blocked. |
| Feed | Frontend complete; server empty state verified. Real pagination needs posts returned by backend. |
| Post detail/interactions | Frontend complete; real object verification blocked by no post ids and missing deployed `/like`/`delete_post` routes. |
| Create/upload | Frontend complete; two real MP4 fixtures generated for harness, but upload is blocked until real `course_id` and `exercise_id` are available. |
| Search/saved search | Server empty search and saved-search list verified. Deletion not run against shared real accounts. |
| Courses/enrollment | Frontend pending/requested/enrolled states fixed; approval flow blocked by no real course/request data. |
| Profile/settings/device | Server verified for compatibility profile read, push settings, version check, and set-devtoken. |
| Notifications | Server verified through compatibility payload; read-state object action blocked by no notification ids. |
| Blocks | List read verified; block/unblock mutation not run against shared accounts. |
| Conversations | Conversation list verified; detail/read/delete blocked by no conversation ids. |
| Error handling | Server mode surfaces safe errors and does not fake success for backend-blocked actions. |

## Remaining Verification Constraints

- No physical device was available in this environment, so native video capture/file duration behavior still needs final device testing.
- Existing real accounts currently return no posts/courses/exercises; object-level server flows require seeded backend data.
- Fresh signup requires an unused phone number and OTP.
- Full client-side pose scoring remains an explicit remaining implementation gap unless waived by the project rubric.
