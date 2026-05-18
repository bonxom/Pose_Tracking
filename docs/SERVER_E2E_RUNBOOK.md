# Runbook E2E Server

Runbook này dùng để kiểm tra backend thật bằng Docker. Không ghi credential thật vào repo, docs, screenshots hoặc Postman environment export.

## Chạy bằng existing accounts

```bash
docker compose run --rm expo sh -lc '
  E2E_USE_EXISTING_ACCOUNTS=1 \
  E2E_HV_PHONE=<hv-phone> \
  E2E_GV_PHONE=<gv-phone> \
  E2E_PASSWORD=<password> \
  npm run e2e:server
'
```

## Chạy mutation có kiểm soát

Chỉ chạy khi team đồng ý dùng shared accounts để test mutation:

```bash
docker compose run --rm expo sh -lc '
  E2E_USE_EXISTING_ACCOUNTS=1 \
  E2E_RUN_MUTATIONS=1 \
  E2E_HV_PHONE=<hv-phone> \
  E2E_GV_PHONE=<gv-phone> \
  E2E_PASSWORD=<password> \
  npm run e2e:server
'
```

## Course id = GV id, no exercise entity

Theo backend team:

```bash
E2E_USE_GV_ID_AS_COURSE_ID=1
E2E_NO_EXERCISE_ENTITY=1
```

E2E sẽ dùng GV id làm `course_id` khi có thể. Nếu `E2E_NO_EXERCISE_ENTITY=1`, script không bắt buộc `E2E_EXERCISE_ID` trước khi thử upload variant no-exercise.

Nếu cần test path cũ có explicit exercise id:

```bash
E2E_EXERCISE_ID=<exercise-id>
```

## Video fixtures

Đặt file local, không commit:

```text
video/cam1.mp4
video/cam2.mp4
```

Chạy upload E2E:

```bash
docker compose run --rm expo sh -lc '
  E2E_USE_EXISTING_ACCOUNTS=1 \
  E2E_USE_GV_ID_AS_COURSE_ID=1 \
  E2E_NO_EXERCISE_ENTITY=1 \
  E2E_RUN_MUTATIONS=1 \
  E2E_HV_PHONE=<hv-phone> \
  E2E_GV_PHONE=<gv-phone> \
  E2E_PASSWORD=<password> \
  E2E_VIDEO_LEFT=/app/video/cam1.mp4 \
  E2E_VIDEO_RIGHT=/app/video/cam2.mp4 \
  npm run e2e:server
'
```

## Signup/OTP mode

Nếu có phone mới và OTP thủ công:

```bash
E2E_HV_PHONE=<fresh-hv-phone>
E2E_GV_PHONE=<fresh-gv-phone>
E2E_PASSWORD=<password>
E2E_HV_VERIFY_CODE=<otp>
E2E_GV_VERIFY_CODE=<otp>
```

Nếu OTP chưa có, script/runbook chỉ đánh dấu bước verify là manual-blocked và tiếp tục các bước độc lập có thể chạy.

## Friend endpoint probe

Friend mutations không chạy mặc định. Để probe read candidates:

```bash
docker compose run --rm expo sh -lc '
  PROBE_COMPACT=1 \
  PROBE_HV_PHONE=<hv-phone> \
  PROBE_HV_PASSWORD=<password> \
  PROBE_GV_PHONE=<gv-phone> \
  PROBE_GV_PASSWORD=<password> \
  npm run backend:probe
'
```

Chỉ bật mutation nếu backend xác nhận route và test data:

```bash
PROBE_FRIEND_MUTATIONS=1
```

## Phân loại kết quả

Mỗi bước nên được ghi vào `docs/E2E_TEST_REPORT.md` theo nhóm:

- Verified server success
- Frontend correct, backend mismatch/blocker
- Frontend bug found and fixed
- Cannot verify without fresh phone/OTP
- Cannot verify without real media fixture
- Still missing

## Không làm

- Không force push.
- Không commit credential.
- Không commit video fixtures.
- Không fake success trong backend mode.
