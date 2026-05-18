# Bàn Giao API Cho UI Team

Ngày cập nhật: 2026-05-18

Dự án giữ điều hướng Facebook-like 4 section do leader chọn:

- Home
- Friends
- Notifications
- Profile

Các tính năng có API không bắt buộc phải là tab top-level. UI team có thể đặt Search, Courses, Enrollment, Upload, Chat, Blocks, Settings ở nơi phù hợp với thiết kế sản phẩm.

## Quy tắc cho UI screens

- Không gọi raw `fetch` trực tiếp trong screen.
- Gọi repository trong `src/repositories/*`.
- Payload đặc thù backend và normalize response phải nằm trong API/repository layer.
- Trong catch block, dùng `redirectIfSessionExpired(error, router)` để xử lý token hết hạn.
- Ở `backend mode`, không giả lập thành công khi backend lỗi; hiển thị lỗi thân thiện.
- `mock mode` chỉ dùng cho phát triển UI/demo fallback và nên được hiểu là chế độ riêng.

## API Mode Switch

```bash
EXPO_PUBLIC_API_TYPE=backend # mặc định, gọi backend thật
EXPO_PUBLIC_API_TYPE=mock    # repository mock/local, không gọi backend
```

`API_TYPE=mock|backend` là alias tiện cho Docker `up` nếu môi trường hỗ trợ. Biến cũ `EXPO_PUBLIC_DATA_SOURCE=server|local|auto` vẫn hoạt động, nhưng UI mới nên dùng `EXPO_PUBLIC_API_TYPE`.

### Mức độ hoàn chỉnh của mock mode

`mock mode` là stateful mock, không chỉ là seed data tĩnh:

- auth hỗ trợ signup, OTP mock cố định, complete profile, login, logout
- feed/posts hỗ trợ pagination, create/edit/delete/report local, like, comment, saved search, new-item count
- courses/enrollment hỗ trợ pending request và approve state
- profile/settings hỗ trợ edit profile, push settings, đổi mật khẩu local, set device token
- notifications hỗ trợ pagination, read state, unread count, nhãn `99+`
- blocks/conversations hỗ trợ block/unblock, read, delete message, delete conversation, local-only send

API client sẽ ném lỗi `MOCK_MODE_BACKEND_DISABLED` nếu có code path cố gọi backend thật trong `EXPO_PUBLIC_API_TYPE=mock`.

Helper ở `src/repositories/source.js`:

- `getApiType()`
- `isBackendMode()`
- `isMockMode()`
- `getDataSourceLabel(source)`

## Route hiện tại sau thay đổi navigation

| Khu vực | Route hiện tại | Ghi chú |
|---|---|---|
| Home feed | `/(tabs)/home` | Top-tab Home, gọi post repository. |
| Friends | `/(tabs)/friends` | UI shell. Mock có friend/user rows; backend chưa xác nhận friend route nên dùng search/user/block repositories. |
| Notifications | `/(tabs)/notifications` | Top-tab Notifications, gọi notification repository. |
| Profile | `/(tabs)/profile` | Top-tab Profile, gọi user/auth repositories và link sang supporting screens. |
| Search | `/search` | Route non-tab, mở từ action search của Home/Friends/Profile. |
| Courses | `/courses` | Route non-tab, mở từ Profile hoặc notification target. |
| Upload/create | `/post/create` | Dùng post repository. Server mode cần đúng 2 video thật. |
| Chat | `/chat`, `/chat/[id]` | Dùng conversation repository. Composer chỉ local/dev vì spec 40 API không có send API. |
| Settings | `/settings/*` | Dùng settings, user, block repositories. |

## Repository map

### Auth

File: `src/repositories/authRepository.js`

| Function | UI dùng ở đâu | Input | Output |
|---|---|---|---|
| `loginWithPassword(phonenumber, password)` | Login form | phone/password | Session normalize `{ id, token, username, role, phonenumber, source }` |
| `logoutSession(session)` | Logout button | session hiện tại | Best-effort backend logout |
| `loginDemoStudent()`, `loginDemoTeacher()` | Developer fallback only | none | Local demo session |

Đã xác minh: HV/GV login và logout thật thành công qua HTTPS với credential truyền bằng env vars.

