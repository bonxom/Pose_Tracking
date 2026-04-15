import AppButton from "@/components/common/AppButton";
import baseStyles from "@/styles/auth/base.styles";
import signupStyles from "@/styles/auth/signup.styles";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

const styles = { ...baseStyles, ...signupStyles };

const TERMS_HTML = `
<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      :root {
        --text: #0F172A;
        --muted: #64748B;
        --primary: #2563EB;
        --border: #E2E8F0;
        --surface: #F8FAFC;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
        color: var(--text);
        background: #FFFFFF;
        padding: 16px;
      }
      .card {
        background: #FFFFFF;
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
      }
      h1 {
        font-size: 18px;
        margin: 4px 0 10px;
      }
      .badge {
        display: inline-block;
        font-size: 11px;
        font-weight: 700;
        color: var(--primary);
        background: #DBEAFE;
        padding: 4px 8px;
        border-radius: 999px;
        margin-bottom: 10px;
      }
      p {
        font-size: 14px;
        line-height: 1.6;
        color: #475569;
        margin: 0 0 10px;
      }
      ul {
        padding: 0;
        margin: 0 0 12px;
        list-style: none;
        color: #475569;
        font-size: 14px;
      }
      li {
        display: flex;
        gap: 8px;
        margin-bottom: 8px;
      }
      .dot {
        width: 6px;
        height: 6px;
        margin-top: 8px;
        border-radius: 999px;
        background: #94A3B8;
        flex-shrink: 0;
      }
      a { color: var(--primary); text-decoration: none; font-weight: 600; }
      .muted { color: var(--muted); font-size: 12px; }
      .divider {
        height: 1px;
        background: var(--border);
        margin: 12px 0;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="badge">Hoàn tất đăng ký</div>
      <h1>Điều khoản & Quyền riêng tư</h1>
      <p>Bằng cách nhấn <strong>Đăng ký</strong>, bạn đồng ý với
      <strong>Điều khoản</strong>, <strong>Chính sách dữ liệu</strong> và
      <strong>Chính sách cookie</strong> của chúng tôi.</p>
      <ul>
        <li><span class="dot"></span><span>Chúng tôi có thể gửi thông báo qua SMS.</span></li>
        <li><span class="dot"></span><span>Bạn có thể hủy đăng ký nhận thông báo bất cứ lúc nào.</span></li>
        <li><span class="dot"></span><span>Thông tin dùng để bảo vệ tài khoản và cải thiện trải nghiệm.</span></li>
      </ul>
      <div class="divider"></div>
      <p class="muted">Xem chi tiết tại <a href="#">Chính sách quyền riêng tư</a>.</p>
    </div>
  </body>
</html>
`;

export default function SignupTermsScreen() {
  const params = useLocalSearchParams();
  const phonenumber =
    typeof params.phonenumber === "string" ? params.phonenumber : "";
  const signupRequestId =
    typeof params.signupRequestId === "string" ? params.signupRequestId : "";
  const birthday = typeof params.birthday === "string" ? params.birthday : "";
  const username = typeof params.username === "string" ? params.username : "";
  const height = typeof params.height === "string" ? params.height : "";
  const role = typeof params.role === "string" ? params.role : "";

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(auth)/login");
  };

  const handleSubmit = () => {
    router.push({
      pathname: "/(auth)/verify",
      params: {
        phonenumber,
        signupRequestId,
        birthday,
        username,
        height,
        role,
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.welcomeTopBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
            onPress={handleBack}
            style={styles.welcomeBackButton}
          >
            <Text style={styles.welcomeBackText}>←</Text>
          </Pressable>
          <Text style={styles.welcomeTopTitle}>Điều khoản &amp; quyền riêng tư</Text>
        </View>
        <View style={styles.welcomeDivider} />

        <View style={styles.termsBody}>
          <View style={styles.termsWeb}>
            <WebView
              originWhitelist={["*"]}
              source={{ html: TERMS_HTML }}
              showsVerticalScrollIndicator={false}
            />
          </View>

          <View style={styles.termsFooter}>
            <AppButton
              title="Đăng ký"
              onPress={handleSubmit}
              style={styles.ctaButton}
              textStyle={styles.ctaText}
            />
            <Text style={styles.termsLink}>
              Đăng ký mà không tải danh bạ của tôi lên
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

