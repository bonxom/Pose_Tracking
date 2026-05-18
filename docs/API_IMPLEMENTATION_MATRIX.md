# API Implementation Matrix

Status date: 2026-05-18

Legend:

- `Yes`: implemented in that layer and wired where applicable.
- `Partial`: implemented but not full UI depth, not fully normalized, or not successful-server verified.
- `No`: not implemented in that layer.
- `Blocked`: frontend is present but the deployed backend or missing token/OTP prevents success verification.

The matrix intentionally distinguishes wrappers, repositories, UI usage, and successful real-server verification. A wrapper alone is not considered completion.

| API | Key spec params / behavior | Wrapper | Repository | UI / flow usage | Real success verified | Deployed status / notes |
|---|---|---:|---:|---:|---:|---|
| `login` | `phonenumber`, `password`; deployed also needs `devtoken` | Yes | Yes | Yes | Yes | Existing HV/GV env-only accounts returned code `1000` and tokens over HTTPS and HTTP fallback |
| `logout` | `token` | Yes | Yes | Yes | Yes | Existing HV logout returned code `1000` |
| `signup` | `phonenumber`, `password`, `uuid`, `role` | Yes | Yes | Yes | No | Mutation/OTP requires real phone |
| `get_verify_code` | `phonenumber` | Yes | Yes | Yes | No | Mutation/OTP requires real phone |
| `check_verify_code` | verify code field from slides/runtime | Yes | Yes | Yes | No | Field contract still needs valid signup probe |
| `change_info_after_signup` | token-bearing profile completion | Yes | Yes | Yes | No | Deployed rejects `user_name`; frontend tries spec-style fields then legacy auth-completion fields |
| `get_list_posts` | `token`, `index`, `count`, `last_id`, `category_id`, `new_items` | Yes | Yes | Yes | Empty | Existing accounts returned valid `9994 No data`; pagination UI complete but no real posts |
| `get_post` | `token`, post id; preserve `time_series_poses` | Yes | Yes | Yes | No | Token/post-id blocked |
| `add_post` | multipart, exactly 2 videos, `course_id`, `device_slave`; slides previously modeled `exercise_id` | Yes | Yes | Yes | No | Team now says no separate exercise entity; deployed real-file tests reject all tested multipart file fields, and HV metadata-only control still requires `exercise_id` |
| `edit_post` | owner HV edit with valid replacement-video rules | Yes | Yes | Yes | No | Detail edit UI added; token/post blocked |
| `delete_post` | owner HV delete | Yes | Yes | Yes | No | Deployed `/delete_post` returns 404 |
| `get_comment` | `token`, post id, pagination | Yes | Yes | Yes | No | Token/post blocked |
| `set_comment` | text/link/emoticon only, length-limited | Yes | Yes | Yes | No | Form payload reaches token validation |
| `report_post` | non-owner report | Yes | Yes | Yes | No | Detail report UI added; token/post blocked |
| `like` | like/unlike server post | Yes | Yes | Yes | No | Deployed `/like` returns 404 |
| `search` | keyword, optional `user_id`, pagination | Yes | Yes | Yes | Empty | Existing accounts returned valid empty search; repository includes `user_id` |
| `get_saved_search` | saved search list | Yes | Yes | Yes | Yes | Existing accounts returned code `1000` |
| `del_saved_search` | delete saved-search item | Yes | Yes | Yes | Not run | Destructive deletion intentionally skipped against shared accounts |
| `get_list_students` | teacher course student list | Yes | Yes | Yes | Empty / role-gated | GV returned empty; HV returned `1009 Not access` |
| `get_user_info` | `token`, `user_id` | Yes | Yes | Yes | Compatibility | Spec payload rejected `user_id`; compatibility retry without it returned `1000` |
| `set_user_info` | `token`, `user_name`, `avatar`, `cover_image` | Yes | Yes | Yes | No | Incorrect height contract removed from edit profile |
| `get_list_courses_of_student` | `token`, `user_id` | Yes | Yes | Yes | Empty / intermittent risk | Latest HV/GV run returned `9994 No data`; an earlier HV run returned backend `1001 Can not connect to DB`; repository sends `user_id` plus deployed pagination compatibility; non-tab route is `/courses` |
| `get_list_blocks` | `token`, `index`, `count`, `user_id` | Yes | Yes | Yes | Yes | Existing accounts returned code `1000` |
| `set_block` | block/unblock user | Yes | Yes | Yes | No | Block/unblock UI added |
| `set_approve_enrollment` | `token`, `user_id`, `is_accept` | Yes | Yes | Yes | No | Teacher approval controls added in Courses |
| `get_requested_enrollment` | pending enrollment requests | Yes | Yes | Yes | No | Courses screen surfaces requests |
| `set_request_course` | course enrollment request | Yes | Yes | Yes | No | Repository sends `course_id` plus actual session `user_id` for deployed compatibility |
| `get_push_settings` | settings groups from slides | Yes | Yes | Yes | Yes | Existing accounts returned code `1000` |
| `set_push_settings` | update settings groups | Yes | Yes | Yes | No | Settings screen uses repository |
| `change_password` | old/new password | Yes | Yes | Yes | No | Change-password screen uses repository |
| `check_new_version` | lifecycle/settings version check | Yes | Yes | Yes | Compatibility | Spec `last_update` rejected; deployed `lastUpdate` returned `1000` |
| `set_devtoken` | register device token on auth lifecycle | Yes | Yes | Yes | Yes | Existing-account mutation returned `1000` with numeric `devtype` |
| `get_conversation` | list messages by conversation id | Yes | Yes | Yes | No | Detail screen uses server; token blocked |
| `delete_message` | delete message | Yes | Yes | Yes | No | Detail delete action |
| `get_list_conversation` | conversation list | Yes | Yes | Yes | Yes | Existing accounts returned code `1000`; no conversation objects returned |
| `delete_conversation` | delete conversation | Yes | Yes | Yes | No | Chat list delete action |
| `check_new_item` | `token`, `last_id`, `category_id`; new-items UX | Yes | Yes | Yes | Compatibility | Spec token payload rejected; compatibility retry without token returned `1000` |
| `get_notification` | `notification_id`, `type`, `object_id`, `title`, `created`, `avatar`, `group`, `read`, `badge`, `last_update` | Yes | Yes | Yes | Compatibility | Spec `last_update` rejected; compatibility retry returned `1000` |
| `set_read_message` | mark conversation read | Yes | Yes | Yes | No | Conversation open marks read |
| `set_read_notification` | `notification_id` read state | Yes | Yes | Yes | No | Notification tap marks read |

## Current Completion Summary

- Wrappers: all 40 APIs are represented in `src/api/client.js`.
- Repositories: all 40 APIs are reachable through repository or auth adapters, with local adapters retained only for development modes.
- UI: all required modules have a user-facing path, though the leader-owned top navigator now exposes only Home, Friends, Notifications, and Profile as tabs. Search and Courses are API-backed non-tab routes for UI teammates to place where desired.
- Real success verification: existing HV/GV accounts verify login/logout and several authenticated read/lifecycle APIs. Fresh signup/OTP and object-specific post/course/notification/conversation mutations remain blocked by external data availability or deployed endpoint mismatches.
