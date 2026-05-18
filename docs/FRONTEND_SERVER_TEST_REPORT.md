# Frontend Server Test Report

Report date: 2026-05-18

## Scope

This report covers the API-owner repair pass after the leader changed navigation to a Facebook-like four-section top navigator. Docker/npm remains the development workflow, HTTPS is now the default backend base, and HTTP is retained as a documented fallback.

Real credentials supplied by the team were used only through shell environment variables. They are not stored in source files, docs, screenshots, or tracked config.

## Frontend Bugs Fixed In This Pass

| Area | Fix |
|---|---|
| Package lock drift | Removed the accidental `pnpm-lock.yaml`, kept npm as the project package manager, and regenerated `package-lock.json` through Docker. |
| Dependency alignment | `react-native-svg` now resolves from the npm lockfile and Expo-compatible package versions pass `expo-doctor`. |
| Top navigation route targets | Preserved the 4-section top navigator and moved API-backed Search/Courses access to non-tab routes `/search` and `/courses`. |
| Deleted tab route references | Replaced stale `/(tabs)/search` and `/(tabs)/courses` navigation calls. |
| Home lint/runtime cleanup | Removed unused source-label state and surfaced feed errors in a small existing header area instead of noisy debug UI. |
| API ownership docs | Added UI-team API handoff documentation and generated a Postman collection/environment for all 40 APIs. |

## Package Cleanup

Command:

```bash
docker compose run --rm expo sh -lc 'npx expo install --fix'
```

Result: passed. Expo SDK 55 package versions were aligned, including Expo packages and `react-native-svg`.

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

- HTTPS HV login: server success, code `1000`, token extracted.
- HTTPS GV login: server success, code `1000`, token extracted.
- HTTP fallback HV/GV login: server success for normal form requests.
- HV logout: server success, code `1000`.
- Empty-state server reads verified for feed, search, profile search, GV courses, teacher students, and requested enrollment.
- HV/GV course-list reads returned clean `9994 No data` states in the latest HTTPS run. A prior HV run returned backend code `1001 Can not connect to DB`, so the endpoint is still tracked as intermittently unstable.
- Success reads verified for saved search, blocks, push settings, conversation list, compatibility user info, compatibility notifications, compatibility version check, and compatibility check-new-item.
- Safe lifecycle mutation `set_devtoken` verified with backend code `1000`.
- Two real local MP4 fixtures were restored from `stash@{0}` and ignored by Git. Upload remains blocked because the deployed route rejects every tested multipart file-field name; `course_id = GV id` is now exercised and no longer the blocker.

## Browser-Level Smoke

The web runtime is verified through Docker start and HTTP checks, and the UI smoke path is documented for manual execution:

- `docker compose up -d` started `pose_tracking-expo-1`.
- `curl -I http://localhost:8081` returned `HTTP/1.1 200 OK` and `content-type: text/html`.

1. Start `docker compose up -d`.
2. Open `http://localhost:8081`.
3. Log in as HV using the team-provided env-only account credentials.
4. Navigate Home, Friends, Notifications, and Profile.
5. Open Search from the Home top-right search button.
6. Open Courses from Profile or the non-tab `/courses` route.
7. Log out, then repeat login/navigation as GV.
8. Confirm server mode shows no local-demo submission placeholders as valid uploads.
9. Confirm chat composer is hidden/disabled in server mode.

Automated mock-mode browser smoke was also completed on `2026-05-18`:

- Home, `/search`, `/courses`, Friends, Notifications, Profile, `/chat`, `/settings`, and `/settings/blocks` rendered successfully.
- The mock submission path created a local HV post, attached both demo placeholders, generated the scoring comment, and supported local like/comment mutations.
- The visible profile source label showed `Mock`, matching the requested API mode.

## Module Test Matrix

| Module | Status |
|---|---|
| Auth/session | Server verified for existing-account HV/GV login and logout. Fresh signup remains manual phone/OTP blocked. |
| Feed | Frontend complete; server empty state verified. Real pagination needs posts returned by backend. |
| Post detail/interactions | Frontend complete; real object verification blocked by no post ids and missing deployed `/like`/`delete_post` routes. |
| Create/upload | Frontend complete; two real MP4 fixtures are used by the harness, but deployed upload is blocked by multipart field-name mismatch. The latest team clarification says no separate exercise entity; deployed HV metadata-only control still requires `exercise_id`. |
| Search/saved search | Server empty search and saved-search list verified. Deletion not run against shared real accounts. |
| Courses/enrollment | Frontend pending/requested/enrolled states fixed; approval flow blocked by no real course/request data. Latest HV/GV course-list reads returned valid empty states; an earlier HV run returned backend `1001 Can not connect to DB`. |
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
