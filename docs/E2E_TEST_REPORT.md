# E2E Test Report

Report date: 2026-05-10

## Docker Verification

| Command | Result | Notes |
|---|---|---|
| `docker compose build` | Passed | Image `pose_tracking-expo:latest` built successfully. |
| `docker compose run --rm expo npm run lint` | Passed with warnings | 0 errors. 4 existing warnings remain in `src/app/(auth)/signup-birthday.jsx`. |
| `docker compose run --rm expo sh -lc 'PROBE_COMPACT=1 npm run backend:probe'` | Passed | Probe covers all 40 APIs; no valid token discovered. |
| `docker compose up -d` | Passed | Container `pose_tracking-expo-1` started. |
| `curl -I http://localhost:8081` | Passed with escalated host network permission | Returned `HTTP/1.1 200 OK`, `content-type: text/html`. |

Expo logs included expected SDK package-version warnings and a React Native DevTools fallback download warning. The web server still started and served `http://localhost:8081`.

## Real Server E2E Status

| Flow | Status | Evidence |
|---|---|---|
| Real signup HV | Frontend implemented, not success-verified | `signup` route validates payload; mutation-safe probe used invalid phone. |
| Real signup GV | Frontend implemented, not success-verified | Same blocker as HV. |
| Verify account | Frontend implemented, backend field unclear | Deployed probe rejects common code fields with invalid phone payload. |
| Complete profile | Frontend implemented, token-blocked | `change_info_after_signup` reaches token validation. |
| Real login | Route reachable, not successful | Demo account returns `9995 User is not validated`; no real token available. |
| Feed | Frontend server path implemented, token success unverified | `get_list_posts` route observed; no data without token. |
| Create/view/edit/delete/report post | Frontend wrappers/repositories implemented | `add_post`, `edit_post`, `report_post` reach token validation; `delete_post` 404. |
| Comment/like | Comment path implemented; like backend-blocked | `set_comment` reaches token validation; `like` 404. |
| Search/saved search | Frontend implemented/partial | Search and saved search require token. |
| Course request/approval/student list | Frontend implemented/partial | Routes observed, token required; request payload still needs valid account verification. |
| Block/unblock | Frontend implemented | Token required. |
| Profile get/set | Frontend implemented | Token required. |
| Push settings/change password/devtoken/version | Frontend implemented | Token required on deployed backend. |
| Notifications/read | Frontend implemented | Token required. |
| Conversations/messages/read/delete | Frontend implemented | Token required; sending a new message has no 40-API endpoint. |
| Logout | Frontend implemented | Token required; local session clears even if backend logout fails. |

## Local Developer Fallback Smoke Status

The local fallback path remains available through explicit demo buttons. It was not the product target of this pass, but the repository changes preserve the existing local data adapters and prevent demo placeholders from being sent in strict server mode.

## Blockers

- No valid backend HV/GV account or token was available.
- `/it4788/like` and `/it4788/delete_post` are missing on the deployed backend.
- `check_verify_code` deployed payload field remains unresolved.
- Full client-side pose scoring is not implemented.
