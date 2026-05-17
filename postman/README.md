# IT4788 Postman Assets

Import `IT4788.postman_collection.json` and `IT4788.local.postman_environment.json` into Postman.

## Setup

1. Select the `IT4788 Local / Shared Server` environment.
2. Keep `baseUrl` as HTTPS by default: `{{baseUrlHttps}}`.
3. To test HTTP fallback, set `baseUrl` to `{{baseUrlHttp}}`. The current HTTP endpoint redirects to HTTPS.
4. Fill `hvPhone`, `gvPhone`, and `password` locally in Postman. Do not export real credentials back into the repo.

## Login And Tokens

- Run `Auth / HV Login` to store `hvToken` and `currentToken`.
- Run `Auth / GV Login` to store `gvToken` and `currentToken`.
- For role-specific tests, copy either token into `currentToken` if needed.

## Upload Testing

- Use `Feed / Posts / Add Post Multipart`.
- Pick two local files for `video1` and `video2` in Postman.
- Set `courseId` and `exerciseId` from seeded backend data first.
- Do not use mock:// placeholders against the server.

## Known Backend Mismatches

- `/like` returned 404 in deployed probes.
- `/delete_post` returned 404 in deployed probes.
- `check_new_item` rejects `token`; frontend sends spec payload first and retries without token.
- `get_user_info` rejects `user_id`; frontend retries without it.
- `get_notification` rejects `last_update`; frontend retries without it.
- `check_new_version` rejects `last_update`; frontend retries with `lastUpdate`.
- `set_devtoken` requires numeric `devtype`, usually `1`.

## Seeded Data Requirements

Several flows need real IDs from backend data: `postId`, `courseId`, `exerciseId`, `notificationId`, `conversationId`, and `messageId`. Existing shared accounts may return empty feed/course data, which is a data blocker rather than a Postman issue.
