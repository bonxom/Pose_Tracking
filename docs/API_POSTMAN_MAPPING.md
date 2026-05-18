# Mapping API Và Postman

Ngày cập nhật: 2026-05-18

| API | Frontend wrapper / repository | Postman request | Mismatch / workaround đã biết | Trạng thái xác minh |
|---|---|---|---|---|
| login | backendApi.login / loginWithPassword | Auth / HV Login, Auth / GV Login | Deployed cần `devtoken` | Đã xác minh HV/GV qua HTTPS |
| logout | backendApi.logout / logoutSession | Auth / Logout | Không có | Đã xác minh với HV token |
| signup | backendApi.signup / signup flow | Auth / Signup | Cần phone/OTP mới | Manual-blocked |
| get_verify_code | backendApi.getVerifyCode | Auth / Get Verify Code | Cần phone mới | Manual-blocked |
| check_verify_code | backendApi.checkVerifyCode | Auth / Check Verify Code | Field contract còn runtime-sensitive | Manual-blocked |
| change_info_after_signup | backendApi.changeInfoAfterSignup | Auth / Change Info After Signup | Deployed reject `user_name` trong probe | Mismatch |
| get_list_posts | backendApi.getListPosts / getFeedPage | Feed / Posts / Get List Posts | Form-urlencoded string params | Verified empty |
| get_post | backendApi.getPost / getPostById | Feed / Posts / Get Post | Cần `postId` | Data-blocked |
| add_post | backendApi.addPost / createPost | Feed / Posts / Add Post Multipart variants | Multipart với `device_slave`; `courseId` có thể là `teacherId`; có no-exercise variants | Backend-blocked: file fields bị `Unexpected field`; HV metadata-only vẫn đòi `exercise_id` |
| edit_post | backendApi.editPostMultipart / editPost | Feed / Posts / Edit Post Multipart | Multipart cho video replacement | Data-blocked |
| delete_post | backendApi.deletePost / deletePost | Feed / Posts / Delete Post | Deployed 404 | Backend-blocked |
| get_comment | backendApi.getComment / getComments | Comments / Likes / Reports / Get Comment | Cần `postId` | Data-blocked |
| set_comment | backendApi.setComment / addComment | Comments / Likes / Reports / Set Comment | Form-urlencoded với index/count | Data-blocked |
| report_post | backendApi.reportPost / reportPost | Comments / Likes / Reports / Report Post | Cần `postId` | Data-blocked |
| like | backendApi.like / toggleLike | Comments / Likes / Reports / Like | Deployed 404 | Backend-blocked |
| search | backendApi.search / searchPosts | Search / Search | Frontend gửi `user_id` | Verified empty |
| get_saved_search | backendApi.getSavedSearch / getSavedSearches | Search / Get Saved Search | Không có | Verified |
| del_saved_search | backendApi.delSavedSearch / deleteSavedSearch | Search / Delete Saved Search | Destructive, không chạy mặc định | Not run |
| get_list_students | backendApi.getListStudents / getCourseStudents | Courses / Enrollment / Get List Students | HV có thể `Not access` | GV empty verified |
| get_user_info | backendApi.getUserInfo / getUserInfo | Profile / Users / Get User Info | Deployed reject `user_id`; retry không có field | Compatibility verified |
| set_user_info | backendApi.setUserInfo / updateUserInfo | Profile / Users / Set User Info | Spec `user_name/avatar/cover_image` | Not mutated |
| get_list_courses_of_student | backendApi.getListCoursesOfStudent / getStudentCourses | Courses / Enrollment / Get List Courses Of Student | Gửi `user_id` + pagination compatibility | Latest HV/GV empty verified; từng có backend `1001` |
| get_list_blocks | backendApi.getListBlocks / getBlocks | Blocks / Get List Blocks | Cần `user_id` | Verified |
| set_block | backendApi.setBlock / setBlock | Blocks / Set Block | Destructive/shared accounts | Not run |
| set_approve_enrollment | backendApi.setApproveEnrollment / approveEnrollment | Courses / Enrollment / Set Approve Enrollment | Cần pending request | Data-blocked |
| get_requested_enrollment | backendApi.getRequestedEnrollment / getRequestedEnrollments | Courses / Enrollment / Get Requested Enrollment | GV only | GV empty verified |
| set_request_course | backendApi.setRequestCourse / requestCourse | Courses / Enrollment / Set Request Course | `courseId` có thể bằng teacherId/GV id | Data-blocked |
| get_push_settings | backendApi.getPushSettings / getPushSettings | Settings / Device / Get Push Settings | Không có | Verified |
| set_push_settings | backendApi.setPushSettings / setPushSettings | Settings / Device / Set Push Settings | Mutation chưa chạy | Not run |
| change_password | backendApi.changePassword / changePassword | Settings / Device / Change Password | Destructive | Not run |
| check_new_version | backendApi.checkNewVersion / checkNewVersion | Settings / Device / Check New Version | `last_update` mismatch; retry `lastUpdate` | Compatibility verified |
| set_devtoken | backendApi.setDevtoken / setDeviceToken | Settings / Device / Set Devtoken | Numeric `devtype` | Verified |
| get_conversation | backendApi.getConversation / getConversation | Conversations / Get Conversation | Cần `conversationId` | Data-blocked |
| delete_message | backendApi.deleteMessage / deleteMessage | Conversations / Delete Message | Destructive | Data-blocked |
| get_list_conversation | backendApi.getListConversation / getConversationList | Conversations / Get List Conversation | Không có | Verified |
| delete_conversation | backendApi.deleteConversation / deleteConversation | Conversations / Delete Conversation | Destructive | Data-blocked |
| check_new_item | backendApi.checkNewItem / checkNewItems | Feed / Posts / Check New Item | token mismatch; retry không token | Compatibility verified |
| get_notification | backendApi.getNotification / getNotificationPage | Notifications / Get Notification | `last_update` mismatch; retry không có field | Compatibility verified |
| set_read_message | backendApi.setReadMessage / markConversationRead | Conversations / Set Read Message | Cần `conversationId` | Data-blocked |
| set_read_notification | backendApi.setReadNotification / markNotificationRead | Notifications / Set Read Notification | Cần `notificationId` | Data-blocked |

## Mapping candidate Friend / User-Social

Slide mới có vẻ có friend/user-social ngoài danh sách 40 API cũ. Các request này phục vụ thảo luận backend và route probing.

| Candidate API | Frontend wrapper / repository | Postman request | Mismatch / workaround | Trạng thái xác minh |
|---|---|---|---|---|
| get_user_friends | none; probe-only | Friends / User Social / Get User Friends Candidate | Deployed route 404 | Backend-blocked |
| get_list_friends | none; probe-only | Friends / User Social / Get List Friends Candidate | Deployed route 404 | Backend-blocked |
| get_friends | none; probe-only | Friends / User Social / Get Friends Candidate | Deployed route 404 | Backend-blocked |
| search users | backendApi.search / searchPosts | Friends / User Social / Search User Via Search API | Dùng `search` khi chưa có friend API | Existing search verified empty |
| get user info | backendApi.getUserInfo / getUserInfo | Friends / User Social / Get User Info For Friend Candidate | Deployed reject `user_id`; frontend retry | Compatibility verified |
| set_block | backendApi.setBlock / setBlock | Friends / User Social / Block User From Friends Context | Existing block API hỗ trợ safety actions | Not run |
| friend mutations | none; probe-only | Friends / User Social / Friend Mutation Candidate - disabled guidance | Chỉ probe với `PROBE_FRIEND_MUTATIONS=1` và dữ liệu test được backend duyệt | Not run |