### Feed, Posts, Search, Upload

File: `src/repositories/postRepository.js`

| Function | UI dùng ở đâu | Input | Output |
|---|---|---|---|
| `getFeedPage({ index, count, lastId })` | Home feed, refresh, load more | pagination params | `{ items, hasMore, lastId, newItems, sourceLabel }` |
| `checkNewItems(lastId)` | Home new-items polling | server `lastId` | `{ count }` |
| `getPostById(postId)` | Post detail | post id | normalized `Post` |
| `toggleLike(post)` | Like button | normalized post | updated normalized `Post` |
| `searchPosts(query, { userId })` | Search UI, profile search | keyword/user id | list post normalize |
| `getSavedSearches()` | Search history | none | saved search list |
| `deleteSavedSearch(searchId)` | Xóa search history | search id | backend result |
| `createPost(params)` | Post/create, submission | content, `courseId`, optional `exerciseId`, videos | created/normalized post |
| `editPost(post, params)` | Owner HV edit | described/videos | updated post |
| `deletePost(post)` | Owner HV delete | post | backend result |
| `reportPost(post, reason)` | Non-owner report | post/reason | backend result |

Normalized `Post` shape:

```js
{
  id,
  content,
  createdAt,
  author: { id, name, avatar, role, online },
  videos,
  likeCount,
  commentCount,
  isLiked,
  canComment,
  canEdit,
  canSubmit,
  courseId,
  exerciseId,
  timeSeriesPoses,
}
```

Ghi chú backend: team nói `courseId` bằng teacher/GV id và không có backend exercise entity riêng. Trong backend mode, coi teacher post có `courseId` như exercise-like object. Trong mock mode, `exerciseId` là teacher exercise post id để UI có key ổn định. Adapter chỉ gửi `exercise_id` khi có dữ liệu.

Đã xác minh: feed/search empty state và saved-search list. Backend-blocked: upload thật bị reject mọi field name multipart đã thử với `Unexpected field`; deployed `/like` và `/delete_post` trả 404.

### Comments

File: `src/repositories/commentRepository.js`

| Function | UI dùng ở đâu | Input | Output |
|---|---|---|---|
| `getComments(postOrId, { index, count })` | Comment list | post/id + pagination | normalized comments |
| `addComment(postOrId, commentText, extra)` | Comment composer | post/id + text | normalized comment/result |

Comment UI cần ẩn composer khi `post.canComment === false`.

### Courses và Enrollment

File: `src/repositories/courseRepository.js`

| Function | UI dùng ở đâu | Output / behavior |
|---|---|---|
| `getCurrentCourse()` | Course overview | normalized current course |
| `getStudentCourses({ userId })` | Student courses | course list |
| `getCourseExercises()` | Course exercises | teacher exercise posts |
| `getCourseStudents()` | Teacher student list | users |
| `getRequestedEnrollments()` | Teacher pending approvals | users/requests |
| `requestCourse(courseId)` | HV request join | trả `requested`, chưa enrolled |
| `approveEnrollment(requestId, isApproved)` | GV approve/reject | backend result |

Trạng thái UI quan trọng: sau `requestCourse`, hiển thị pending/requested cho tới khi GV approve thật. Theo backend team, `courseId` bằng teacher/GV id và không có exercise entity riêng; dùng teacher post như exercise-like record trong backend-backed UI.

Đã xác minh: latest HV/GV course-list trả empty state sạch. Có lần HV trước đó trả `1001 Can not connect to DB`, nên vẫn cần error state rõ ràng.

### Notifications

File: `src/repositories/notificationRepository.js`

| Function | UI dùng ở đâu | Output |
|---|---|---|
| `getNotificationPage({ index, count, lastUpdate })` | Notification list, refresh, load-more | `{ items, hasMore, lastUpdate }` |
| `markNotificationRead(notificationId)` | Tap notification | backend result |

Normalized notification fields: `id`, `notificationId`, `type`, `targetType`, `targetId`, `objectId`, `title`, `body`, `createdAt`, `avatar`, `group`, `unread`, `badge`, `lastUpdate`.

Đã xác minh: notification list qua compatibility retry. Data-blocked: chưa có notification id thật để xác minh read-state.

### Profile và Users

