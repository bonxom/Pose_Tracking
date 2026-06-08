# Hướng dẫn cấu hình và test Push Notification ngoài app cho Pose_Tracking

Tài liệu này hướng dẫn đầy đủ các bước để một thành viên trong nhóm có thể tự cấu hình, chạy app Android, lấy Expo Push Token và test push notification ngoài app.

---

## 1. Mục tiêu

Sau khi làm đúng các bước, cần đạt được:

- App Android lấy được `ExponentPushToken[...]`.
- App gửi token lên BE qua API `/set_devtoken`.
- Gửi push test qua Expo Push API trả `status: ok`.
- Android emulator/thiết bị hiện notification ngoài app.
- Notification có title/body đúng.
- Notification đi vào channel `push-voice`, không rơi vào `fcm_fallback_notification_channel`.
- BE có thể dùng payload tương tự để gửi push thật khi có like/comment/yêu cầu tham gia khóa học.

---

## 2. Yêu cầu môi trường

Cần cài trước:

- Node.js
- npm
- Git
- Android Studio
- Android Emulator có Google Play Services
- PowerShell trên Windows
- Tài khoản Expo/EAS
- Tài khoản Firebase

Kiểm tra nhanh:

```powershell
node -v
npm -v
adb devices
```

Nếu `adb devices` thấy emulator đang chạy thì OK.

---

## 3. Clone code và cài thư viện

```powershell
git clone https://github.com/bonxom/Pose_Tracking.git
cd Pose_Tracking
```

Checkout branch cần test, ví dụ:

```powershell
git checkout debug/push-notification-local
```

Cài dependencies:

```powershell
npm install
```

---

## 4. Cấu hình `.env`

Tạo file `.env` ở root project nếu chưa có.

Ví dụ:

```env
EXPO_PUBLIC_API_BASE_URL=https://group1.it4788.sukkaito.id.vn/it4788
EXPO_PUBLIC_API_DEBUG=true
EXPO_PUBLIC_API_TIMEOUT_MS=15000
EXPO_PUBLIC_API_TYPE=remote
```

Nếu chạy BE local thì đổi `EXPO_PUBLIC_API_BASE_URL` theo URL local.

---

## 5. Cấu hình Firebase Android từ đầu

Đây là bước quan trọng nhất để Android nhận push notification qua FCM.

Có 2 loại file/cấu hình Firebase khác nhau, không được nhầm:

```txt
1. google-services.json
   → dành cho app Android
   → giúp app đăng ký với Firebase/FCM

2. Firebase Admin SDK Service Account JSON
   → dành cho Expo/EAS
   → giúp Expo Push Service có quyền gửi notification xuống FCM
```

---

### 5.1. Tạo Firebase project

Vào Firebase Console:

```txt
https://console.firebase.google.com
```

Chọn:

```txt
Add project / Create project
```

Đặt tên project, ví dụ:

```txt
posetracking
```

Google Analytics có thể bật hoặc tắt đều được. Sau đó bấm tạo project.

---

### 5.2. Thêm Android app vào Firebase project

Trong Firebase project vừa tạo:

```txt
Project Overview
→ Add app
→ chọn Android icon
```

Điền Android package name:

```txt
com.group1.posetracking
```

Package này phải trùng với `app.json`:

```json
"android": {
  "package": "com.group1.posetracking"
}
```

App nickname có thể đặt:

```txt
Pose_Tracking Android
```

SHA-1 có thể bỏ qua nếu chỉ dùng push notification. Sau đó bấm:

```txt
Register app
```

---

### 5.3. Tải `google-services.json`

Sau khi register Android app, Firebase sẽ cho tải file:

```txt
google-services.json
```

Tải file này về và đặt ở root project:

```txt
Pose_Tracking/google-services.json
```

Kiểm tra file tồn tại:

```powershell
Test-Path .\google-services.json
```

Kết quả đúng:

```txt
True
```

Kiểm tra package trong file:

```powershell
Select-String -Path .\google-services.json -Pattern "package_name"
```

Kết quả đúng phải là:

```txt
"package_name": "com.group1.posetracking"
```

Nếu package không đúng, phải quay lại Firebase tải lại file đúng Android app.

---

### 5.4. Trỏ `google-services.json` trong `app.json`

Trong `app.json`, phần Android cần có:

