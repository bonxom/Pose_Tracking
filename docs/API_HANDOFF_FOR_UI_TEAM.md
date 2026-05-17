# API Handoff For UI Team

Status date: 2026-05-14

This project now keeps the leader's 4-section Facebook-style navigator:

- Home
- Friends
- Notifications
- Profile

API-backed features do not need to be top-level tabs. UI screens should call repository functions and can place Search, Courses, Enrollment, Upload, Chat, Blocks, and Settings wherever the product owner wants.

## Rules For UI Screens

- Do not call raw `fetch` from screens.
- Call repositories from `src/repositories/*`.
- Keep request payload quirks and response normalization inside repositories/API client.
- Use `redirectIfSessionExpired(error, router)` in screen catch blocks.
- In server mode, do not fake success. Show a friendly error when the backend fails.
- Local/demo fallback is for development only and should stay visually separate.

## Current Routes After Leader Navigation Change

| Product area | Current route | Notes |
|---|---|---|
| Home feed | `/(tabs)/home` | Top-tab Home. Calls post repository. |
| Friends | `/(tabs)/friends` | Shell screen. Can later use search/user/block APIs. |
| Notifications | `/(tabs)/notifications` | Top-tab Notifications. Calls notification repository. |
| Profile | `/(tabs)/profile` | Top-tab Profile. Calls user/auth repositories and links to supporting screens. |
| Search | `/search` | Non-tab API shell opened by Home/Friends/Profile search actions. |
| Courses | `/courses` | Non-tab API shell opened from Profile or notification course targets. |
| Upload/create | `/post/create` | Uses post repository. Server mode requires real two-video files. |
| Chat | `/chat`, `/chat/[id]` | Uses conversation repository. Composer is local/dev only because no send API exists in the 40-API list. |
| Settings | `/settings/*` | Uses settings, user, block repositories. |

## Repository Map

### Auth

File: `src/repositories/authRepository.js`

| Function | Use from UI | Input | Output |
|---|---|---|---|
| `loginWithPassword(phonenumber, password)` | Login form | phone/password | Normalized session `{ id, token, username, role, phonenumber, source }` |
| `logoutSession(session)` | Logout button | current session | Best-effort backend logout |
| `loginDemoStudent()`, `loginDemoTeacher()` | Developer fallback only | none | Local demo session |

Verified: HV/GV real login and logout succeed over HTTPS with env-only credentials.

### Feed, Posts, Search, Upload

File: `src/repositories/postRepository.js`

| Function | Use from UI | Input | Output |
|---|---|---|---|
| `getFeedPage({ index, count, lastId })` | Home feed, refresh, load more | pagination params | `{ items, hasMore, lastId, newItems, sourceLabel }` |
| `checkNewItems(lastId)` | Home new-items polling | server `lastId` | `{ count }` |
| `getPostById(postId)` | Post detail | post id | normalized `Post` |
| `toggleLike(post)` | Like button | normalized post | updated normalized `Post` |
| `searchPosts(query, { userId })` | Search UI, profile search | keyword/user id | normalized post list |
| `getSavedSearches()` | Search history | none | saved search list |
| `deleteSavedSearch(searchId)` | Search history delete | search id | backend result |
| `createPost(params)` | Post/create, exercise submission | content, course/exercise ids, videos | created/normalized post |
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

Verified: feed/search empty states and saved-search list. Data-blocked: post detail, comments, upload, edit/delete/report because current accounts return no real post/course/exercise ids. Backend-blocked: deployed `/like` and `/delete_post` return 404.

### Comments

File: `src/repositories/commentRepository.js`

| Function | Use from UI | Input | Output |
|---|---|---|---|
| `getComments(postOrId, { index, count })` | Comment list | post/id + pagination | normalized comments |
| `addComment(postOrId, commentText, extra)` | Comment composer | post/id + text | normalized comment/result |

Comment UI should hide composer when `post.canComment === false`.

### Courses And Enrollment

File: `src/repositories/courseRepository.js`

| Function | Use from UI | Output / behavior |
|---|---|---|
| `getCurrentCourse()` | Course overview | normalized current course |
| `getStudentCourses({ userId })` | Student courses | course list |
| `getCourseExercises()` | Course exercises | teacher exercise posts |
| `getCourseStudents()` | Teacher student list | users |
| `getRequestedEnrollments()` | Teacher pending approvals | users/requests |
| `requestCourse(courseId)` | HV request join | returns `requested`, not enrolled |
| `approveEnrollment(requestId, isApproved)` | GV approve/reject | backend result |

Important UI state: after `requestCourse`, show pending/requested until GV approval is confirmed.

Verified: empty course state with real accounts. Data-blocked: no real course/request objects returned.

### Notifications

File: `src/repositories/notificationRepository.js`

| Function | Use from UI | Output |
|---|---|---|
| `getNotificationPage({ index, count, lastUpdate })` | Notification list, refresh, load-more | `{ items, hasMore, lastUpdate }` |
| `markNotificationRead(notificationId)` | Tap notification | backend result |

Normalized notification fields include `id`, `notificationId`, `type`, `targetType`, `targetId`, `objectId`, `title`, `body`, `createdAt`, `avatar`, `group`, `unread`, `badge`, `lastUpdate`.

Verified: compatibility notification list. Data-blocked: no notification id for read-state verification.

### Profile And Users

File: `src/repositories/userRepository.js`

| Function | Use from UI | Input | Output |
|---|---|---|---|
| `getUserInfo(userId)` | Profile/menu/edit profile | optional user id | normalized session/user |
| `updateUserInfo({ userName, avatar, coverImage })` | Edit profile | profile fields | backend result |

Verified: deployed compatibility `get_user_info`. Mutation not run against shared accounts.

### Settings And Device

File: `src/repositories/settingsRepository.js`

| Function | Use from UI |
|---|---|
| `getPushSettings()` | Push settings screen |
| `setPushSettings(settings)` | Save push settings |
| `changePassword(oldPassword, newPassword)` | Change password |
| `checkNewVersion()` | Settings/about or app lifecycle |
| `setDeviceToken(devtoken)` | After login/session lifecycle |

Verified: push settings, check version compatibility, set devtoken. Password mutation not run.

### Blocks

File: `src/repositories/blockRepository.js`

| Function | Use from UI |
|---|---|
| `getBlocks()` | Block list |
| `setBlock(userId, type)` | Block/unblock action |

Verified: block list. Block mutation not run against shared accounts.

### Conversations

File: `src/repositories/conversationRepository.js`

| Function | Use from UI |
|---|---|
| `getConversationList()` | Chat list |
| `getConversation(conversationId)` | Chat detail |
| `markConversationRead(conversationId)` | Open/read detail |
| `deleteMessage(messageId)` | Delete message |
| `deleteConversation(conversationId)` | Delete thread |
| `sendLocalMessage(conversationId, text)` | Local/dev only |

There is no server `send_message` API in the 40-API source of truth. Hide composers in server mode unless the backend team formally adds an API.

Verified: conversation list. Data-blocked: no conversation id for detail/read/delete.

## Loading And Error Pattern

Use this shape in screens:

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

Default API base is HTTPS:

```text
https://group1.it4788.sukkaito.id.vn/it4788
```

HTTP remains a documented fallback and currently redirects to HTTPS:

```text
http://group1.it4788.sukkaito.id.vn/it4788
```

Override locally:

```bash
EXPO_PUBLIC_API_BASE_URL=http://group1.it4788.sukkaito.id.vn/it4788 docker compose up
```
