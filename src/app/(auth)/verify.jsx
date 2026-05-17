import authApi from "@/api/auth";
import AppButton from "@/components/common/AppButton";
import AppInput from "@/components/common/AppInput";
import Screen from "@/components/common/Screen";
import authStyles from "@/styles/auth/base.styles";
import { validateVerifyCode } from "@/utils/validation";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Text } from "react-native";

export default function VerifyScreen() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const params = useLocalSearchParams();
  const phonenumber = typeof params.phonenumber === "string" ? params.phonenumber : "";
  const signupRequestId = typeof params.signupRequestId === "string" ? params.signupRequestId : "";
  const role = typeof params.role === "string" ? params.role : "";
  const verifyCode = typeof params.verifyCode === "string" ? params.verifyCode : "";
  const signupToken = typeof params.token === "string" ? params.token : "";

  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return undefined;
    }

    const timer = setTimeout(() => {
      setCountdown((value) => value - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  const goToChangeInfo = (data = {}) => {
    router.replace({
      pathname: "/(auth)/change-info-after-signup",
      params: {
        token: data.token || "",
        phonenumber: data.phonenumber || phonenumber,
        signupRequestId: data.signupRequestId || signupRequestId,
        role: data.role || role,
        verifiedLocally: data.verifiedLocally || "",
      },
    });
  };

  const handleResend = async () => {
    if (!canResend || !phonenumber || !signupRequestId) return;

    setIsLoading(true);
    try {
      const response = await authApi.getVerifyCode({ phonenumber, signupRequestId });
      if (response.code === "1000") {
        setCountdown(60);
        setCanResend(false);
        Alert.alert("Thành công", response.message || "Đã gửi lại mã xác thực.");
      } else {
        Alert.alert("Lỗi", response.message || "Gửi lại mã thất bại.");
      }
    } catch {
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
      const matchesDisplayedCode =
        verifyCode && normalizedCode.toLowerCase() === verifyCode.toLowerCase();

      const response = await authApi.checkVerifyCode({
        phonenumber,
        code: normalizedCode,
        signupRequestId,
      });

      if (response.code === "1000") {
        const data = response.data || {};
        const token = data.token || response.token || "";
        if (!token) {
          if (matchesDisplayedCode) {
            goToChangeInfo({
              token: signupToken || `local_verify_${signupRequestId || Date.now()}`,
              phonenumber,
              signupRequestId,
              role,
              verifiedLocally: "1",
            });
            return;
          }
          Alert.alert("Lỗi", "Máy chủ không trả về token sau khi xác minh.");
          return;
        }
        goToChangeInfo({ ...data, token });
        return;
      }

      if (matchesDisplayedCode) {
        goToChangeInfo({
          token: signupToken || `local_verify_${signupRequestId || Date.now()}`,
          phonenumber,
          signupRequestId,
          role,
          verifiedLocally: "1",
        });
        return;
      }

      if (response.code === "1004") {
        setError("Mã xác thực không chính xác.");
        return;
      }

      if (response.code === "1002") {
        setError("Vui lòng nhập đầy đủ thông tin.");
        return;
      }

      Alert.alert("Lỗi", response.message || "Đã có lỗi xảy ra.");
    } catch (verifyError) {
      const matchesDisplayedCode =
        verifyCode && normalizedCode.toLowerCase() === verifyCode.toLowerCase();

      if (matchesDisplayedCode) {
        goToChangeInfo({
          token: signupToken || `local_verify_${signupRequestId || Date.now()}`,
          phonenumber,
          signupRequestId,
          role,
          verifiedLocally: "1",
        });
        return;
      }

      Alert.alert("Lỗi", verifyError.message || "Không thể kết nối đến máy chủ.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Screen style={authStyles.container}>
      <Text style={authStyles.title}>Xác minh</Text>
      <Text style={authStyles.subtitle}>
        Nhập mã xác thực gửi tới số điện thoại {phonenumber}.
        {verifyCode ? ` Mã xác minh: ${verifyCode}.` : " Mã xác minh mặc định: 123456."}
      </Text>

      <AppInput
        label="Mã xác thực"
        placeholder="Nhập 6 ký tự"
        value={code}
        onChangeText={(value) => {
          setCode(value);
          if (error) setError("");
        }}
        autoCapitalize="none"
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
