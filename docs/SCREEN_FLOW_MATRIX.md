# Screen Flow Matrix

| Flow | Route/screen | Server APIs used | Status | Notes |
|---|---|---|---|---|
| Login | `/(auth)/login` | `login` | Server-first | Demo buttons are explicit local shortcuts |
| Signup start/profile/birthday/terms | `/(auth)/*` | `signup`, `get_verify_code`, `check_verify_code`, `change_info_after_signup` | Partial server-backed | Real backend verification code not confirmed |
| Session resume | `src/app/_layout.jsx` | Stored token/session | Partial | Invalid-token global redirect still needs centralized handling |
| Home feed | `/(tabs)/home` | `get_list_posts` | Server-backed | Pull-to-refresh exists through screen reload; load-more is still limited |
| Post detail | `/post/[id]` | `get_post`, `like`, `get_comment`, `set_comment` | Server-backed | Falls back only in auto/local developer modes |
| Add exercise submission | `/post/create` | `add_post` | Server-backed best effort | Real two-video multipart supported; demo placeholders local only |
| Edit/delete/report post | Repository only | `edit_post`, `delete_post`, `report_post` | Partial | Need final action menus on post/detail screens |
| Comments | `/comment/[postId]` and post detail | `get_comment`, `set_comment` | Server-backed | Local comments remain for local demo posts |
| Search | `/(tabs)/search` | `search`, `get_saved_search`, `del_saved_search` | Partial | Search uses server; saved search UI is minimal/follow-up |
| Courses | `/(tabs)/courses` | `get_list_courses_of_student`, `get_list_students`, `get_requested_enrollment`, `set_request_course` | Server-backed partial | Teacher approval is repository-ready but not a full teacher dashboard |
| Enrollment approval | Course repository | `set_approve_enrollment` | Partial | Needs teacher-specific request management UI |
| Profile | `/(tabs)/profile` | `get_user_info`, `logout` | Server-backed | Shows server/local source label |
| Edit profile | `/settings/profile-edit` | `get_user_info`, `set_user_info` | Server-backed | Added in this pass |
| Push settings | `/settings/push` | `get_push_settings`, `set_push_settings` | Server-backed | Added in this pass |
| Change password | `/settings/change-password` | `change_password` | Server-backed | Added in this pass |
| Device/version | `/settings` | `set_devtoken`, `check_new_version` | Server-backed | Added in this pass |
| Blocks | `/settings/blocks` | `get_list_blocks`, `set_block` | Server-backed | Added in this pass |
| Notifications | `/(tabs)/notifications` | `get_notification`, `set_read_notification` | Server-backed | Tap marks read |
| Conversations | `/chat`, `/chat/[id]` | `get_list_conversation`, `get_conversation`, `set_read_message`, `delete_message`, `delete_conversation` | Server-backed partial | No send-message API in the 40-API list; send action remains local-only |
| Check new item | Repository | `check_new_item` | Partial | Needs full feed refresh/cache integration |
| Logout | Profile menu | `logout` | Server-backed best effort | Local session clears even if backend logout fails |

## Missing Or Incomplete UI Depth

- Full teacher enrollment approval dashboard.
- Final post action menu for edit/delete/report.
- Saved search management UI.
- Global invalid-token interceptor that clears session and redirects.
- Full pull-up pagination/cache reconciliation using authoritative backend cursors.
- Real client-side pose scoring beyond preserving/displaying server fields.
