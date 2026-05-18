# IT4788 Source Of Truth

Tài liệu này tóm tắt source-of-truth từ bộ slide/spec IT4788. Nếu deployed backend khác spec, coi đó là backend mismatch và ghi vào `docs/BACKEND_MISMATCHES.md`.

## Mục đích app

Ứng dụng mobile social learning cho học phần/lớp luyện tập “Tập động tác diễu binh diễu hành”. Sản phẩm giống mạng xã hội mobile kiểu Facebook nhưng phục vụ course/training, post video, comment, notification, chat và chấm/đánh giá tư thế.

## Vai trò

- `GV`: giảng viên/teacher. Theo mô hình course, GV sở hữu một course.
- `HV`: học viên/student. HV có thể tham gia nhiều course.

## Course và exercise

- Rule spec/team hiện tại: `course_id` có thể là teacher/GV id.
- Backend team mới nói không có entity `exercise` riêng.
- Về UI/product, “exercise” nên được hiểu là teacher standard post hoặc exercise-like teacher post trong backend mode.
- Mock mode có thể giữ `exerciseId` ổn định bằng teacher post id để UI dễ link.
- Nếu deployed backend vẫn yêu cầu `exercise_id`, ghi mismatch, không che giấu bằng fake success trong backend mode.

## Post và video

- Post hợp lệ cần 2 video.
- Mỗi video tối thiểu 10 giây.
- Hai video nên có duration tương tự nhau.
- HV submission phải có `course_id`; `exercise_id` chỉ gửi khi backend/spec yêu cầu hoặc có dữ liệu.
- Teacher post có thể expose `time_series_poses` phục vụ grading.
- HV có thể edit/delete post của mình theo role-specific rules; GV không edit/delete theo cùng cách nếu spec giới hạn.
- Comment giới hạn độ dài, chỉ text/link/emoticon.

## Feed/cache/refresh

- Feed dùng server `last_id`, `index`, `count`, `new_items`.
- Client không tự suy diễn authoritative `last_id` từ rendered UI items.
- Pull-down refresh và pull-up load more phải được hỗ trợ.
- `check_new_item` hiển thị floating/new-items button khi có item mới.
- Data malformed xử lý defensive:
  - author id invalid: drop post
  - described invalid và media invalid cùng lúc: drop post
  - like/comment/is_liked invalid: default an toàn
  - can_comment invalid/false: ẩn comment input

## Notification/chat

- Notification fields theo slide: `notification_id`, `type`, `object_id`, `title`, `created`, `avatar`, `group`, `read`, `badge`, `last_update`.
- Badge nên cap dạng `99+` nếu vượt ngưỡng.
- Notification cần cache/refresh/load-more theo slide.
- Chat/conversation APIs có list/detail/read/delete. Danh sách 40 API không có `send_message`, nên server mode không được trình bày composer send như tính năng thật nếu backend chưa bổ sung API.

## Danh sách 40 API gốc

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

## API từ slide mới hơn

Slide mới có vẻ nhắc friend/user-social như `get_user_friends`. Vì source-of-truth có thể được cập nhật theo tuần, không giả định danh sách 40 API cũ là cuối cùng. Probe hiện tại cho thấy:

- `get_user_friends`: deployed 404
- `get_list_friends`: deployed 404
- `get_friends`: deployed 404

Nếu backend team xác nhận endpoint friend chính thức, cần bổ sung wrapper/repository/mock/Postman và cập nhật ma trận.
