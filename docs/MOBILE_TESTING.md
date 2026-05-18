# Kiểm Thử Trên Điện Thoại

Mục tiêu: có đường test mobile thực dụng, không bị kẹt vì Expo Go/native networking trong Docker.

## Đường ổn định: phone browser qua LAN

1. Chạy app bằng Docker:

```bash
EXPO_PUBLIC_API_TYPE=backend docker compose up
```

2. Tìm IP LAN của máy host trên macOS:

```bash
ipconfig getifaddr en0
```

Nếu dùng mạng khác, thử `en1`.

3. Đảm bảo điện thoại và máy host cùng Wi-Fi.
4. Mở browser trên điện thoại:

```text
http://<HOST_LAN_IP>:8081
```

Ví dụ:

```text
http://192.168.1.20:8081
```

5. Login bằng account backend thật hoặc chạy mock mode nếu backend không ổn định.

## Test upload trên phone browser

- Server mode cần file video thật.
- Chọn 2 video local từ điện thoại nếu browser hỗ trợ file picker.
- Mỗi video cần >=10 giây và duration tương tự.
- Nếu backend trả `Unexpected field`, đây là mismatch multipart đã biết, không phải lỗi UI chọn file.

## Mock mode trên điện thoại

```bash
EXPO_PUBLIC_API_TYPE=mock docker compose up
```

Mở cùng URL LAN. Mock mode không gọi backend, dùng để UI team test layout/flow khi server không ổn định.

## Expo Go / native path

Expo Go trong Docker có thể quảng cáo URL dạng container IP như:

```text
exp://172.x.x.x:8081
```

Điện thoại thường không truy cập được IP container này từ LAN. Có thể thử tunnel nếu project script hỗ trợ:

```bash
docker compose run --rm expo npm run mobile:tunnel
```

Tunnel có thể cần `@expo/ngrok` hoặc login Expo tùy SDK/tooling. Không coi Expo Go là đường test chính cho đợt này nếu chưa verify được thật.

## Kết luận

Browser-over-LAN là đường mobile test chính đã được khuyến nghị. Expo Go/native chỉ best-effort cho tới khi team xác nhận command tunnel/LAN hoạt động ổn trong môi trường Docker.