```json
"android": {
  "package": "com.group1.posetracking",
  "googleServicesFile": "./google-services.json",
  "notification": {
    "defaultChannel": "push-voice"
  }
}
```

Ý nghĩa:

- `package`: định danh app Android.
- `googleServicesFile`: để Expo copy Firebase config vào native Android project.
- `notification.defaultChannel`: để FCM notification mặc định đi vào channel `push-voice`, tránh rơi vào `fcm_fallback_notification_channel`.

Nếu thiếu `notification.defaultChannel`, có thể gặp tình trạng notification hiện chấm, không kêu, hoặc đi vào fallback channel.

---

### 5.5. Tạo Firebase Admin SDK Service Account JSON

File này dùng cho Expo/EAS, không phải app mobile.

Vào Firebase Console:

```txt
Project settings
→ Service accounts
→ Firebase Admin SDK
→ Generate new private key
→ Generate key
```

Firebase sẽ tải về file `.json` có tên kiểu:

```txt
posetracking-firebase-adminsdk-xxxxx.json
```

File đúng sẽ có dạng:

```json
{
  "type": "service_account",
  "project_id": "...",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----...",
  "client_email": "firebase-adminsdk-..."
}
```

Nếu file không có `private_key`, nghĩa là chọn nhầm file. File này khác hoàn toàn với `google-services.json`.

---

### 5.6. Upload Service Account JSON lên EAS

Ở root project chạy:

```powershell
npx.cmd eas-cli credentials -p android
```

Nếu chưa có `eas.json`, chạy trước:

```powershell
npx.cmd eas-cli build:configure
```

Khi vào menu credentials, chọn:

```txt
Android
→ com.group1.posetracking
→ Google Service Account
→ Set up a Google Service Account Key for Push Notifications (FCM V1)
→ Upload new service account key
```

Khi CLI hỏi path, nhập đường dẫn tới file vừa tải từ Firebase, ví dụ:

```txt
F:\IT47881\Pose_Tracking\posetracking-firebase-adminsdk-xxxxx.json
```

Upload thành công sẽ thấy kiểu:

```txt
Google Service Account Key assigned to com.group1.posetracking for FCM V1
```

Nếu upload nhầm `google-services.json`, EAS sẽ báo lỗi vì file đó không phải service account key.

---

### 5.7. Không commit Firebase key lên GitHub

Trong `.gitignore` cần có:

```gitignore
google-services.json
*firebase-adminsdk*.json
```

Không commit `google-services.json` nếu repo public.

Tuyệt đối không commit file:

```txt
firebase-adminsdk-xxxxx.json
```

vì đó là private key.

---

## 6. Cấu hình `app.json` hoàn chỉnh

Ví dụ cấu hình quan trọng trong `app.json`:

```json
{
  "expo": {
    "name": "Pose_Tracking",
    "slug": "Pose_Tracking",
    "version": "1.0.0",
    "scheme": "posetracking",
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#E6F4FE",
        "foregroundImage": "./assets/images/android-icon-foreground.png",
        "backgroundImage": "./assets/images/android-icon-background.png",
        "monochromeImage": "./assets/images/android-icon-monochrome.png"
      },
      "predictiveBackGestureEnabled": false,
      "usesCleartextTraffic": true,
      "package": "com.group1.posetracking",
      "googleServicesFile": "./google-services.json",
      "notification": {
        "defaultChannel": "push-voice"
      }
    },
    "plugins": [
      "expo-router",
      "expo-secure-store",
      "expo-image",
      "expo-web-browser",
      "expo-video",
      [
        "expo-notifications",
        {
          "sounds": [
            "./assets/sounds/voice_notification.wav",
            "./assets/sounds/sms_notification.wav"
          ]
        }
      ]
    ],
    "extra": {
      "eas": {
        "projectId": "a0648591-1768-4245-b5e0-eeecdf3fc004"
      }
    },
    "owner": "anhnbd2005"
  }
}
```

Điểm bắt buộc:

```json
"package": "com.group1.posetracking"
```

```json
"googleServicesFile": "./google-services.json"
```

```json
"notification": {
  "defaultChannel": "push-voice"
}
```

---

## 7. Build và chạy app Android

Nếu mới clone, mới sửa `app.json`, mới thêm `google-services.json`, hoặc mới đổi native config, chạy:

```powershell
npx.cmd expo prebuild --clean
npx.cmd expo run:android
```

Nếu emulator còn app cũ/package cũ, gỡ app trước:

