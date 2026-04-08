# ⚡ Quick Start - Test Auth Flow Phone-Only

## 🚀 Bắt Đầu Nhanh

### Test User Có Sẵn
```
Account 1 (HV - Học viên):
  Phone:    0123456789
  Password: Password123
  Username: Nguyen Van A
  Height:   170

Account 2 (GV - Giáo viên):
  Phone:    0987654321
  Password: Teacher123
  Username: Tran Thi B
  Height:   165
```

---

## 📱 Scenario 1: Test Login Với User Có Sẵn

**Bước 1:** Mở app → Login screen

**Bước 2:** Nhập
```
Phone:    0123456789
Password: Password123
```

**Bước 3:** Bấm "Đăng nhập"
- ✅ Chuyển sang Home
- ✅ Profile hiển thị: "Nguyen Van A", 170cm

**Bước 4:** Check Profile
- Avatar: trống (hoặc mặc định)
- Name: Nguyen Van A
- Height: 170

---

## 📝 Scenario 2: Test Signup Flow Hoàn Chỉnh

### 2a. Signup (Tạo Tài Khoản Mới)

**Bước 1:** Login screen → Bấm "Tạo tài khoản mới"
→ Signup screen

**Bước 2:** Nhập thông tin
```
Số điện thoại: 0111111111  (chưa tồn tại)
Mật khẩu:     newpass123   (6-20 ký tự, không ký tự đặc biệt)
Vai trò:      Học viên (HV)
```

**Bước 3:** Bấm "Tiếp"
- ✅ Alert hiển thị:
  ```
  Thành công
  Đăng ký thành công.
  
  Mã xác minh: 123456
  ```

### 2b. Xác Minh OTP (Verify)

**Bước 4:** Bấm "OK" trên alert
→ Verify screen

**Bước 5:** Nhập mã OTP
```
Mã xác thực: 123456
```

**Bước 6:** Bấm "Xác nhận"
- ✅ Chuyển sang Change Info screen
- Countdown 60s (resend button sẽ active sau đó)

### 2c. Hoàn Tất Thông Tin (Change Info)

**Bước 7:** Nhập thông tin cá nhân
```
Tên người dùng: Tôi Là New User
Chiều cao (cm): 175
Ảnh đại diện:   (optional - bấm "Chọn ảnh")
```

**Bước 8:** Bấm "Hoàn thành"
- ✅ Save session
- ✅ Chuyển sang Home
- ✅ Profile hiển thị: "Tôi Là New User", 175cm

### 2d. Test Login Lại

**Bước 9:** Home → Logout (hoặc back)
→ Login screen

**Bước 10:** Nhập
```
Phone:    0111111111
Password: newpass123
```

**Bước 11:** Bấm "Đăng nhập"
- ✅ Chuyển sang Home
- ✅ Profile vẫn hiển thị: "Tôi Là New User", 175cm
- ✅ **Xác nhận: password đúng được lưu!**

---

## ❌ Scenario 3: Test Error Cases

### 3a. Signup - Trùng Số Điện Thoại

**Input:**
```
Phone:    0123456789  (đã tồn tại)
Password: password123
Role:     HV
```

**Expected:** Error "Số điện thoại này đã được đăng ký"

### 3b. Signup - Password Quá Ngắn

**Input:**
```
Phone:    0222222222
Password: abc12       (< 6 ký tự)
Role:     GV
```

**Expected:** Error "Mật khẩu từ 6-20 ký tự..."

### 3c. Signup - Không Chọn Role

**Input:**
```
Phone:    0222222222
Password: password123
Role:     (không chọn)
```

**Expected:** Error "Vui lòng chọn vai trò"

### 3d. Verify - Mã Sai

**Input (Verify screen):**
```
Mã xác thực: 000000  (sai - đúng là 123456)
```

**Expected:** Error "Mã xác thực không chính xác"

### 3e. Login - Tài Khoản Không Tồn Tại

**Input:**
```
Phone:    0999999999  (không có trong mock)
Password: password123
```

**Expected:** Error "Tài khoản chưa được đăng ký"

### 3f. Login - Password Sai

**Input:**
```
Phone:    0123456789
Password: wrongpassword
```

**Expected:** Error "Số điện thoại hoặc mật khẩu không chính xác"

---

## 🎯 Checklist Hoàn Chỉnh

- [ ] Login được với user có sẵn
- [ ] Profile hiển thị username (không hardcode)
- [ ] Signup flow: phone + password + role
- [ ] Alert hiển thị mã 123456
- [ ] Verify: nhập 123456 thành công
- [ ] Change Info: nhập username + height
- [ ] Home sau signup: profile hiển thị username mới
- [ ] Logout + login lại với mật khẩu đăng ký → OK
- [ ] Signup trùng phone → Error
- [ ] Verify mã sai → Error
- [ ] Login sai password → Error

---

## 🔧 Nếu Có Issue

### App Crashes

- Check console cho error log
- Ensure `expo-image-picker` installed: `npx expo install expo-image-picker`
- Ensure all imports correct

### Session Không Persist

- Check `getAuthSession` / `saveAuthSession` works
- Clear app cache + reinstall

### OTP Validation Fails

- Mã cố định: `123456`
- Không case-sensitive, nhưng phải đúng 6 chữ số

### Avatar Picker Không Work

- Cần permission: iOS + Android
- Test với simulator có hỗ trợ file picker

---

## 📊 Flow Diagram (Text)

```
┌─────────────────────────────────────────┐
│          Auth Entry (index.jsx)         │
├─────────────────────────────────────────┤
│                                         │
├─→ [No Session] → Login Screen          │
│   ├─ Phone + Password                  │
│   └─ → authApi.login()                 │
│       └─ → Home (Session Saved)        │
│                                         │
└─→ [Signup Flow]                        │
    ├─ Signup Screen                     │
    │  ├─ Phone + Password + Role        │
    │  └─ → authApi.signup()             │
    │      ├─ Check Duplicate ✅         │
    │      ├─ Store Password ✅          │
    │      └─ Return signupRequestId     │
    │                                     │
    └─→ Verify Screen                    │
       ├─ OTP Input (123456)             │
       └─ → authApi.checkVerifyCode()    │
           ├─ Validate Mã                │
           └─ Return signupRequestId     │
                                         │
           └─→ Change Info Screen        │
              ├─ Username + Height       │
              ├─ Avatar Picker           │
              └─ → authApi.changeInfoAfterSignup()
                  ├─ Get Password from signupRequestId ✅
                  ├─ Create User          │
                  └─ Save Session         │
                                         │
                  └─→ Home               │
                     └─ Profile from Session ✅
```

---

## 🚨 Known Limitations (Mock)

- 🔴 Password không hash (plain text)
- 🔴 Token không verify (fake JWT)
- 🔴 OTP không gửi SMS (in-memory 123456)
- 🔴 Session không expire
- 🔴 No real database (MOCK_USERS array)

**Bên deploy thật: dùng real auth service!**

---

*Ready to test! 🎉*
