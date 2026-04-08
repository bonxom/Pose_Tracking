# Auth Flow Phone-Only - Hướng Dẫn Hoàn Chỉnh

## 📋 Trạng Thái Hiện Tại

Workspace **đã được cập nhật hoàn toàn** sang flow **phone-only** theo spec. Nếu file zip bạn nhận được vẫn là flow cũ, hãy **pull lại từ Git repo** để cập nhật.

---

## 🔄 Flow Đăng Ký (Phone-Only)

### 1️⃣ **Signup Screen** (`src/app/(auth)/signup.jsx`)

**Nhập:**
- Số điện thoại (10 chữ số, bắt đầu `0`)
- Mật khẩu (6-20 ký tự, không ký tự đặc biệt)
- Vai trò: Học viên (HV) / Giáo viên (GV)

**Hành động:**
- Validate input bằng `validatePhoneNumber`, `validatePassword`, `validateRole`
- Gọi `authApi.signup({ phonenumber, password, uuid, role })`
- Nếu **thành công** → Alert hiển thị **mã OTP test: 123456** + chuyển sang Verify
- Nếu **trùng số** → Hiển thị lỗi "Số điện thoại này đã được đăng ký"

**Mã OTP cứng:** `123456` (dùng để test trực tiếp)

---

### 2️⃣ **Verify Screen** (`src/app/(auth)/verify.jsx`)

**Nhận params:**
- `phonenumber`: từ signup
- `signupRequestId`: request ID độc nhất
- ~~role~~ (không còn dùng)

**Nhập:**
- Mã OTP 6 chữ số

**Hành động:**
- Validate mã bằng `validateVerifyCode`
- Gọi `authApi.checkVerifyCode({ phonenumber, code, signupRequestId })`
- Countdown 60 giây, sau đó cho phép "Gửi lại mã"
- Nếu **đúng** → Chuyển sang Change Info After Signup, truyền `signupRequestId`

**Test:** Nhập `123456`

---

### 3️⃣ **Change Info After Signup** (`src/app/(auth)/change-info-after-signup.jsx`)

**Nhận params:**
- `token`: từ verify
- `phonenumber`: từ verify
- `signupRequestId`: từ verify (để lấy password & role)

**Nhập:**
- Tên người dùng (không được bỏ trống)
- Chiều cao (50-250 cm)
- Ảnh đại diện (optional, dùng `expo-image-picker`)

**Hành động:**
- Validate username & height
- Gọi `authApi.changeInfoAfterSignup({ token, phonenumber, username, height, avatar, signupRequestId })`
- API **lấy password từ signupRequestId** để lưu user
- Save session: `saveAuthSession({ id, token, phonenumber, username, role, avatar, height, loggedInAt })`
- **Chuyển sang** `/(tabs)/home`

---

## 🔐 Flow Đăng Nhập (Phone-Only)

### Login Screen (`src/app/(auth)/login.jsx`)

**Nhập:**
- Số điện thoại
- Mật khẩu

**Hành động:**
- Validate bằng `validatePhoneNumber`, `validatePassword`
- Gọi `authApi.login(phonenumber, password)`
- Nếu **đúng** → Save session + vào home
- Nếu **sai** → Hiển thị lỗi "Số điện thoại hoặc mật khẩu không chính xác"

**Test user:**
- Phone: `0123456789`, Password: `Password123`, Role: `HV`
- Phone: `0987654321`, Password: `Teacher123`, Role: `GV`

---

## 🎯 Mock API Endpoints (`src/api/auth.js`)

### `login(phonenumber, password)`
- Check user trong `MOCK_USERS` bằng phonenumber
- Verify password khớp
- Trả về user data đầy đủ

### `signup({ phonenumber, password, uuid, role })`
- Check trùng phonenumber → Error `9998`
- Lưu password + role vào `MOCK_VERIFY_CODES`
- Trả `signupRequestId`, `phonenumber`, `role`, `mock_verify_code`

### `getVerifyCode(phonenumber)`
- Validate phone
- Trả message "Đã gửi"
- Log mã test: `123456`

### `checkVerifyCode({ phonenumber, code, signupRequestId })`
- Tìm request trong `MOCK_VERIFY_CODES`
- Verify mã (phải là `123456`)
- Trả `token`, `phonenumber`, `role`, **`signupRequestId`**

