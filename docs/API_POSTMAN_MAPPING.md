# API Postman Mapping

Status date: 2026-05-18

| API | Frontend wrapper / repository | Postman request | Known mismatch / workaround | Verification status |
|---|---|---|---|---|
| login | backendApi.login / loginWithPassword | Auth / HV Login, Auth / GV Login | Deployed requires devtoken | Verified with real HV/GV over HTTPS |
| logout | backendApi.logout / logoutSession | Auth / Logout | None | Verified with HV token |
| signup | backendApi.signup / signup flow | Auth / Signup | Needs fresh phone/OTP | Manual-blocked |
| get_verify_code | backendApi.getVerifyCode | Auth / Get Verify Code | Needs fresh phone | Manual-blocked |
| check_verify_code | backendApi.checkVerifyCode | Auth / Check Verify Code | Field contract still runtime-sensitive | Manual-blocked |
| change_info_after_signup | backendApi.changeInfoAfterSignup | Auth / Change Info After Signup | Deployed rejects user_name in probe | Mismatch |
| get_list_posts | backendApi.getListPosts / getFeedPage | Feed / Posts / Get List Posts | Form-urlencoded string params | Verified empty |
| get_post | backendApi.getPost / getPostById | Feed / Posts / Get Post | Needs postId | Data-blocked |
| add_post | backendApi.addPost / createPost | Feed / Posts / Add Post Multipart variants | Multipart with `device_slave`; `courseId` may be `teacherId`; no-exercise variants included | Backend-blocked: all tested real-file field names returned `Unexpected field`; HV metadata-only control still requires `exercise_id` |
| edit_post | backendApi.editPostMultipart / editPost | Feed / Posts / Edit Post Multipart | Multipart for video replacement | Data-blocked |
| delete_post | backendApi.deletePost / deletePost | Feed / Posts / Delete Post | Deployed 404 | Backend-blocked |
| get_comment | backendApi.getComment / getComments | Comments / Likes / Reports / Get Comment | Needs postId | Data-blocked |
| set_comment | backendApi.setComment / addComment | Comments / Likes / Reports / Set Comment | Form-urlencoded with index/count | Data-blocked |
| report_post | backendApi.reportPost / reportPost | Comments / Likes / Reports / Report Post | Needs postId | Data-blocked |
| like | backendApi.like / toggleLike | Comments / Likes / Reports / Like | Deployed 404 | Backend-blocked |
| search | backendApi.search / searchPosts | Search / Search | Frontend includes user_id | Verified empty |
| get_saved_search | backendApi.getSavedSearch / getSavedSearches | Search / Get Saved Search | None | Verified |
| del_saved_search | backendApi.delSavedSearch / deleteSavedSearch | Search / Delete Saved Search | Destructive, not run by default | Not run |
| get_list_students | backendApi.getListStudents / getCourseStudents | Courses / Enrollment / Get List Students | HV may get Not access | GV empty verified |
| get_user_info | backendApi.getUserInfo / getUserInfo | Profile / Users / Get User Info | Deployed rejects user_id; retry without | Compatibility verified |
| set_user_info | backendApi.setUserInfo / updateUserInfo | Profile / Users / Set User Info | Spec user_name/avatar/cover_image | Not mutated |
| get_list_courses_of_student | backendApi.getListCoursesOfStudent / getStudentCourses | Courses / Enrollment / Get List Courses Of Student | Sends user_id plus pagination compatibility | Latest HV/GV empty verified; earlier HV run returned backend `1001` |
| get_list_blocks | backendApi.getListBlocks / getBlocks | Blocks / Get List Blocks | Requires user_id | Verified |
| set_block | backendApi.setBlock / setBlock | Blocks / Set Block | Destructive/shared accounts | Not run |
| set_approve_enrollment | backendApi.setApproveEnrollment / approveEnrollment | Courses / Enrollment / Set Approve Enrollment | Needs pending request | Data-blocked |
| get_requested_enrollment | backendApi.getRequestedEnrollment / getRequestedEnrollments | Courses / Enrollment / Get Requested Enrollment | GV only | GV empty verified |
| set_request_course | backendApi.setRequestCourse / requestCourse | Courses / Enrollment / Set Request Course | courseId may equal teacherId/GV id; exerciseId not involved | Data-blocked |
| get_push_settings | backendApi.getPushSettings / getPushSettings | Settings / Device / Get Push Settings | None | Verified |
| set_push_settings | backendApi.setPushSettings / setPushSettings | Settings / Device / Set Push Settings | Mutation not run | Not run |
| change_password | backendApi.changePassword / changePassword | Settings / Device / Change Password | Destructive | Not run |
| check_new_version | backendApi.checkNewVersion / checkNewVersion | Settings / Device / Check New Version | last_update mismatch; retry lastUpdate | Compatibility verified |
| set_devtoken | backendApi.setDevtoken / setDeviceToken | Settings / Device / Set Devtoken | Numeric devtype | Verified |
| get_conversation | backendApi.getConversation / getConversation | Conversations / Get Conversation | Needs conversationId | Data-blocked |
| delete_message | backendApi.deleteMessage / deleteMessage | Conversations / Delete Message | Destructive | Data-blocked |
| get_list_conversation | backendApi.getListConversation / getConversationList | Conversations / Get List Conversation | None | Verified |
| delete_conversation | backendApi.deleteConversation / deleteConversation | Conversations / Delete Conversation | Destructive | Data-blocked |
| check_new_item | backendApi.checkNewItem / checkNewItems | Feed / Posts / Check New Item | token mismatch; retry without token | Compatibility verified |
| get_notification | backendApi.getNotification / getNotificationPage | Notifications / Get Notification | last_update mismatch; retry without | Compatibility verified |
| set_read_message | backendApi.setReadMessage / markConversationRead | Conversations / Set Read Message | Needs conversationId | Data-blocked |
| set_read_notification | backendApi.setReadNotification / markNotificationRead | Notifications / Set Read Notification | Needs notificationId | Data-blocked |
