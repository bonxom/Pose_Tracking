# Screen Flow Matrix

Status date: 2026-05-10

| Flow | Route / screen | Server APIs used | Status | Notes |
|---|---|---|---|---|
| Login | `/(auth)/login` | `login`, `set_devtoken` | Server-first | Normal form calls backend. Local demo buttons are hidden behind developer fallback in server mode. |
| Signup | `/(auth)/signup-*`, `/(auth)/verify`, `/(auth)/change-info-after-signup` | `signup`, `get_verify_code`, `check_verify_code`, `change_info_after_signup`, `set_devtoken` | Server-ready, OTP-blocked | Manual OTP continuation supported by UI/runbook. |
| Session resume / invalid token | root layout + repository errors | stored token/session | Partial | Central `SessionExpiredError` clears session; screens use `redirectIfSessionExpired`. A global fetch interceptor is still not present. |
| Home feed | `/(tabs)/home` | `get_list_posts`, `check_new_item`, `like` | Server-backed | Uses server `last_id`, page size 20, pull-down refresh, load-more, and new-items reload button. Existing accounts verified empty-feed state. |
| Post detail | `/post/[id]` | `get_post`, `like`, `get_comment`, `set_comment`, `edit_post`, `delete_post`, `report_post` | Server-backed | Owner HV edit/delete and non-owner report actions are present. Edit UI supports text plus optional two-video replacement validation. |
| Create post / submit exercise | `/post/create` | `add_post` | Server-backed | Server mode requires exactly two real videos >=10s with similar durations. Demo placeholders are local/dev only. |
| Comments | `/comment/[postId]` and post detail | `get_comment`, `set_comment` | Server-backed | Comment input hides when `can_comment=false`; 500-char limit. |
| Search | `/(tabs)/search` | `search`, `get_saved_search`, `del_saved_search` | Server-backed compact UI | Supports profile search via `user_id`; saved search delete is present. |
| Courses / enrollment | `/(tabs)/courses` | `get_list_courses_of_student`, `get_list_students`, `get_requested_enrollment`, `set_request_course`, `set_approve_enrollment` | Server-backed compact UI | Student request state is now pending/requested until backend approval; teacher accept/reject controls are present. |
| Profile menu | `/(tabs)/profile` | `get_user_info`, `logout` | Server-backed | Shows user/source and links to settings/search/chat. |
| Edit profile | `/settings/profile-edit` | `get_user_info`, `set_user_info` | Server-backed | Uses documented `user_name`, `avatar`, `cover_image` fields. |
| Push settings | `/settings/push` | `get_push_settings`, `set_push_settings` | Server-backed | Settings groups are compact and defensive. |
| Change password | `/settings/change-password` | `change_password` | Server-backed | Safe error handling. |
| Device/version | `/settings` | `set_devtoken`, `check_new_version` | Server-backed | Device token also runs after server auth. |
| Blocks | `/settings/blocks` | `get_list_blocks`, `set_block` | Server-backed | Deduped block list, blurred avatars, block/unblock. |
| Notifications | `/(tabs)/notifications` | `get_notification`, `set_read_notification` | Server-backed | Normalizes notification id/type/object/group/read/badge/last_update; unread badge uses 99+ cap; pull-down and load-more. |
| Conversations | `/chat`, `/chat/[id]` | `get_list_conversation`, `get_conversation`, `set_read_message`, `delete_message`, `delete_conversation` | Server-backed | Composer is hidden/disabled in server mode because the 40-API list has no send-message endpoint. |
| Logout | Profile menu | `logout` | Server-backed best effort | Local session clears even if backend logout cannot be verified. |

## Remaining UI Depth After This Pass

- Full native media duration validation should be verified on physical devices.
- Real object-level post/course/notification/conversation flows need server accounts with actual course, exercise, post, notification, and conversation objects.
- Notification cache can be deepened if the slide deck requires persistent disk caching beyond screen state.
- Full client-side scoring remains a separate project-completeness gap unless the course accepts server scoring as authoritative.
