import authApi from "@/api/auth";
import AppButton from "@/components/common/AppButton";
import AppInput from "@/components/common/AppInput";
import Screen from "@/components/common/Screen";
import authStyles from "@/styles/auth/base.styles";
import { saveAuthSession } from "@/utils/session";
import { validateVerifyCode } from "@/utils/validation";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Platform, Text } from "react-native";

export default function VerifyScreen() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const params = useLocalSearchParams();
  const phonenumber =
    typeof params.phonenumber === "string" ? params.phonenumber : "";
  const signupRequestId =
    typeof params.signupRequestId === "string" ? params.signupRequestId : "";
  const username =
    typeof params.username === "string" ? params.username : "";
  const height = typeof params.height === "string" ? params.height : "";

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  const handleResend = async () => {
    if (!canResend || !phonenumber || !signupRequestId) return;

    setIsLoading(true);
    try {
      const response = await authApi.getVerifyCode({ phonenumber, signupRequestId });
      if (response.code === "1000") {
        setCountdown(60);
        setCanResend(false);
        Alert.alert("Thành công", response.message);
      } else {
        Alert.alert("Lỗi", response.message || "Gửi lại mã thất bại.");
      }
    } catch (_error) {
      Alert.alert("Lỗi", "Không thể kết nối đến máy chủ.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    const normalizedCode = code.trim();
    const codeErr = validateVerifyCode(normalizedCode);

    if (codeErr) {
      setError(codeErr);
      return;
    }

    if (!signupRequestId || !phonenumber) {
      setError("Dữ liệu phiên không hợp lệ. Vui lòng đăng ký lại.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const response = await authApi.checkVerifyCode({
        phonenumber,
        code: normalizedCode,
        signupRequestId,
      });
      switch (response.code) {
        case "1000": {
          const completeResponse = await authApi.changeInfoAfterSignup({
            token: response.data.token,
            phonenumber: response.data.phonenumber,
            username,
            height,
            avatar: "",
            signupRequestId: response.data.signupRequestId,
          });

          if (completeResponse.code !== "1000") {
            Alert.alert("Lỗi", completeResponse.message || "Đã có lỗi xảy ra.");
            break;
          }

          try {
            await saveAuthSession({
              id: completeResponse.data.id,
              token: completeResponse.data.token,
              phonenumber: completeResponse.data.phonenumber,
              username: completeResponse.data.username,
              role: completeResponse.data.role,
              avatar: completeResponse.data.avatar,
              height: completeResponse.data.height,
              loggedInAt: new Date().toISOString(),
            });
          } catch (storageError) {
            console.warn("Cannot persist session:", storageError);
          }

          const navigateToSuccess = () =>
            router.replace({
              pathname: "/(auth)/signup-success",
              params: {
                username: completeResponse.data.username || username,
              },
            });

          if (Platform.OS === "web") {
            navigateToSuccess();
            break;
          }

          navigateToSuccess();
          break;
        }
        case "1004":
          setError("Mã xác thực không chính xác.");
          break;
        case "1002":
          setError("Vui lòng nhập đầy đủ thông tin.");
          break;
        default:
          Alert.alert("Lỗi", response.message || "Đã có lỗi xảy ra.");
      }
    } catch (_error) {
      Alert.alert("Lỗi", "Không thể kết nối đến máy chủ.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Screen style={authStyles.container}>
      <Text style={authStyles.title}>Xác minh</Text>
      <Text style={authStyles.subtitle}>
        Nhập mã xác thực gửi tới số điện thoại {phonenumber}.
        Mã xác minh mặc định: 123456.
      </Text>

      <AppInput
        label="Mã xác thực"
        placeholder="Nhập 6 chữ số"
        value={code}
        onChangeText={(value) => {
          setCode(value);
          if (error) setError("");
        }}
        keyboardType="number-pad"
        maxLength={6}
        error={error}
        editable={!isLoading}
      />

      <AppButton
        title={isLoading ? "Đang xử lý..." : "Xác nhận"}
        onPress={handleVerify}
        disabled={isLoading}
      />

      <Text style={authStyles.resendLabel}>
        {canResend ? "Bạn có thể gửi lại mã" : `Gửi lại mã trong ${countdown}s`}
      </Text>
      {canResend && (
        <AppButton
          title={isLoading ? "Đang xử lý..." : "Gửi lại mã"}
          onPress={handleResend}
          disabled={isLoading || !canResend}
          style={authStyles.secondaryButton}
          textStyle={authStyles.secondaryButtonText}
        />
      )}
    </Screen>
  );
}

