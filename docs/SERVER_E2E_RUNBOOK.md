# Server E2E Runbook

Status date: 2026-05-10

This runbook verifies real server behavior against `http://group1.it4788.sukkaito.id.vn/it4788`. It is mutation-safe by default and only creates/modifies data when `E2E_RUN_MUTATIONS=1` is set.

## 1. Baseline Docker Checks

```bash
docker compose build
docker compose run --rm expo npm run lint
docker compose run --rm expo sh -lc 'PROBE_COMPACT=1 npm run backend:probe'
docker compose up -d
curl -I http://localhost:8081
```

## 2. Non-Mutating E2E Harness

```bash
docker compose run --rm expo npm run e2e:server
```

Expected without credentials: the harness reports blocked steps for signup/login/token-required flows. This confirms the harness can run without mutating backend data.

## 3. Real Signup With Manual OTP

Choose fresh real phone numbers for one HV and one GV.

```bash
docker compose run --rm expo sh -lc '
  E2E_RUN_MUTATIONS=1 \
  E2E_HV_PHONE=09xxxxxxxx \
  E2E_GV_PHONE=09yyyyyyyy \
  E2E_PASSWORD=123456 \
  npm run e2e:server
'
```

If SMS/OTP is required, the first run will stop the verification step as `manual-blocked`.

After receiving codes:

```bash
docker compose run --rm expo sh -lc '
  E2E_RUN_MUTATIONS=1 \
  E2E_HV_PHONE=09xxxxxxxx \
  E2E_GV_PHONE=09yyyyyyyy \
  E2E_PASSWORD=123456 \
  E2E_HV_VERIFY_CODE=123456 \
  E2E_GV_VERIFY_CODE=654321 \
  npm run e2e:server
'
```

The harness tries common deployed verification field names (`code`, `verify_code`, `code_verify`, `otp`) and records which one works.

## 4. Optional Enrollment And Upload Mutations

After HV/GV accounts exist, provide course and video inputs:

```bash
docker compose run --rm expo sh -lc '
  E2E_RUN_MUTATIONS=1 \
  E2E_HV_PHONE=09xxxxxxxx \
  E2E_GV_PHONE=09yyyyyyyy \
  E2E_PASSWORD=123456 \
  E2E_HV_VERIFY_CODE=123456 \
  E2E_GV_VERIFY_CODE=654321 \
  E2E_COURSE_ID=<real-course-id> \
  E2E_EXERCISE_ID=<real-exercise-id> \
  E2E_VIDEO_LEFT=/app/test-fixtures/left.mp4 \
  E2E_VIDEO_RIGHT=/app/test-fixtures/right.mp4 \
  npm run e2e:server
'
```

Video requirements:

- exactly 2 videos
- each video at least 10 seconds
- similar duration
- real file paths mounted into the Docker container

## 5. Manual Browser Smoke

1. Start the app:

   ```bash
   docker compose up
   ```

2. Open `http://localhost:8081`.
3. Use the normal login/signup form for real server accounts.
4. Verify:
   - signup and OTP input
   - login and session resume
   - Home feed
   - new-items refresh button after backend reports `new_items`
   - post detail
   - two-video create/submission flow with real files
   - comment/like/report/edit/delete safe behavior
   - search and saved search delete
   - courses, request enrollment, teacher approval
   - profile edit with `user_name`, `avatar`, `cover_image`
   - settings, push settings, change password, version/device token
   - notifications/read state
   - conversations/read/delete
   - logout

## Current Expected Blockers

- Valid HV/GV phone numbers and OTP codes are not available in this repository session.
- Deployed `/it4788/like` and `/it4788/delete_post` have returned 404 in prior probes.
- Full client-side pose scoring is not implemented.
