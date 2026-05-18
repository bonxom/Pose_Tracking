# Hướng Dẫn Phát Triển

Tài liệu này mô tả cách chạy, kiểm tra và chuyển chế độ backend/mock cho frontend Expo trong môi trường team không có `npm` trên host.

## Yêu cầu

- Docker Desktop hoặc Docker CLI.
- Không cần cài `npm` trên host.
- Backend mặc định: `https://group1.it4788.sukkaito.id.vn/it4788`.

## Chạy web bằng Docker

```bash
docker compose build
docker compose up
```

Mở:

```text
http://localhost:8081
```

Nếu port bị chiếm, dừng container cũ:

```bash
docker compose down
```

## API mode

Backend mode là mặc định:

```bash
EXPO_PUBLIC_API_TYPE=backend docker compose up
```

Mock mode không gọi backend:

```bash
EXPO_PUBLIC_API_TYPE=mock docker compose up
```

Biến khuyến nghị:

```bash
EXPO_PUBLIC_API_TYPE=backend
EXPO_PUBLIC_API_TYPE=mock
```

Alias `API_TYPE=mock|backend` có thể dùng trong Docker/script nếu được hỗ trợ, nhưng Expo runtime cần biến public `EXPO_PUBLIC_API_TYPE`.

Biến cũ còn tương thích:

```bash
EXPO_PUBLIC_DATA_SOURCE=server
EXPO_PUBLIC_DATA_SOURCE=local
EXPO_PUBLIC_DATA_SOURCE=auto
```

## Backend URL

Default HTTPS:

```bash
EXPO_PUBLIC_API_BASE_URL=https://group1.it4788.sukkaito.id.vn/it4788
```

HTTP fallback:

```bash
EXPO_PUBLIC_API_BASE_URL=http://group1.it4788.sukkaito.id.vn/it4788
```

## Lệnh kiểm tra

```bash
docker compose build
docker compose run --rm expo npm run lint
docker compose run --rm expo sh -lc 'npx expo-doctor'
```

Probe backend:

```bash
docker compose run --rm expo sh -lc 'PROBE_COMPACT=1 npm run backend:probe'
```

E2E server với existing accounts, truyền credential qua env vars:

```bash
docker compose run --rm expo sh -lc '
  E2E_USE_EXISTING_ACCOUNTS=1 \
  E2E_HV_PHONE=<hv-phone> \
  E2E_GV_PHONE=<gv-phone> \
  E2E_PASSWORD=<password> \
  npm run e2e:server
'
```

Không commit credential thật vào repo.

## Upload/video fixture

Video test local có thể đặt ở:

```text
video/cam1.mp4
video/cam2.mp4
```

Các file này phải được ignore và không commit. Nếu chạy E2E upload:

```bash
E2E_VIDEO_LEFT=/app/video/cam1.mp4
E2E_VIDEO_RIGHT=/app/video/cam2.mp4
```

Hiện upload backend thật vẫn bị chặn vì deployed route trả `Unexpected field` cho các field name đã thử.

## Navigation hiện tại

Leader đã đổi sang top navigator 4 section:

- Home
- Friends
- Notifications
- Profile

Không restore Courses/Search thành tab. API-backed route vẫn có thể dùng non-tab:

- `/search`
- `/courses`
- `/settings/*`
- `/chat`
- `/post/*`

## Làm UI screen

UI screen nên đọc `docs/API_HANDOFF_FOR_UI_TEAM.md` và gọi repository thay vì raw `fetch`.

Ví dụ:

- Home gọi `postRepository.getFeedPage()` và `postRepository.checkNewItems()`.
- Search gọi `postRepository.searchPosts()` và saved search functions.
- Friends hiện dùng `search`, `get_user_info`, `get_list_blocks`, `set_block` vì deployed friend routes 404.
- Notifications gọi `notificationRepository.getNotificationPage()` và `markNotificationRead()`.
- Profile gọi `userRepository.getUserInfo()` và auth/logout/settings repositories.

## Troubleshooting Expo trong Docker

- Nếu web không mở: kiểm tra `docker compose ps` và port `8081`.
- Nếu dependency mismatch: chạy lại `docker compose build`.
- Nếu Metro cache lạ: dùng script `npm run start:clear` trong container nếu package hỗ trợ.
- Nếu dùng phone browser: cùng Wi-Fi và mở `http://<HOST_LAN_IP>:8081`.
- Expo Go native trong Docker có thể quảng cáo IP container `172.x.x.x`; browser-over-LAN là đường test ổn định hơn.
