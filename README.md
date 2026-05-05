# Pose_Tracking

Ứng dụng React Native dùng Expo Router (file-based routing), tập trung vào flow Authentication và màn hình chính dạng Tabs cho demo social app luyện tập tư thế diễu hành.

Backend chính thức cho các bước tích hợp sau:

```text
http://group1.it4788.sukkaito.id.vn
```

Hiện tại frontend vẫn dùng mock/local data để giữ baseline chạy được và demo được.

## Công nghệ chính

- Expo SDK 55
- React Native 0.83
- Expo Router
- React Navigation (tabs)
- react-native-webview

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

Xem thêm hướng dẫn và troubleshooting trong [docs/DEVELOPMENT.md](/Users/nqd2005/Projects/Pose_Tracking/docs/DEVELOPMENT.md).

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
│   │   └── auth.js                # mock auth API
│   ├── app/                       # routes (Expo Router)
│   │   ├── _layout.jsx            # root stack
│   │   ├── index.jsx              # redirect -> /(auth)/login
│   │   ├── (auth)/                # flow đăng ký/đăng nhập
│   │   ├── (tabs)/                # tab chính sau khi vào app
│   │   ├── post/                  # stack bài viết
│   │   └── comment/               # stack bình luận
│   ├── components/common/
│   │   ├── AppButton.jsx
│   │   ├── AppInput.jsx
│   │   └── Screen.jsx
│   ├── constants/
│   │   ├── colors.js              # design tokens màu
│   │   ├── sizes.js               # spacing/radius/size tokens
│   │   └── mocks/users.js         # dữ liệu user giả lập
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
- `api/`: lớp gọi API (hiện là mock).
- `utils/`: tiện ích dùng chung (validation).

## Tài liệu baseline

- [docs/DEVELOPMENT.md](/Users/nqd2005/Projects/Pose_Tracking/docs/DEVELOPMENT.md): Docker workflow, web demo URL, troubleshooting, known backend gaps, next phases.
- [docs/FRONTEND_BASELINE_AUDIT.md](/Users/nqd2005/Projects/Pose_Tracking/docs/FRONTEND_BASELINE_AUDIT.md): tech stack, routes, implemented features, mock/local-only parts, risks.

## Ghi chú

- Import alias:
  - `@/*` -> `src/*`
  - `@/assets/*` -> `assets/*`
- `example/` chỉ là code mẫu, không phải luồng chính của ứng dụng hiện tại.
- Chưa tích hợp backend thật trong bước baseline này.
