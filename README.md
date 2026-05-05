# Pose_Tracking

Ứng dụng React Native dùng Expo Router (file-based routing) cho demo social app luyện tập tư thế diễu hành trong học phần IT4788.

Backend chính thức cho các bước tích hợp sau:

```text
http://group1.it4788.sukkaito.id.vn
```

Hiện tại frontend dùng chiến lược local-first để giữ demo web chạy ổn định. Lớp API backend đã được chuẩn bị theo hướng opportunistic fallback, nhưng luồng demo chính không phụ thuộc backend.

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

Tài khoản demo nhanh:

```text
HV: 0900000001 / 123456
GV: 0900000002 / 123456
```

Xem thêm hướng dẫn và troubleshooting trong [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md). Kịch bản click demo sáng mai nằm ở [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md).

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
│   │   ├── auth.js                # auth local-first, backend-opportunistic
│   │   ├── client.js              # lightweight backend API client
│   │   └── backendStatus.js       # backend availability helper
│   ├── app/                       # routes (Expo Router)
│   │   ├── _layout.jsx            # root stack
│   │   ├── index.jsx              # redirect -> /(auth)/login
│   │   ├── (auth)/                # flow đăng ký/đăng nhập
│   │   ├── (tabs)/                # Home, Courses, Search, Notifications, Menu
│   │   ├── post/                  # stack bài viết
│   │   └── comment/               # stack bình luận
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

- `src/app/_layout.jsx` khai báo 4 nhánh:
  - `(auth)`
  - `(tabs)`
  - `post`
  - `comment`

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

## Kiến trúc code

- `app/`: màn hình + điều hướng.
- `components/common/`: component tái sử dụng.
- `styles/`: style tách theo module màn hình.
- `constants/`: token UI + mock data.
- `api/`: lớp auth local-first và backend API client an toàn.
- `utils/`: tiện ích dùng chung (validation).

## Tài liệu demo

- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md): Docker workflow, web demo URL, troubleshooting, backend fallback notes.
- [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md): exact morning demo runbook and click path.
- [docs/DEMO_STATUS.md](docs/DEMO_STATUS.md): completed features, local/mock features, backend behavior, known gaps.
- [docs/FRONTEND_BASELINE_AUDIT.md](docs/FRONTEND_BASELINE_AUDIT.md): tech stack, routes, implemented features, mock/local-only parts, risks.

## Ghi chú

- Import alias:
  - `@/*` -> `src/*`
  - `@/assets/*` -> `assets/*`
- `example/` chỉ là code mẫu, không phải luồng chính của ứng dụng hiện tại.
- Backend thật đã có client/config chuẩn bị, nhưng demo chính vẫn local-first để tránh CORS, tài khoản test, hoặc API contract mismatch làm hỏng buổi demo.
