# E2E Test Report

Report date: 2026-05-10

## Docker Verification

| Command | Result | Notes |
|---|---|---|
| `docker compose build` | Passed | Image `pose_tracking-expo:latest` built successfully. `npm ci` installed 904 packages; npm audit reported 5 dependency vulnerabilities inherited from current dependency set. |
| `docker compose run --rm expo npm run lint` | Passed with warnings | 0 errors. 4 existing warnings remain in `src/app/(auth)/signup-birthday.jsx`. |
| `docker compose run --rm expo sh -lc 'PROBE_COMPACT=1 npm run backend:probe'` | Passed | Probe covers all 40 APIs; no valid token discovered. Latest run: `2026-05-10T09:46:26.014Z`. |
| `docker compose run --rm expo npm run e2e:server` | Passed as non-mutating harness | No credentials were provided, so HV/GV signup and authenticated reads are correctly marked blocked. |
| `docker compose up -d` | Passed | Container `pose_tracking-expo-1` started and Expo Web advertised `http://localhost:8081`. |
| `curl -I http://localhost:8081` | Passed | Returned `HTTP/1.1 200 OK`, `content-type: text/html`. First bundle took about 15 seconds. |

Expo logs included expected SDK package-version warnings and a React Native DevTools fallback download warning. The web server still started and served `http://localhost:8081`.

## Non-Mutating Server E2E Harness Result

Command:

```bash
docker compose run --rm expo npm run e2e:server
```

Result:

```json
{
  "mutationEnabled": false,
  "steps": [
    { "name": "HV signup", "status": "blocked", "reason": "Missing E2E_HV_PHONE" },
    { "name": "GV signup", "status": "blocked", "reason": "Missing E2E_GV_PHONE" },
    { "name": "HV authenticated reads", "status": "blocked", "reason": "No token" },
    { "name": "GV authenticated reads", "status": "blocked", "reason": "No token" }
  ]
}
```

## Real Server Flow Status

| Flow | Status | Evidence |
|---|---|---|
| Real signup HV/GV | Frontend complete, manual-blocked | UI and harness support fresh accounts. Real phone numbers were not available. |
| Verify account | Frontend complete, manual-blocked | UI accepts manual code; harness can resume with `E2E_HV_VERIFY_CODE` / `E2E_GV_VERIFY_CODE`. |
| Complete profile | Frontend complete, backend contract split | Frontend tries spec-style `user_name/avatar/cover_image` then deployed-style legacy profile body for `change_info_after_signup`. |
| Real login | Route reachable, not successful | `/it4788/login` returns `9995 User is not validated` for local demo credentials; no valid token available. |
| Feed | Frontend complete, token success unverified | Home uses server `last_id`, count 20, refresh, load-more, and `check_new_item`. |
| Create/view/edit/delete/report post | Frontend complete, backend-blocked in places | `add_post`/`edit_post` multipart reach token validation; `delete_post` is 404 on deployed backend. |
| Comment/like | Comment frontend complete; like backend-blocked | `set_comment` reaches token validation; `/it4788/like` is 404. |
| Search/saved search | Frontend complete compact UI | Search uses backend repository and saved-search delete path. |
| Course request/approval/student list | Frontend complete compact UI | `set_request_course` reaches token validation when both `course_id` and `user_id` are sent. |
| Block/unblock | Frontend complete | Block list sends `token`, `index`, `count`, `user_id`; set_block available. |
| Profile get/set | Frontend complete | Edit profile uses `user_name`, `avatar`, `cover_image`. |
| Push settings/change password/devtoken/version | Frontend complete | Settings screens call server repositories; token required. |
| Notifications/read | Frontend complete | Notification fields normalized; read state uses `notification_id`. |
| Conversations/messages/read/delete | Frontend complete except send | No server send-message feature is exposed; composer hidden in server mode. |
| Logout | Frontend complete | Server logout attempted when token exists; local session clears regardless. |

## Backend-Blocked Or Still External

- No valid backend HV/GV account or OTP was available in this environment.
- `/it4788/like` returns 404.
- `/it4788/delete_post` returns 404.
- `check_new_item` rejects a `token` field in deployed runtime, so the repository has an isolated compatibility retry without token after the spec-shaped call fails.
- `change_info_after_signup` deployed runtime rejects `user_name`, while `set_user_info` is documented with `user_name/avatar/cover_image`; auth completion therefore tries both shapes and documents the mismatch.
- Full client-side pose scoring is not implemented.
