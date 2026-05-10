# E2E Test Report

Report date: 2026-05-10

Security note: the real GV/HV credentials supplied by the team were used only as shell environment variables during verification. They are intentionally not recorded in this repository.

## Docker And Tooling Verification

| Command | Result | Notes |
|---|---|---|
| `docker compose run --rm expo sh -lc 'npx expo install --fix'` | Passed | Updated Expo SDK 55-aligned package versions in `package.json`, `package-lock.json`, and `app.json` plugin metadata. |
| `docker compose run --rm expo sh -lc 'npx expo-doctor'` | Passed | `18/18 checks passed. No issues detected!` |
| `docker compose build` | Passed | Docker image builds with `npm ci`. `npm audit` still reports 5 transitive vulnerabilities from the dependency tree. |
| `docker compose run --rm expo npm run lint` | Passed | 0 errors, 0 warnings after the signup birthday dependency cleanup. |
| `docker compose run --rm expo sh -lc 'PROBE_COMPACT=1 npm run backend:probe'` | Passed | Probe covers all 40 APIs. Latest run in this pass: `2026-05-10T16:20:27.303Z`. |
| `docker compose run --rm expo sh -lc 'E2E_USE_EXISTING_ACCOUNTS=1 ... npm run e2e:server'` | Passed | Existing HV/GV logins returned backend code `1000`; independent reads completed. |
| `docker compose run --rm expo sh -lc 'E2E_USE_EXISTING_ACCOUNTS=1 E2E_RUN_MUTATIONS=1 ... npm run e2e:server'` | Passed with blocked upload | `set_devtoken` returned code `1000`; upload was correctly blocked because no real `course_id`/`exercise_id` was available. |
| `docker compose up -d` | Passed | Container `pose_tracking-expo-1` started and Expo Web advertised `http://localhost:8081`. |
| `curl -I http://localhost:8081` | Passed | Returned `HTTP/1.1 200 OK`, `content-type: text/html`. First bundle took about 14 seconds after container recreation. |

Expo Web startup has one non-blocking warning: React Native DevTools could not download the latest version and used a fallback. Web bundling completed successfully.

## Real Existing-Account E2E Command

Use the team-provided credentials only through environment variables:

```bash
docker compose run --rm expo sh -lc '
  E2E_USE_EXISTING_ACCOUNTS=1 \
  E2E_HV_PHONE=<provided-hv-phone> \
  E2E_GV_PHONE=<provided-gv-phone> \
  E2E_PASSWORD=<provided-password> \
  npm run e2e:server
'
```

Mutation-enabled safe lifecycle run:

```bash
docker compose run --rm expo sh -lc '
  E2E_USE_EXISTING_ACCOUNTS=1 \
  E2E_RUN_MUTATIONS=1 \
  E2E_HV_PHONE=<provided-hv-phone> \
  E2E_GV_PHONE=<provided-gv-phone> \
  E2E_PASSWORD=<provided-password> \
  E2E_VIDEO_LEFT=/app/.expo/e2e-fixtures/left.mp4 \
  E2E_VIDEO_RIGHT=/app/.expo/e2e-fixtures/right.mp4 \
  npm run e2e:server
'
```

## Real Existing-Account Results

| Area | Result | Evidence |
|---|---|---|
| HV login | Verified server success | HTTP 200, backend code `1000`, token extracted. |
| GV login | Verified server success | HTTP 200, backend code `1000`, token extracted. |
| Session/logout | Verified server success | HV `logout` returned backend code `1000`; local session clear path remains in UI. |
| Feed initial page | Verified empty success path | `get_list_posts` returned code `9994 No data` for both accounts, treated as valid empty state. |
| Feed load more/refresh UI | Frontend complete | Home uses server `last_id`, page size 20, pull-down refresh, pull-up load more, and safe empty state. No real posts were returned to exercise pagination. |
| `check_new_item` | Backend mismatch with compatibility success | Spec payload with `token` failed `1004`; deployed compatibility payload without `token` returned `1000`. |
| Post detail/comments/like/report | Frontend complete, server data blocked | No post id was returned by feed/search, so post-specific calls could not be verified against real objects. `/like` is also missing on deployed backend. |
| Create/upload | Frontend complete, object-data blocked | Two fixture MP4 files were generated, but upload was not attempted because the server returned no real `course_id` and `exercise_id` for these accounts. Server mode correctly refuses demo placeholders and unknown course/exercise IDs. |
| Search | Verified empty success path | Search and profile-scoped search returned `9994 No data` for both accounts. |
| Saved search | Verified server success | `get_saved_search` returned code `1000`; destructive deletion is not run by default against shared real accounts. |
| Courses | Verified empty success path | `get_list_courses_of_student` returned `9994 No data`; UI now shows pending/requested separately from enrolled. |
| Teacher enrollment APIs | Role-aware result | HV received `1009 Not access` for teacher-only student/requested-enrollment reads; GV received `9994 No data`. |
| Blocks | Verified server success | `get_list_blocks` returned code `1000` for both accounts. |
| Push settings | Verified server success | `get_push_settings` returned code `1000` for both accounts. |
| Device token | Verified server success | Mutation-enabled run: `set_devtoken` returned backend code `1000` with deployed numeric `devtype` payload. |
| Version check | Backend mismatch with compatibility success | Spec `last_update` failed; deployed `lastUpdate` compatibility payload returned `1000`. |
| User profile | Backend mismatch with compatibility success | Spec `user_id` failed; deployed compatibility payload without `user_id` returned `1000`. |
| Notifications | Backend mismatch with compatibility success | Spec `last_update` failed; deployed compatibility payload without `last_update` returned `1000`. |
| Conversations | Verified server success for list | `get_list_conversation` returned code `1000`; no conversations were returned, so detail/read/delete object actions were not verified. |

## Flow Matrix Classification

| Module | Classification |
|---|---|
| Auth/session | Real-server verified for login/logout with existing accounts; fresh signup remains OTP/manual-phone blocked. |
| Feed/cache/refresh | Frontend complete and empty-state verified; real pagination not observable because server returned no posts. |
| Post interactions | Frontend complete; blocked by no real post objects and deployed `/like`/`delete_post` route issues. |
| Upload/scoring | Frontend complete for validation and multipart path; blocked by no real course/exercise IDs and no server scoring payload. |
| Search/saved search | Server verified for empty search and saved-search list; deletion intentionally not run against shared accounts. |
| Courses/enrollment | Frontend fixed for pending/requested state; real approval flow blocked by no course/request data. |
| Profile/settings/device | Server verified for profile compatibility, push settings, device token, and version compatibility. |
| Notifications | Server verified through compatibility payload; read-state object action blocked by no notification objects. |
| Blocks | Server read verified; block/unblock mutation not run against shared real accounts. |
| Conversations | Server list verified; detail/read/delete blocked by no conversation objects. |

## External Or Backend-Blocked Items

- Fresh signup and verify still require a real unused phone number and OTP.
- Real two-video `add_post` still needs valid server course and exercise IDs plus real media on a device/browser.
- Full client-side scoring remains a separate implementation gap; server scoring fields are displayed when returned.
- Browser-level smoke can be completed after `docker compose up -d`; automated browser tooling was not available in this session.