```powershell
adb uninstall com.group1.posetracking
npx.cmd expo run:android
```

Nếu app development build đã được cài rồi và chỉ muốn chạy lại Metro:

```powershell
npx.cmd expo start --dev-client -c
```

Sau đó bấm:

```txt
a
```

Lưu ý:

- `expo start --dev-client` chỉ mở app đã cài.
- Nếu báo `No development build installed`, phải chạy `npx.cmd expo run:android`.

---

## 8. Login và lấy Expo Push Token

Sau khi app mở, login vào tài khoản test.

Trong Metro log cần thấy:

```txt
PUSH_REGISTER_START
PUSH_PROJECT_ID a0648591-1768-4245-b5e0-eeecdf3fc004
EXPO_PUSH_TOKEN: ExponentPushToken[...]
SET_DEV_TOKEN_OK
```

Ví dụ:

```txt
EXPO_PUSH_TOKEN: ExponentPushToken[8NVwgnG6s8UpZyuDXf6Fxd]
SET_DEV_TOKEN_OK {"devtoken": "ExponentPushToken[...]", "devtype": 1}
```

Nếu chưa thấy token:

```txt
Reload app
Logout/login lại
Kiểm tra quyền notification
Kiểm tra google-services.json
Kiểm tra app.json
```

---

## 9. API `/set_devtoken`

Mobile sẽ gửi push token lên BE qua API:

```txt
POST /set_devtoken
```

Body logic:

```json
{
  "token": "USER_LOGIN_TOKEN",
  "devtype": 1,
  "devtoken": "ExponentPushToken[...]"
}
```

Trong đó:

- `devtype = 1`: Android
- `devtype = 0`: iOS
- `devtoken`: Expo Push Token của thiết bị

Log đúng:

```txt
SET_DEV_TOKEN_OK {"devtoken": "ExponentPushToken[...]", "devtype": 1}
```

---

## 10. Test gửi push bằng PowerShell

Trước khi gửi push, đưa app xuống background:

```powershell
adb shell input keyevent 3
```

Sau đó chạy lệnh test. Nhớ thay token bằng token mới nhất trong Metro log.

```powershell
$payload = @{
  to = "ExponentPushToken[PASTE_TOKEN_HERE]"
  title = "giang_vien_mot đã thích bài viết của bạn"
  body = "test 2 video khacs time"
  sound = "default"
  priority = "high"
  channelId = "push-voice"
  data = @{
    screen = "notifications"
    notificationId = "test-with-channel-001"
    targetType = "post"
    targetId = "123"
    avatar = "https://i.pravatar.cc/100"
  }
} | ConvertTo-Json -Depth 10

$headers = @{
  "Accept" = "application/json"
  "Accept-Encoding" = "gzip, deflate"
  "Content-Type" = "application/json; charset=utf-8"
}

$utf8Body = [System.Text.Encoding]::UTF8.GetBytes($payload)

$response = Invoke-RestMethod `
  -Uri "https://exp.host/--/api/v2/push/send" `
  -Method POST `
  -Headers $headers `
  -Body $utf8Body

$response | ConvertTo-Json -Depth 20
```

Kết quả đúng:

```json
{
  "data": {
    "status": "ok",
    "id": "..."
  }
}
```

Mở notification drawer:

```powershell
adb shell cmd statusbar expand-notifications
```

Notification đúng sẽ hiện:

```txt
Pose_Tracking
giang_vien_mot đã thích bài viết của bạn
test 2 video khacs time
```

---

## 11. Test push cho yêu cầu tham gia khóa học

Payload mẫu:

```powershell
$payload = @{
  to = "ExponentPushToken[PASTE_TOKEN_HERE]"
  title = "hoc_vien_bon đã yêu cầu tham gia khóa học của bạn"
  body = "Nhấn để xem chi tiết yêu cầu."
  sound = "default"
  priority = "high"
  channelId = "push-voice"
  data = @{
    screen = "notifications"
    notificationId = "test-course-request-001"
    targetType = "courseJoinRequest"
    targetId = "course_or_request_id"
    avatar = "https://api.dicebear.com/9.x/adventurer/png?seed=hv4"
  }
} | ConvertTo-Json -Depth 10

$headers = @{
  "Accept" = "application/json"
  "Accept-Encoding" = "gzip, deflate"
  "Content-Type" = "application/json; charset=utf-8"
}

$utf8Body = [System.Text.Encoding]::UTF8.GetBytes($payload)

$response = Invoke-RestMethod `
  -Uri "https://exp.host/--/api/v2/push/send" `
  -Method POST `
  -Headers $headers `
  -Body $utf8Body

$response | ConvertTo-Json -Depth 20
```

