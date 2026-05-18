# IT4788 Postman Assets

Import `IT4788.postman_collection.json` and `IT4788.local.postman_environment.json` into Postman.

## Setup

1. Select the `IT4788 Local / Shared Server` environment.
2. Keep `baseUrl` as HTTPS by default: `{{baseUrlHttps}}`.
3. To test HTTP fallback, set `baseUrl` to `{{baseUrlHttp}}`. The current HTTP endpoint redirects to HTTPS.
4. Fill `hvPhone`, `gvPhone`, and `password` locally in Postman. Do not export real credentials back into the repo.
5. `apiType` mirrors frontend development mode only; Postman requests still target whichever `baseUrl` you choose.

## Login And Tokens

- Run `Auth / HV Login` to store `hvToken` and `currentToken`.
- Run `Auth / GV Login` to store `gvToken` and `currentToken`.
- For role-specific tests, copy either token into `currentToken` if needed.

## Upload Testing

- Use one of the `Feed / Posts / Add Post Multipart - ...` variants.
- Pick two local files for the multipart file fields in Postman. The collection keeps the frontend's current `video1`/`video2` contract visible, but the deployed backend is still rejecting tested field names and needs backend-team clarification.
- Current backend-team guidance says `courseId` equals the teacher/GV id, so `teacherId` can be copied into `courseId`.
- The backend team now says there is no separate exercise entity. Keep `noExerciseEntity=true` for that deployed interpretation. `exerciseId` is optional unless you are intentionally testing the older strict spec-shaped path.
- Use `exercisePostId` only when probing the hypothesis that a teacher post acts as the exercise-like object.
- Do not use mock:// placeholders against the server.

## Known Backend Mismatches

- `/like` returned 404 in deployed probes.
- `/delete_post` returned 404 in deployed probes.
- Friend/user-social candidates `get_user_friends`, `get_list_friends`, and `get_friends` returned 404 in deployed probes.
- `check_new_item` rejects `token`; frontend sends spec payload first and retries without token.
- `get_user_info` rejects `user_id`; frontend retries without it.
- `get_notification` rejects `last_update`; frontend retries without it.
- `check_new_version` rejects `last_update`; frontend retries with `lastUpdate`.
- `set_devtoken` requires numeric `devtype`, usually `1`.

## Seeded Data Requirements

Several flows need real IDs from backend data: `postId`, `teacherId`, `courseId`, `exercisePostId`, `notificationId`, `conversationId`, and `messageId`. Current team guidance says `courseId` can be the GV id. `exerciseId` is now only needed when probing the older strict spec payload. Existing shared accounts may return empty feed/course data, which is a data blocker rather than a Postman issue.

## No-exercise upload probes

The collection includes separate `add_post` variants:

- omit `exercise_id`
- send `exercise_id=""`
- send `exercise_id={{courseId}}`
- send `exercise_id={{exercisePostId}}`
- send explicit `exercise_id={{exerciseId}}`

Use HTTPS, set `courseId={{teacherId}}`, and pick two local files for the file fields before sending. As of the latest real-account run, the deployed backend rejected every tested two-file field name with `Unexpected field`, and the metadata-only HV control still required `exercise_id`. Treat that as a backend mismatch until the server team confirms the real multipart field contract.

## Friends / User Social

The collection includes a `Friends / User Social` folder for newer slide/API discussion:

- candidate read probes: `get_user_friends`, `get_list_friends`, `get_friends`
- existing fallback requests: search user via `search`, get user info via `get_user_info`, block/unblock via `set_block`
- mutation candidates are described but should not be run unless backend gives exact route names and approved test data

As of the latest probe, no deployed friend route is confirmed. UI teammates can build the Friends tab against mock data and the existing search/user/block repositories while backend clarifies the official friend API.
