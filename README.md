# Pose_Tracking

Ứng dụng React Native dùng Expo Router (file-based routing) cho social app luyện tập tư thế diễu hành trong học phần IT4788.

Backend chính thức cho các bước tích hợp sau:

```text
http://group1.it4788.sukkaito.id.vn
```

Định hướng hiện tại là server-authoritative: luồng sản phẩm mặc định dùng backend IT4788. Local/demo mode chỉ còn là đường dự phòng phát triển và phải được đánh dấu rõ.

## Công nghệ chính

- Expo SDK 55
- React Native 0.83
- Expo Router
- React Navigation (tabs)
- React Native Web

## Cách chạy web demo bằng Docker

Máy host không cần cài Node/npm. Docker sẽ cài dependencies trong container bằng `npm ci`.

```bash
docker compose build
docker compose up
```

Mở web demo tại:

```text
http://localhost:8081
```

Tài khoản demo nhanh chỉ dành cho developer/local fallback:

```text
HV: 0900000001 / 123456
GV: 0900000002 / 123456
```

Xem thêm hướng dẫn và troubleshooting trong [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md). Báo cáo kiểm thử server nằm ở [docs/FRONTEND_SERVER_TEST_REPORT.md](docs/FRONTEND_SERVER_TEST_REPORT.md).

## Data source modes

```bash
EXPO_PUBLIC_DATA_SOURCE=server # mặc định: dùng backend, lỗi rõ ràng nếu backend/token không hợp lệ
EXPO_PUBLIC_DATA_SOURCE=auto   # dev fallback: server khi có token thật, fallback local nếu backend lỗi
EXPO_PUBLIC_DATA_SOURCE=local  # developer-only local fallback
```

Backend probe:

```bash
docker compose run --rm expo npm run backend:probe
```

Server E2E harness:

```bash
docker compose run --rm expo npm run e2e:server
```

Existing-account E2E uses credentials only from shell environment variables:

```bash
docker compose run --rm expo sh -lc '
  E2E_USE_EXISTING_ACCOUNTS=1 \
  E2E_HV_PHONE=<provided-hv-phone> \
  E2E_GV_PHONE=<provided-gv-phone> \
  E2E_PASSWORD=<provided-password> \
  npm run e2e:server
'
```

## Cách chạy nếu có npm trên host

1. Cài dependencies:

```bash
npm install
```

2. Chạy app:

```bash
npm run start
```

3. Mở theo nền tảng:

```bash
npm run android
npm run ios
npm run web
```

Lệnh bổ sung:

```bash
npm run start:clear
npm run web:docker
```

## Cấu trúc thư mục

```text
Pose_Tracking/
├── assets/                        # ảnh, icon, splash
├── src/
│   ├── api/
│   │   ├── auth.js                # server-backed signup/login helpers with local fallback mode
│   │   ├── client.js              # 40-API backend client
│   │   └── backendStatus.js       # backend availability helper
│   ├── app/                       # routes (Expo Router)
│   │   ├── _layout.jsx            # root stack
│   │   ├── index.jsx              # redirect -> /(auth)/login
│   │   ├── (auth)/                # flow đăng ký/đăng nhập
│   │   ├── (tabs)/                # Home, Courses, Search, Notifications, Menu
│   │   ├── post/                  # stack bài viết
│   │   ├── comment/               # stack bình luận
│   │   ├── settings/              # profile/push/password/blocks/device/version
│   │   └── chat/                  # conversation list/detail
│   ├── components/common/
│   │   ├── AppButton.jsx
│   │   ├── AppInput.jsx
│   │   └── Screen.jsx
│   ├── constants/
│   │   ├── colors.js              # design tokens màu
│   │   ├── demo.js                # demo users/course/exercises/notifications
│   │   ├── sizes.js               # spacing/radius/size tokens
│   │   └── mocks/users.js         # dữ liệu user giả lập
│   ├── config/
│   │   └── env.js                 # API base URL and timeout config
│   ├── repositories/              # server-authoritative adapters plus local dev fallback
│   ├── styles/
│   │   ├── auth/                  # style cho từng màn auth
│   │   ├── common/
│   │   └── home.styles.js
│   └── utils/
│       └── validation.js          # validate phone/password
├── example/                       # code mẫu từ template Expo
├── app.json
├── Dockerfile
├── docker-compose.yml
├── jsconfig.json                  # alias @/* -> src/*
└── package.json
```