---

## 12. Check receipt nếu gửi `status: ok` nhưng không hiện

Lấy `id` trong response rồi chạy:

```powershell
$receiptBody = @{
  ids = @("PASTE_PUSH_ID_HERE")
} | ConvertTo-Json -Depth 10

$receipt = Invoke-RestMethod `
  -Uri "https://exp.host/--/api/v2/push/getReceipts" `
  -Method POST `
  -Headers $headers `
  -Body $receiptBody

$receipt | ConvertTo-Json -Depth 20
```

Nếu đúng:

```json
{
  "data": {
    "PUSH_ID": {
      "status": "ok"
    }
  }
}
```

Nếu lỗi:

```json
{
  "status": "error",
  "details": {
    "error": "DeviceNotRegistered"
  }
}
```

thì token đã cũ. Cần reload/login lại để lấy token mới.

---

## 13. Kiểm tra Android notification settings

Mở setting notification của app:

```powershell
adb shell am start -a android.settings.APP_NOTIFICATION_SETTINGS --es android.provider.extra.APP_PACKAGE com.group1.posetracking
```

Cần bật:

```txt
All Pose_Tracking notifications: ON
Thông báo giọng nói: ON
Thông báo SMS: ON
```

Vào `Thông báo giọng nói` cần thấy:

```txt
Show notifications: ON
Default: ON
Pop on screen: ON
Sound: App provided sound
Vibration: ON
```

`Miscellaneous` có thể bật hoặc tắt, nhưng nếu BE/mobile gửi đúng:

```json
"channelId": "push-voice"
```

thì notification phải vào `Thông báo giọng nói`.

---

## 14. Kiểm tra notification có đi đúng channel không

Sau khi gửi push, chạy:

```powershell
adb shell dumpsys notification --noredact | findstr /i "com.group1.posetracking push-voice fcm_fallback"
```

Kết quả đúng là notification active dùng:

```txt
channel=push-voice
```

Nếu thấy:

```txt
channel=fcm_fallback_notification_channel
```

thì kiểm tra lại `app.json` đã có chưa:

```json
"notification": {
  "defaultChannel": "push-voice"
}
```

Sau khi sửa `app.json`, phải rebuild:

```powershell
npx.cmd expo prebuild --clean
npx.cmd expo run:android
```

---

## 15. Payload BE cần gửi khi có notification thật

Mobile đã test OK. BE cần làm tương tự lệnh PowerShell.

Khi tạo notification mới, BE lấy `devtoken` của user nhận thông báo, rồi gửi:

```txt
POST https://exp.host/--/api/v2/push/send
```

Payload chuẩn:

```json
{
  "to": "devtoken của user nhận",
  "title": "giang_vien_mot đã thích bài viết của bạn",
  "body": "test 2 video khacs time",
  "sound": "default",
  "priority": "high",
  "channelId": "push-voice",
  "data": {
    "screen": "notifications",
    "notificationId": "id_notification",
    "targetType": "post",
    "targetId": "id_post",
    "avatar": "avatar_url"
  }
}
```

Với yêu cầu tham gia khóa học:

```json
{
  "to": "devtoken của giảng viên",
  "title": "hoc_vien_bon đã yêu cầu tham gia khóa học của bạn",
  "body": "Nhấn để xem chi tiết yêu cầu.",
  "sound": "default",
  "priority": "high",
  "channelId": "push-voice",
  "data": {
    "screen": "notifications",
    "notificationId": "id_notification",
    "targetType": "courseJoinRequest",
    "targetId": "course_or_request_id",
    "avatar": "avatar_hoc_vien"
  }
}
```

Bắt buộc có:

```json
"channelId": "push-voice"
```

---

## 16. Các field BE nên trả trong API `get_notification`

Mỗi notification nên có:

```json
{
  "type": "courseJoinRequest",
  "objectId": "course_or_request_id",
  "title": "hoc_vien_bon đã yêu cầu tham gia khóa học của bạn",
  "notificationId": "id_notification",
  "created": "2026-06-01T12:18:13.864Z",
  "avatar": "avatar_hoc_vien",
  "group": "1",
  "read": "0"
}
```

