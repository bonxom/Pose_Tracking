# IT4788 Source Of Truth

Status date: 2026-05-14

This repository follows the IT4788 weekly requirement slides / course specification as the product source of truth. Existing frontend mock behavior and deployed-backend quirks are implementation evidence only. If the deployed backend differs from the slides, the mismatch is tracked in `docs/BACKEND_MISMATCHES.md` and any compatibility behavior must stay isolated.

`restful_api.xlsx` is intentionally not used because it appears to describe a different Mercari/product project.

## Product Purpose

The app is a React Native / Expo social learning system for `Tap dong tac dieu binh dieu hanh`. It combines a Facebook-style mobile feed with marching/parade course enrollment, teacher standard exercise posts, student two-video submissions, comments, likes, notifications, conversations, blocks, settings, and scoring/pose feedback.

## Roles And Course Rules

- `GV`: teacher/lecturer. A teacher owns one course.
- `HV`: student. A student can join multiple courses.
- GV creates standard exercise posts for their course.
- HV creates exercise submission posts tied to `course_id` and `exercise_id`.
- GV/HV relation can be affected by course enrollment, approval, and block actions.
- HV can edit/delete their own posts according to the stated role rules; non-owners report posts.

## Auth And Profile Rules

- Real product flow starts from `signup`, `get_verify_code`, `check_verify_code`, `change_info_after_signup`, then `login`.
- Signup uses `phonenumber`, `password`, `uuid`, and `role` (`GV` or `HV`) in the known contract.
- Phone validation observed in deployed backend: 10 digits and starts with `0`.
- Verification may require manual SMS/OTP; the app must provide an input flow and E2E runbook continuation.
- Invalid/stale token and blocked-account responses must clear session/cache and redirect to login.
- `set_user_info` follows the slide contract: `token`, `user_name`, `avatar`, `cover_image`.

## Post, Video, And Scoring Rules

- Valid posts require exactly two videos.
- Each video must be at least 10 seconds.
- The two video durations should be similar; the frontend currently validates with a practical rule: max difference is 3 seconds or 20% of the longer video, whichever is larger.
- Server mode never uploads demo/mock placeholders.
- Web upload must support actual browser `File`/`Blob` objects; native upload must support React Native file objects.
- HV submissions include `course_id` and `exercise_id`.
- Teacher posts may expose `time_series_poses` for grading/scoring.
- The app and server both participate in scoring in the full project. Local fake score comments are local/dev-only and must not be shown as real server scoring in server mode.
- Authoritative server scoring/pose fields must be preserved and displayed when returned.

## Feed, Cache, And Refresh Rules

- `get_list_posts` uses `token`, `index`, `count`, `last_id`, and optional `category_id`.
- Default page size is 20.
- The client must use server-provided `last_id` and must not derive authoritative cursors from rendered UI posts.
- Pull-down refresh and pull-up load-more are required.
- `check_new_item` drives the new-items UX. When `new_items > 0`, the UI shows a floating/new-items reload affordance.
- Feed malformed-data handling:
  - invalid/missing author id: drop the post from the feed.
  - invalid described/content and invalid media together: drop the post.
  - invalid like/comment/is_liked: default safely.
  - invalid/false `can_comment`: hide comment input.
- Cache reconciliation is currently implemented for the Home feed path only.

## Comment Rules

- Comments are text/link/emoticon only.
- The frontend limits comments to 500 characters and strips control characters before sending.
- Comment input is hidden when `can_comment` is false/invalid.

## Search And Profile Rules

- Search is server-backed and supports navigation to results.
- Saved search history uses `get_saved_search` and `del_saved_search`.
- Profile search uses `search` with `user_id`.
- Profile view uses `get_user_info`; profile edit uses `set_user_info`.

## Course, Enrollment, And Block Rules

- `get_list_courses_of_student` uses `token` and `user_id`.
- `get_list_blocks` uses `token`, `index`, `count`, and `user_id`.
- `set_approve_enrollment` uses `token`, `user_id`, and `is_accept`.
- `set_request_course` should request course membership; deployed field details must be verified with valid accounts.
- Sending a course request must not mark an HV as enrolled until GV approval is confirmed; the intermediate UI state is pending/requested.
- Teacher sees pending enrollment requests and accepts/rejects them.
- Block list must de-duplicate users and support block/unblock.

## Notification Rules

- `get_notification` includes `notification_id`, `type`, `object_id`, `title`, `created`, `avatar`, `group`, `read`, `badge`, and `last_update`.
- Notification list supports read/unread state, badges, pull-down refresh, pull-up pagination, and navigation by `type`/`object_id`/`group`.
- Badge display should cap large counts at `99+` while preserving the raw server value internally when returned.
- `set_read_notification` marks a notification read.
- Notification cache behavior should follow the weekly slides; the current app normalizes these fields and keeps screen-level state.

## Conversation Rules

- The 40-API list includes conversation list/detail/read/delete flows.
- No `send_message` API exists in the authoritative 40-API list. The app must not present local send-message behavior as a real server product feature in server mode.

## Settings And Device Rules

- Push settings use `get_push_settings` and `set_push_settings`.
- Password change uses `change_password`.
- Version checks use `check_new_version`.
- Device token registration uses `set_devtoken` in auth/session lifecycle paths, not only as a manual debug button.

## Authoritative 40 APIs

1. `login`
2. `logout`
3. `signup`
4. `get_verify_code`
5. `check_verify_code`
6. `change_info_after_signup`
7. `get_list_posts`
8. `get_post`
9. `add_post`
10. `edit_post`
11. `delete_post`
12. `get_comment`
13. `set_comment`
14. `report_post`
15. `like`
16. `search`
17. `get_saved_search`
18. `del_saved_search`
19. `get_list_students`
20. `get_user_info`
21. `set_user_info`
22. `get_list_courses_of_student`
23. `get_list_blocks`
24. `set_block`
25. `set_approve_enrollment`
26. `get_requested_enrollment`
27. `set_request_course`
28. `get_push_settings`
29. `set_push_settings`
30. `change_password`
31. `check_new_version`
32. `set_devtoken`
33. `get_conversation`
34. `delete_message`
35. `get_list_conversation`
36. `delete_conversation`
37. `check_new_item`
38. `get_notification`
39. `set_read_message`
40. `set_read_notification`

## Product Mode

The normal product path is server-authoritative. `EXPO_PUBLIC_DATA_SOURCE=server` is the default. `auto` and `local` remain available only for development/emergency fallback, and local demo shortcuts are visually separated from real backend auth.