File: `src/repositories/userRepository.js`

| Function | UI dùng ở đâu | Input | Output |
|---|---|---|---|
| `getUserInfo(userId)` | Profile/menu/edit profile | optional user id | normalized session/user |
| `updateUserInfo({ userName, avatar, coverImage })` | Edit profile | profile fields | backend result |

Đã xác minh: deployed compatibility `get_user_info`. Mutation chưa chạy trên shared accounts.

### Settings và Device

File: `src/repositories/settingsRepository.js`

| Function | UI dùng ở đâu |
|---|---|
| `getPushSettings()` | Push settings screen |
| `setPushSettings(settings)` | Save push settings |
| `changePassword(oldPassword, newPassword)` | Change password |
| `checkNewVersion()` | Settings/about hoặc app lifecycle |
| `setDeviceToken(devtoken)` | Sau login/session lifecycle |

Đã xác minh: push settings, check version compatibility, set devtoken. Chưa chạy change password vì mutation nhạy cảm.

### Blocks

File: `src/repositories/blockRepository.js`

| Function | UI dùng ở đâu |
|---|---|
| `getBlocks()` | Block list |
| `setBlock(userId, type)` | Block/unblock action |

Đã xác minh: block list. Block mutation chưa chạy trên shared accounts. Mock mode có block data stateful.

### Friends / User Social

Chưa có endpoint friend thật nào được xác nhận. Slide mới có vẻ nhắc tới friend/user-social nên probe đã thử các route phổ biến:

- `get_user_friends`: deployed 404
- `get_list_friends`: deployed 404
- `get_friends`: deployed 404
- mutation candidates như `set_request_friend`, `send_friend_request`, `accept_friend`, `reject_friend`, `delete_friend`, `unfriend` đang bị guard bởi `PROBE_FRIEND_MUTATIONS=1` và chưa chạy trên shared accounts

Cho tới khi backend xác nhận route/payload chính thức, Friends screen nên dùng API hiện có:

| Nhu cầu | Repository/function | Ghi chú |
|---|---|---|
| Search users/posts | `postRepository.searchPosts(query, { userId })` | Runtime search nhận current `user_id`; UI có thể lọc kết quả dạng user nếu backend trả về. |
| Mở profile user | `userRepository.getUserInfo(userId)` | Spec có `user_id`; runtime hiện retry không có `user_id`. |
| Danh sách block | `blockRepository.getBlocks()` | Đã xác minh bằng real accounts. |
| Block/unblock | `blockRepository.setBlock(userId, type)` | Không chạy mutation trên shared accounts nếu không chủ đích test. |

Mock mode có friend/user seed rows để UI team làm Friends section không phụ thuộc backend. Backend mode không nên hiển thị thành công friend request cho tới khi có route thật.

### Conversations

File: `src/repositories/conversationRepository.js`

| Function | UI dùng ở đâu |
|---|---|
| `getConversationList()` | Chat list |
| `getConversation(conversationId)` | Chat detail |
| `markConversationRead(conversationId)` | Open/read detail |
| `deleteMessage(messageId)` | Delete message |
| `deleteConversation(conversationId)` | Delete thread |
| `sendLocalMessage(conversationId, text)` | Local/dev only |

Spec 40 API không có server `send_message`. Ẩn composer ở server mode trừ khi backend team chính thức bổ sung API.

Đã xác minh: conversation list. Data-blocked: chưa có conversation id để detail/read/delete.

## Loading và Error Pattern

Mẫu dùng trong screen:

```js
try {
  setIsLoading(true);
  const result = await repositoryFunction(params);
  setState(result);
} catch (error) {
  if (await redirectIfSessionExpired(error, router)) return;
  setStatusText(error.message || "Khong the tai du lieu.");
} finally {
  setIsLoading(false);
}
```

## HTTPS / HTTP

API base mặc định là HTTPS:

```text
https://group1.it4788.sukkaito.id.vn/it4788
```

HTTP vẫn là fallback và hiện redirect sang HTTPS:

```text
http://group1.it4788.sukkaito.id.vn/it4788
```

Override local:

```bash
EXPO_PUBLIC_API_BASE_URL=http://group1.it4788.sukkaito.id.vn/it4788 docker compose up
```
