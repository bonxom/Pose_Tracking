# API Implementation Matrix

Legend:

- `Done`: implemented in the named layer and expected to be used in normal flow.
- `Partial`: implemented but incomplete, minimally surfaced, or blocked by unknown backend shape.
- `No`: not implemented in that layer.
- `Token verified`: whether a successful response with a valid backend token has been verified in this repo session.

| API | Spec status | Frontend wrapper | Repository status | Screen/flow usage | Deployed probe status | Token verified | Mismatch notes |
|---|---|---:|---:|---:|---|---:|---|
| `login` | Required | Done | Done | Done | `/it4788/login` exists; `/login` 404 | No | Deployed login requires `devtoken`; demo accounts return `9995` |
| `logout` | Required | Done | Done | Done | Probe-covered | No | Not verified with valid token |
| `signup` | Required | Done | Partial | Done | Probe-covered, mutation-safe by default | No | Exact deployed field contract unverified |
| `get_verify_code` | Required | Done | Partial | Done | Probe-covered, mutation-safe by default | No | May trigger SMS only with mutation probe |
| `check_verify_code` | Required | Done | Partial | Done | Probe-covered | No | Real verification code not available |
| `change_info_after_signup` | Required | Done | Partial | Done | Probe-covered | No | Token-bearing signup path unverified |
| `get_list_posts` | Required | Done | Done | Done | Existing probe found form-urlencoded best | No | Requires token per spec; empty token response varies |
| `get_post` | Required | Done | Done | Done | Probe-covered | No | Needs real post id/token |
| `add_post` | Required | Done | Done | Done | Existing probe found multipart + `device_slave` | No | Real upload not verified without token and real files |
| `edit_post` | Required | Done | Partial | Partial | Probe-covered | No | Repository exists; no prominent edit UI yet |
| `delete_post` | Required | Done | Partial | Partial | Probe-covered | No | Repository exists; no prominent delete UI yet |
| `get_comment` | Required | Done | Done | Done | Probe-covered | No | Needs valid post/token |
| `set_comment` | Required | Done | Done | Done | Probe-covered | No | Needs valid post/token |
| `report_post` | Required | Done | Partial | Partial | Probe-covered | No | Repository exists; no prominent report UI yet |
| `like` | Required | Done | Done | Done | Existing probe found `/it4788/like` 404 | No | Deployed backend route mismatch |
| `search` | Required | Done | Done | Done | Probe-covered | No | Saved-search behavior not fully verified |
| `get_saved_search` | Required | Done | Partial | Partial | Probe-covered | No | Repository exists; minimal UI only |
| `del_saved_search` | Required | Done | Partial | Partial | Probe-covered | No | Repository exists; minimal UI only |
| `get_list_students` | Required | Done | Done | Done | Probe-covered | No | Course id shape unverified |
| `get_user_info` | Required | Done | Done | Done | Probe-covered | No | Profile screen uses repository |
| `set_user_info` | Required | Done | Done | Done | Probe-covered | No | Edit profile screen added |
| `get_list_courses_of_student` | Required | Done | Done | Done | Probe-covered | No | Student course list shape unverified |
| `get_list_blocks` | Required | Done | Done | Done | Probe-covered | No | Blocks screen added |
| `set_block` | Required | Done | Done | Done | Probe-covered | No | Course relation side effect unverified |
| `set_approve_enrollment` | Required | Done | Partial | Partial | Probe-covered | No | Repository exists; teacher approval UI still minimal |
| `get_requested_enrollment` | Required | Done | Done | Done | Probe-covered | No | Courses screen displays count |
| `set_request_course` | Required | Done | Done | Done | Probe-covered | No | Courses screen sends request |
| `get_push_settings` | Required | Done | Done | Done | Probe-covered | No | Settings screen added |
| `set_push_settings` | Required | Done | Done | Done | Probe-covered | No | Settings screen added |
| `change_password` | Required | Done | Done | Done | Probe-covered | No | Change password screen added |
| `check_new_version` | Required | Done | Done | Done | Probe-covered | No | Settings screen can call it |
| `set_devtoken` | Required | Done | Done | Done | Probe-covered | No | Settings screen can call it |
| `get_conversation` | Required | Done | Done | Done | Probe-covered | No | Conversation detail added |
| `delete_message` | Required | Done | Done | Done | Probe-covered | No | Conversation detail delete action added |
| `get_list_conversation` | Required | Done | Done | Done | Probe-covered | No | Conversation list added |
| `delete_conversation` | Required | Done | Done | Done | Probe-covered | No | Conversation list delete action added |
| `check_new_item` | Required | Done | Partial | Partial | Probe-covered | No | Repository exists; refresh UI not fully wired |
| `get_notification` | Required | Done | Done | Done | Probe-covered | No | Notifications tab uses repository |
| `set_read_message` | Required | Done | Done | Done | Probe-covered | No | Conversation open marks read |
| `set_read_notification` | Required | Done | Done | Done | Probe-covered | No | Notification tap marks read |

## Current Interpretation

All 40 API wrappers now exist and the probe script covers all 40 endpoints. Core screens use repository paths instead of directly calling local stores for feed, post detail, comments, likes, courses, notifications, profile, settings, blocks, and conversations.

The largest remaining blocker is the absence of a verified backend token/test account in this environment. That means most authenticated APIs are frontend-complete or probe-covered but not end-to-end verified against successful server responses.
