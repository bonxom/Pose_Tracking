# E2E Test Report

Report date: 2026-05-18

Security note: the real GV/HV credentials supplied by the team were used only as shell environment variables during verification. They are intentionally not recorded in this repository.

## Docker And Tooling Verification

| Command | Result | Notes |
|---|---|---|
| `docker compose run --rm expo npm install` | Passed | Re-synced `package-lock.json` after the leader commit added `react-native-svg`. |
| `docker compose run --rm expo sh -lc 'npx expo install --fix'` | Passed | Updated Expo SDK 55-aligned package versions and `react-native-svg` to Expo-compatible versions. |
| `docker compose run --rm expo sh -lc 'npx expo-doctor'` | Passed | `18/18 checks passed. No issues detected!` |
| `docker compose build` | Passed | Docker image builds with `npm ci`; the npm lockfile is now authoritative. Npm still reports 5 transitive audit findings. |
| `docker compose run --rm expo npm run lint` | Passed | 0 errors after route and Home cleanup. |
| `docker compose run --rm expo sh -lc 'PROBE_COMPACT=1 npm run backend:probe'` | Passed | Probe covers all 40 APIs over HTTPS. Latest run in this pass: `2026-05-18T01:51:40.924Z`. |
| `docker compose run --rm expo sh -lc 'API_BASE_URL=http://group1.it4788.sukkaito.id.vn/it4788 PROBE_COMPACT=1 npm run backend:probe'` | Passed | HTTP fallback remains reachable for normal requests, but HTTP upload probes are less reliable than HTTPS. |
| `docker compose run --rm expo sh -lc 'E2E_USE_EXISTING_ACCOUNTS=1 E2E_USE_GV_ID_AS_COURSE_ID=1 E2E_NO_EXERCISE_ENTITY=1 E2E_RUN_MUTATIONS=1 ... npm run e2e:server'` | Passed with backend blockers | Latest HTTPS run: `2026-05-18T01:58:28.084Z`. Existing HV/GV logins returned backend code `1000`; no upload variant succeeded because the deployed route rejected every tested multipart file field. |
| `docker compose run --rm expo sh -lc 'API_BASE_URL=http://group1.it4788.sukkaito.id.vn/it4788 E2E_USE_EXISTING_ACCOUNTS=1 ... npm run e2e:server'` | Passed | HTTP fallback also supports login and read-oriented checks. |
| `docker compose run --rm expo sh -lc 'E2E_USE_EXISTING_ACCOUNTS=1 E2E_USE_GV_ID_AS_COURSE_ID=1 E2E_NO_EXERCISE_ENTITY=1 E2E_RUN_MUTATIONS=1 ... npm run e2e:server'` | Passed with backend-blocked upload | `course_id = GV id` was supplied; all tested real-file variants were rejected with `Unexpected field`, while the HV metadata-only control still required `exercise_id`. |
| `docker compose up -d` | Passed | Container `pose_tracking-expo-1` started. |
| `curl -I http://localhost:8081` | Passed | Returned `HTTP/1.1 200 OK`, `content-type: text/html`. |

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
  E2E_VIDEO_LEFT=/app/video/cam1.mp4 \
  E2E_VIDEO_RIGHT=/app/video/cam2.mp4 \
  npm run e2e:server
'
```

The `video/*.mp4` fixtures are ignored by Git and must not be committed.
Use `E2E_USE_GV_ID_AS_COURSE_ID=1` when the target course is the provided GV. Use `E2E_NO_EXERCISE_ENTITY=1` to exercise the latest team clarification that there is no separate backend exercise entity. If the backend later exposes an explicit id anyway, `E2E_EXERCISE_ID` still enables the strict spec-shaped variant.

## Real Existing-Account Results

| Area | Result | Evidence |
|---|---|---|
| HV login | Verified server success | HTTPS and HTTP fallback both returned HTTP 200, backend code `1000`, token extracted. |
| GV login | Verified server success | HTTPS and HTTP fallback both returned HTTP 200, backend code `1000`, token extracted. |
| Session/logout | Verified server success | HV `logout` returned backend code `1000`; local session clear path remains in UI. |
| Feed initial page | Verified empty success path | `get_list_posts` returned code `9994 No data` for both accounts, treated as valid empty state. |
| Feed load more/refresh UI | Frontend complete | Home uses server `last_id`, page size 20, pull-down refresh, pull-up load more, and safe empty state. No real posts were returned to exercise pagination. |
| `check_new_item` | Backend mismatch with compatibility success | Spec payload with `token` failed `1004`; deployed compatibility payload without `token` returned `1000`. |
| Post detail/comments/like/report | Frontend complete, server data blocked | No post id was returned by feed/search, so post-specific calls could not be verified against real objects. `/like` is also missing on deployed backend. |
| Create/upload | Frontend complete, backend blocked | Real MP4 fixtures were used with `course_id = GV id`. Variants A-C were exercised for the no-exercise contract, but every real-file attempt failed first with `Unexpected field` for all tested multipart file names. Metadata-only HV control still required `exercise_id`. |
| Search | Verified empty success path | Search and profile-scoped search returned `9994 No data` for both accounts. |
| Saved search | Verified server success | `get_saved_search` returned code `1000`; destructive deletion is not run by default against shared real accounts. |
| Courses | Latest empty success; intermittent backend risk remains documented | GV and HV `get_list_courses_of_student` both returned `9994 No data` in the latest HTTPS run. A prior HTTPS run returned `1001 Can not connect to DB` for HV, so the deployed endpoint remains worth watching. UI still shows pending/requested separately from enrolled. |
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
| Upload/scoring | Frontend complete for validation and multipart path; `course_id = GV id` is now known, but server upload is still blocked by multipart field-name mismatch plus the deployed HV requirement for `exercise_id`. |
| Search/saved search | Server verified for empty search and saved-search list; deletion intentionally not run against shared accounts. |
| Courses/enrollment | Frontend fixed for pending/requested state; real approval flow blocked by no course/request data. Latest HV/GV course-list reads returned clean empty states, while mutation-enabled `set_request_course` returned deployed backend `1001 Can not connect to DB`. |
| Profile/settings/device | Server verified for profile compatibility, push settings, device token, and version compatibility. |
| Notifications | Server verified through compatibility payload; read-state object action blocked by no notification objects. |
| Blocks | Server read verified; block/unblock mutation not run against shared real accounts. |
| Conversations | Server list verified; detail/read/delete blocked by no conversation objects. |

## External Or Backend-Blocked Items

- Fresh signup and verify still require a real unused phone number and OTP.
- Real two-video `add_post` now derives course id from GV id when `E2E_USE_GV_ID_AS_COURSE_ID=1` is set, but the deployed backend currently rejects every tested multipart field name before a real post can be created. The no-exercise team clarification is not yet reflected by the deployed HV metadata-only response.
- Full client-side scoring remains a separate implementation gap; server scoring fields are displayed when returned.
- Browser-level smoke can be completed after `docker compose up -d`; this report records HTTP server availability, while physical-device UI testing remains a team/manual step.
