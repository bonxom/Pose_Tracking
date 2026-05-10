# IT4788 Source Of Truth

This document is the repository-local implementation summary for the IT4788 marching/parade pose-training social app. It is distilled from the current project direction and the IT4788 40-API contract named in the task brief. The course weekly decks/slides remain the external authority; if those files are later added to this repo, this document should be reconciled against them.

`restful_api.xlsx` is not used as a source of truth for this app because it appears to describe a different Mercari/product project.

## Product Purpose

The app is a mobile social learning system for `Tập động tác diễu binh diễu hành`. It combines a Facebook-style feed with course enrollment, teacher exercise posts, student two-video exercise submissions, comments, likes, notifications, chat, and scoring/pose feedback.

## Roles And Course Rules

- `GV`: teacher/lecturer. A teacher owns one course and publishes standard exercise posts.
- `HV`: student. A student can join multiple courses and submit exercise videos.
- One teacher has one course.
- One student can enroll in many courses.
- Teacher standard posts define exercise requirements and may include `time_series_poses`.
- Student posts are exercise submissions and must include `course_id`, `exercise_id`, and two videos.
- Social behavior includes feed viewing, post detail, comments, likes, reports, search, saved search, notifications, blocks, and conversations.

## Video And Scoring Rules

- A valid exercise submission requires two videos, typically two camera angles.
- HV submissions must include course and exercise metadata.
- The app must preserve server-authoritative scoring/pose fields when the backend returns them.
- Local score simulation is development-only fallback and must not be presented as real server grading in server mode.
- Full client-side scoring remains a separate project-completeness item unless an authoritative backend result is returned.

## Feed And Cache Rules

- Feed uses `index`, `count`, and `last_id` from the backend contract.
- Pull-down refresh and pull-up load-more are required app behaviors.
- The client must not derive authoritative `last_id` from arbitrary rendered UI state.
- Malformed backend payloads should be filtered or defaulted defensively.
- Invalid or stale token responses should clear session and return the user to login.

## Notification And Chat Rules

- Notifications are server-backed and support read state.
- Chat/conversation lists and message read/delete flows are server-backed HTTP flows where available.
- Push settings, `set_devtoken`, and version checks are part of the client responsibility even if Firebase/native delivery is incomplete.

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

## Implementation Posture

The normal product path is server-authoritative. `EXPO_PUBLIC_DATA_SOURCE=server` is the default. `local` mode remains available for development/emergency fallback and visible demo shortcuts, but local behavior is not proof of backend completion.