Với course request, nên dùng type rõ nghĩa:

```txt
courseJoinRequest
```

Không nên dùng nhầm:

```txt
requestedFriend
```

Nếu cần avatar luôn cập nhật theo người gửi, BE nên lưu `senderId/actorId`, khi gọi `get_notification` thì join sang bảng User để lấy avatar hiện tại.

---

## 17. Fix cache notification khi logout/login tài khoản khác

Nếu logout tài khoản A rồi login tài khoản B mà thông báo bị lẫn/cache, cần reset FE state:

- Reset `notificationCache`.
- Reset badge.
- Reset `lastUnreadCount`.
- Reset `lastNotificationIds`.
- Clear toast notification.
- Khi mở màn Notification, gọi API refresh page đầu với `mergeWithExisting: false`.

Luồng đúng khi logout:

```txt
logout
→ resetInAppNotificationRuntime()
→ resetNotificationCache()
→ set badge = 0
→ chuyển về login
```

Khi vào màn Notification:

```txt
Hiển thị cache nhanh nếu có
Nhưng luôn gọi loadPage({ refresh: true })
Page đầu không merge cache cũ
```

---

## 18. Các lỗi thường gặp

### Lỗi 1: `No development build installed`

Chạy:

```powershell
npx.cmd expo run:android
```

Không dùng `expo start --dev-client` nếu app chưa được cài trên emulator.

---

### Lỗi 2: `FirebaseApp is not initialized`

Kiểm tra:

```powershell
Test-Path .\google-services.json
Select-String -Path .\google-services.json -Pattern "package_name"
```

Package phải là:

```txt
com.group1.posetracking
```

Sau đó rebuild:

```powershell
npx.cmd expo prebuild --clean
npx.cmd expo run:android
```

---

### Lỗi 3: Push trả `InvalidCredentials`

Cần upload Firebase Admin SDK service account key lên EAS:

```powershell
npx.cmd eas-cli credentials -p android
```

Chọn:

```txt
Google Service Account
→ Set up Google Service Account Key for Push Notifications (FCM V1)
→ Upload service account JSON
```

File đúng là file dạng:

```txt
firebase-adminsdk-xxxxx.json
```

Không phải `google-services.json`.

---

### Lỗi 4: `status: ok` nhưng không hiện notification

Check receipt:

```txt
POST https://exp.host/--/api/v2/push/getReceipts
```

Nếu receipt OK thì kiểm tra Android channel:

```powershell
adb shell dumpsys notification --noredact | findstr /i "com.group1.posetracking push-voice fcm_fallback"
```

Nếu notification rơi vào fallback channel, kiểm tra `app.json` có:

```json
"notification": {
  "defaultChannel": "push-voice"
}
```

---

### Lỗi 5: Có tiếng nhưng không thấy notification

Mở notification drawer:

```powershell
adb shell cmd statusbar expand-notifications
```

Kiểm tra app notification settings:

```powershell
adb shell am start -a android.settings.APP_NOTIFICATION_SETTINGS --es android.provider.extra.APP_PACKAGE com.group1.posetracking
```

---

### Lỗi 6: Tiếng Việt bị lỗi font khi test bằng PowerShell

Cần gửi body UTF-8:

```powershell
$utf8Body = [System.Text.Encoding]::UTF8.GetBytes($payload)
```

Header:

```powershell
"Content-Type" = "application/json; charset=utf-8"
```

---

### Lỗi 7: Notification rơi vào `fcm_fallback_notification_channel`

Cần có trong `app.json`:

```json
"notification": {
  "defaultChannel": "push-voice"
}
```

Sau đó rebuild:

```powershell
npx.cmd expo prebuild --clean
npx.cmd expo run:android
```

---

## 19. Chốt kiểm tra thành công

Mobile side được xem là xong nếu có đủ:

```txt
EXPO_PUSH_TOKEN: ExponentPushToken[...]
SET_DEV_TOKEN_OK
Expo Push API trả status: ok
Receipt trả status: ok
Android hiện notification ngoài app
Notification có title/body đúng
dumpsys cho thấy channel=push-voice
```

Nếu test PowerShell OK nhưng like/comment/yêu cầu khóa học thật chưa hiện ngoài app, thì nguyên nhân là BE chưa gọi Expo Push API sau khi tạo notification mới.
