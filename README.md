# Pose_Tracking

Ứng dụng React Native dùng Expo Router (file-based routing), tập trung vào flow Authentication và màn hình chính dạng Tabs.

## Công nghệ chính

- Expo SDK 55
- React Native 0.83
- Expo Router
- React Navigation (tabs)
- react-native-webview

## Cách chạy dự án

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
2. `/(auth)/signup`
3. `/(auth)/name`
4. `/(auth)/birthday`
5. `/(auth)/terms`
6. `/(auth)/email`
7. `/(auth)/verify`
8. `/(auth)/password`
9. `/(auth)/save-login`
10. `/(tabs)/home`

Lưu ý: dữ liệu qua từng bước được truyền bằng `router.push({ pathname, params })`.

### Tabs sau đăng nhập

- `/(tabs)/home`
- `/(tabs)/profile`

## Kiến trúc code

- `app/`: màn hình + điều hướng.
- `components/common/`: component tái sử dụng.
- `styles/`: style tách theo module màn hình.
- `constants/`: token UI + mock data.
- `api/`: lớp gọi API (hiện là mock).
- `utils/`: tiện ích dùng chung (validation).

## Ghi chú

- Import alias:
  - `@/*` -> `src/*`
  - `@/assets/*` -> `assets/*`
- `example/` chỉ là code mẫu, không phải luồng chính của ứng dụng hiện tại.
