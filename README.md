# IT4788 Pose Tracking Frontend

Frontend React Native / Expo cho ứng dụng xã hội học tập và luyện tập tư thế diễu binh/diễu hành của môn IT4788.

Ứng dụng hiện theo hướng **server-authoritative**: chế độ mặc định gọi backend thật, còn `mock mode` chỉ là phương án dự phòng cho phát triển UI và demo khi backend chưa ổn định.

## Trạng thái hiện tại

- Expo Router + React Native, chạy được trên Expo Web bằng Docker.
- Điều hướng chính: Home, Courses, Notifications, Profile, Menu.
- API owner branch cung cấp repository/API layer cho auth, feed/posts/comments/search/courses/notifications/profile/settings/blocks/conversations.
- Có Postman assets cho backend team và UI team.
- Có script probe backend và E2E server để kiểm tra contract thực tế.
- Backend mặc định: `https://group1.it4788.sukkaito.id.vn/it4788`.
- HTTP fallback: `http://group1.it4788.sukkaito.id.vn/it4788`.

## Chạy bằng Docker

Máy host không cần cài `npm`.

```bash
docker compose build
docker compose up
```

Mở web demo:

```text
http://localhost:8081
```

Nếu cần chạy lệnh npm trong container:

```bash
docker compose run --rm expo npm run lint
docker compose run --rm expo sh -lc 'npx expo-doctor'
```

## Chế độ API

Biến khuyến nghị cho Expo runtime:

```bash
EXPO_PUBLIC_API_TYPE=backend # mặc định, gọi backend thật
EXPO_PUBLIC_API_TYPE=mock    # chỉ dùng dữ liệu/mock repository, không gọi backend
```

Alias tiện cho Docker/dev script nếu môi trường hỗ trợ:

```bash
API_TYPE=backend
API_TYPE=mock
```

Biến cũ vẫn được giữ để tương thích:

```bash
EXPO_PUBLIC_DATA_SOURCE=server # map sang backend
EXPO_PUBLIC_DATA_SOURCE=local  # map sang mock
EXPO_PUBLIC_DATA_SOURCE=auto   # tương thích cũ, không khuyến nghị cho luồng mới
```

Chạy mock bằng PowerShell:

```powershell
$env:EXPO_PUBLIC_API_TYPE="mock"
npm.cmd run web
```

Chạy backend thật bằng PowerShell:

```powershell
$env:EXPO_PUBLIC_API_TYPE="backend"
$env:EXPO_PUBLIC_API_BASE_URL="https://group1.it4788.sukkaito.id.vn/it4788"
npm.cmd run web
```

Chạy với Docker:

```bash
docker compose run --rm -e EXPO_PUBLIC_API_TYPE=mock expo npm run web
docker compose run --rm -e EXPO_PUBLIC_API_TYPE=backend -e EXPO_PUBLIC_API_BASE_URL=https://group1.it4788.sukkaito.id.vn/it4788 expo npm run web
```

## Cấu trúc chính

```text
src/
  app/
    (auth)/               # login/signup/verify/change-info
    (tabs)/               # Home, Courses, Notifications, Profile, Menu
    post/                 # post detail, create/upload
    search.jsx            # route non-tab cho search
    courses.jsx           # route non-tab cho course/enrollment
    chat/                 # conversation list/detail
    settings/             # profile edit, push settings, blocks, password
  api/                    # backend API client/wrappers
  repositories/           # adapter dùng cho UI screens
  constants/              # mock/demo seed data
  services/               # session/storage helpers

docs/                     # tài liệu dự án, API, E2E, mismatch
postman/                  # Postman README và collection/environment trên feature branch
scripts/                  # backend probe, server E2E harness
```

## Luồng UI hiện tại

Top navigator có các section:

- `/(tabs)/home`
- `/(tabs)/courses`
- `/(tabs)/notifications`
- `/(tabs)/profile`
- `/(tabs)/menu`

Search là route hỗ trợ ngoài tab:

- `/search`

Các route hỗ trợ khác:

- `/post/create`
- `/post/[id]`
- `/comment/[postId]`
- `/chat`
- `/chat/[id]`
- `/settings`
- `/settings/profile-edit`
- `/settings/push`
- `/settings/blocks`
- `/settings/change-password`

## Tài liệu nên đọc

- `docs/API_HANDOFF_FOR_UI_TEAM.md`: UI team nên gọi repository nào, input/output ra sao.
- `docs/API_IMPLEMENTATION_MATRIX.md`: trạng thái từng API, phân biệt wrapper/repository/UI/verified server.
- `docs/BACKEND_MISMATCHES.md`: danh sách mismatch gửi backend team.
- `docs/BACKEND_CONTRACT_REPORT.md`: kết quả probe backend.
- `docs/E2E_TEST_REPORT.md`: kết quả E2E với account thật qua env vars.
- `docs/MOBILE_TESTING.md`: cách test trên điện thoại bằng browser LAN và Expo Go best-effort.
- `postman/README.md`: cách import và dùng Postman assets.

## Postman

Trên feature branch API owner có:

```text
postman/IT4788.postman_collection.json
postman/IT4788.local.postman_environment.json
postman/README.md
```

Import collection + environment, tự nhập credential thật trong Postman local. Không export credential thật ngược lại repo.

## Quy tắc bảo mật

- Không commit số điện thoại/mật khẩu thật.
- Không commit `.env` local.
- Không commit video fixture như `video/*.mp4`.
- Credential E2E chỉ truyền qua biến môi trường.

## Kiểm tra nhanh

```bash
docker compose build
docker compose run --rm expo npm run lint
docker compose run --rm expo sh -lc 'npx expo-doctor'
```

Probe backend:

```bash
docker compose run --rm expo sh -lc 'PROBE_COMPACT=1 npm run backend:probe'
```

E2E server dùng account thật qua env vars, không ghi credential vào repo:

```bash
docker compose run --rm expo sh -lc '
  E2E_USE_EXISTING_ACCOUNTS=1 \
  E2E_HV_PHONE=<hv-phone> \
  E2E_GV_PHONE=<gv-phone> \
  E2E_PASSWORD=<password> \
  npm run e2e:server
'
```

## Ghi chú backend mới nhất

- Backend team nói `course_id` là teacher/GV id.
- Backend team nói không có entity `exercise` riêng.
- Runtime deployed vẫn còn mismatch: upload HV metadata-only vẫn báo cần `exercise_id`; multipart upload thật đang bị `Unexpected field` do chưa rõ field name file.