### `changeInfoAfterSignup({ token, phonenumber, username, height, avatar, signupRequestId })`
- Lấy password từ `signupRequestId`
- Tạo user mới: `{ phonenumber, password, role, verified, data }`
- Thêm vào `MOCK_USERS`
- Trả user data để save session
- Xóa signup request khỏi `MOCK_VERIFY_CODES`

---

## 📲 Session Schema (`src/utils/session.js`)

Sau login/signup hoàn tất, session lưu:

```javascript
{
  id: "user_001",
  token: "token_xxx",
  phonenumber: "0123456789",
  username: "Nguyen Van A",
  role: "HV",
  avatar: "",
  height: "170",
  loggedInAt: "2026-04-08T..."
}
```

**Profile** đọc từ session này để hiển thị.

---

## 🧪 Validation Functions (`src/utils/validation.js`)

| Hàm | Dùng Cho |
|-----|----------|
| `validatePhoneNumber(phone)` | Signup + Login input |
| `validatePassword(pass)` | Signup + Login input |
| `validateRole(role)` | Signup role picker |
| `validateVerifyCode(code)` | Verify OTP input |
| `normalizePhoneNumber(phone)` | Trim phone (không .toLowerCase()) |
| `isPhone(value)` | Regex check: `/^0\d{9}$/` |

---

## 👥 Mock Users (`src/constants/mocks/users.js`)

**Không còn email-based user**, chỉ có phone-based:

1. **HV (Học viên)**
   - Phone: `0123456789`
   - Password: `Password123`
   - Username: `Nguyen Van A`
   - Height: `170`

2. **GV (Giáo viên)**
   - Phone: `0987654321`
   - Password: `Teacher123`
   - Username: `Tran Thi B`
   - Height: `165`

---

## ✂️ Flow Cũ (Bỏ)

Các file **vẫn tồn tại** nhưng **không route tới nữa:**

- ~~`name.jsx`~~ - Không dùng
- ~~`birthday.jsx`~~ - Không dùng
- ~~`email.jsx`~~ - Không dùng
- ~~`phone.jsx`~~ - Không dùng
- ~~`password.jsx`~~ - Không dùng
- ~~`terms.jsx`~~ - Không dùng
- ~~`save-login.jsx`~~ - Không dùng

Bạn có thể **xóa sau** hoặc giữ lại (không ảnh hưởng).

---

## 🔗 Luồng Flow Mới (Toàn Bộ)

```
┌─── Login Path ───┐
│                 │
│   login.jsx     │ Nhập phone + password
│        ↓        │
│  authApi.login  │ Check MOCK_USERS
│        ↓        │
│   /(tabs)/home  │ Save session + vào home
│                 │
└─────────────────┘

┌─── Signup Path ────────────┐
│                            │
│   signup.jsx               │ Nhập phone + password + role
│        ↓                   │
│  authApi.signup            │ Check trùng, lưu password
│        ↓                   │ Alert: "Mã: 123456"
│   verify.jsx               │ Nhập OTP
│        ↓                   │
│  authApi.checkVerifyCode   │ Verify mã
│        ↓                   │
│  change-info-...jsx        │ Nhập username + height + avatar
│        ↓                   │
│ changeInfoAfterSignup      │ Lấy password, tạo user, save session
│        ↓                   │
│  /(tabs)/home              │ Vào home, profile hiển thị username
│                            │
└────────────────────────────┘
```

---

## ✅ Checklist Verify

- [ ] Test signup: nhập phone `0987654321`, password `abc1234`, role `GV`
- [ ] Alert hiển thị mã `123456`
- [ ] Verify: nhập `123456`
- [ ] Change Info: nhập username `Chủ Khánh`, height `175`, chọn ảnh
- [ ] Vào home, profile hiển thị `Chủ Khánh`
- [ ] Logout
- [ ] Login: phone `0987654321`, password `abc1234`
- [ ] Vào home, profile vẫn là `Chủ Khánh`
- [ ] Test signup trùng: phone `0123456789` → Error "Số điện thoại đã được đăng ký"

---

## 📝 Ghi Chú Cuối

Nếu bạn nhận được file zip vẫn là **flow cũ (nhiều bước Facebook)**:

1. **Thử pull repo mới** từ Git
2. Hoặc **copy toàn bộ folder `src/app/(auth)/`** từ workspace hiện tại

**Workspace hiện tại đã 100% phone-only theo spec.**

---

*Last updated: 2026-04-08*