## Routing và điều hướng

### Root stack

- `src/app/_layout.jsx` khai báo 6 nhánh:
  - `(auth)`
  - `(tabs)`
  - `post`
  - `comment`
  - `settings`
  - `chat`

### Route mặc định

- `src/app/index.jsx` redirect thẳng tới `/(auth)/login`.

### Auth flow hiện tại

1. `/(auth)/login`
2. `/(auth)/signup-start`
3. `/(auth)/signup-profile`
4. `/(auth)/signup-birthday`
5. `/(auth)/signup`
6. `/(auth)/signup-terms`
7. `/(auth)/verify`
8. `/(auth)/change-info-after-signup`
9. `/(auth)/signup-success`
10. `/(tabs)/home`

Lưu ý: dữ liệu qua từng bước được truyền bằng `router.push({ pathname, params })`.

### Tabs sau đăng nhập

- `/(tabs)/home`
- `/(tabs)/courses`
- `/(tabs)/search`
- `/(tabs)/notifications`
- `/(tabs)/profile`

### Post/comment routes

- `/post/create`
- `/post/[id]`
- `/comment/[postId]`

### Settings/chat routes

- `/settings`
- `/settings/profile-edit`
- `/settings/push`
- `/settings/change-password`
- `/settings/blocks`
- `/chat`
- `/chat/[id]`

## Kiến trúc code

- `app/`: màn hình + điều hướng.
- `components/common/`: component tái sử dụng.
- `styles/`: style tách theo module màn hình.
- `constants/`: token UI + mock data.
- `api/`: lớp auth server-backed và backend API client an toàn.
- `repositories/`: adapter server-authoritative cho các module chính, giữ local fallback cho phát triển.
- `utils/`: tiện ích dùng chung (validation).

## Tài liệu

- [docs/IT4788_SOURCE_OF_TRUTH.md](docs/IT4788_SOURCE_OF_TRUTH.md): source-of-truth summary for product rules and 40 APIs.
- [docs/API_IMPLEMENTATION_MATRIX.md](docs/API_IMPLEMENTATION_MATRIX.md): 40-API wrapper/repository/screen/probe matrix.
- [docs/SCREEN_FLOW_MATRIX.md](docs/SCREEN_FLOW_MATRIX.md): routes and server API usage by flow.
- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md): Docker workflow, web URL, data-source modes, troubleshooting.
- [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md): exact morning demo runbook and click path.
- [docs/DEMO_STATUS.md](docs/DEMO_STATUS.md): completed features, local/mock features, backend behavior, known gaps.
- [docs/FRONTEND_BASELINE_AUDIT.md](docs/FRONTEND_BASELINE_AUDIT.md): tech stack, routes, implemented features, mock/local-only parts, risks.
- [docs/FRONTEND_SERVER_TEST_REPORT.md](docs/FRONTEND_SERVER_TEST_REPORT.md): final server-mode frontend test matrix.
- [docs/BACKEND_CONTRACT_REPORT.md](docs/BACKEND_CONTRACT_REPORT.md): deployed backend probe results.
- [docs/BACKEND_MISMATCHES.md](docs/BACKEND_MISMATCHES.md): known deployed/backend-doc mismatches.
- [docs/E2E_TEST_REPORT.md](docs/E2E_TEST_REPORT.md): Docker, backend, and real-account E2E results.
- [docs/SERVER_E2E_RUNBOOK.md](docs/SERVER_E2E_RUNBOOK.md): real-account E2E commands with OTP continuation.
- [docs/MOBILE_TESTING.md](docs/MOBILE_TESTING.md): physical phone browser and best-effort Expo Go instructions.

## Ghi chú

- Import alias:
  - `@/*` -> `src/*`
  - `@/assets/*` -> `assets/*`
- `example/` chỉ là code mẫu, không phải luồng chính của ứng dụng hiện tại.
- Backend thật đã có wrapper cho toàn bộ 40 API và repository integration cho các module chính. Tài khoản HV/GV thật đã verified login/logout và một số read/lifecycle API; các flow theo object thật còn cần server seed dữ liệu course/exercise/post/notification/conversation.
