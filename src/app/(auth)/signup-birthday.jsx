import AppButton from "@/components/common/AppButton";
import baseStyles from "@/styles/auth/base.styles";
import signupStyles from "@/styles/auth/signup.styles";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const styles = { ...baseStyles, ...signupStyles };
const ITEM_HEIGHT = 36;
const VISIBLE_ITEMS = 5;
const PICKER_PADDING = ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2);

const getDaysInMonth = (year, month) => {
  return new Date(year, month, 0).getDate();
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export default function SignupBirthdayScreen() {
  const params = useLocalSearchParams();
  const phonenumber =
    typeof params.phonenumber === "string" ? params.phonenumber : "";
  const signupRequestId =
    typeof params.signupRequestId === "string" ? params.signupRequestId : "";
  const username =
    typeof params.username === "string" ? params.username : "";
  const height = typeof params.height === "string" ? params.height : "";
  const role = typeof params.role === "string" ? params.role : "";

  const today = new Date();
  const maxYear = today.getFullYear();
  const minYear = 1950;

  const initialYear = clamp(2000, minYear, maxYear);
  const initialMonth = 8;
  const initialDay = 4;

  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [day, setDay] = useState(initialDay);
  const [error, setError] = useState("");

  const dayRef = useRef(null);
  const monthRef = useRef(null);
  const yearRef = useRef(null);

  const years = useMemo(() => {
    const list = [];
    for (let y = maxYear; y >= minYear; y -= 1) {
      list.push(y);
    }
    return list;
  }, [maxYear]);

  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);

  const days = useMemo(() => {
    const count = getDaysInMonth(year, month);
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [year, month]);

  const scrollToIndex = (ref, index) => {
    if (!ref.current) return;
    ref.current.scrollTo({ y: index * ITEM_HEIGHT, animated: false });
  };

  useEffect(() => {
    const dayIndex = clamp(day - 1, 0, days.length - 1);
    const monthIndex = clamp(month - 1, 0, months.length - 1);
    const yearIndex = clamp(years.indexOf(year), 0, years.length - 1);

    scrollToIndex(dayRef, dayIndex);
    scrollToIndex(monthRef, monthIndex);
    scrollToIndex(yearRef, yearIndex);
  }, []);

  useEffect(() => {
    if (day > days.length) {
      setDay(days.length);
      return;
    }
    const dayIndex = clamp(day - 1, 0, days.length - 1);
    scrollToIndex(dayRef, dayIndex);
  }, [day, days.length]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(auth)/login");
  };

  const handleScrollEnd = (event, items, onSelect) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = clamp(Math.round(offsetY / ITEM_HEIGHT), 0, items.length - 1);
    onSelect(items[index]);
  };

  const handleSubmit = () => {
    const selectedDate = new Date(year, month - 1, day);

    setError("");
    const birthday = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    router.push({
      pathname: "/(auth)/signup",
      params: {
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
          <Text style={styles.welcomeTopTitle}>Ngày sinh</Text>
        </View>
        <View style={styles.welcomeDivider} />

        <View style={styles.birthdayBody}>
          <Text style={styles.birthdayTitle}>Sinh nhật của bạn khi nào?</Text>

          <View style={styles.pickerWrapper}>
            <View style={styles.pickerRow}>
              <View style={styles.pickerColumn}>
                <ScrollView
                  ref={dayRef}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={ITEM_HEIGHT}
                  decelerationRate="normal"
                  disableIntervalMomentum
                  onMomentumScrollEnd={(event) =>
                    handleScrollEnd(event, days, setDay)
                  }
                  contentContainerStyle={{ paddingVertical: PICKER_PADDING }}
                >
                  {days.map((value) => (
                    <View key={`day-${value}`} style={styles.pickerItem}>
                      <Text
                        style={[
                          styles.pickerItemText,
                          value === day && styles.pickerItemTextActive,
                        ]}
                      >
                        {String(value).padStart(2, "0")}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
                <View pointerEvents="none" style={styles.pickerIndicator} />
              </View>

              <View style={styles.pickerColumn}>
                <ScrollView
                  ref={monthRef}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={ITEM_HEIGHT}
                  decelerationRate="normal"
                  disableIntervalMomentum
                  onMomentumScrollEnd={(event) =>
                    handleScrollEnd(event, months, setMonth)
                  }
                  contentContainerStyle={{ paddingVertical: PICKER_PADDING }}
                >
                  {months.map((value) => (
                    <View key={`month-${value}`} style={styles.pickerItem}>
                      <Text
                        style={[
                          styles.pickerItemText,
                          value === month && styles.pickerItemTextActive,
                        ]}
                      >
                        thg {value}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
                <View pointerEvents="none" style={styles.pickerIndicator} />
              </View>

              <View style={styles.pickerColumn}>
                <ScrollView
                  ref={yearRef}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={ITEM_HEIGHT}
                  decelerationRate="normal"
                  disableIntervalMomentum
                  onMomentumScrollEnd={(event) =>
                    handleScrollEnd(event, years, setYear)
                  }
                  contentContainerStyle={{ paddingVertical: PICKER_PADDING }}
                >
                  {years.map((value) => (
                    <View key={`year-${value}`} style={styles.pickerItem}>
                      <Text
                        style={[
                          styles.pickerItemText,
                          value === year && styles.pickerItemTextActive,
                        ]}
                      >
                        {value}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
                <View pointerEvents="none" style={styles.pickerIndicator} />
              </View>
            </View>
          </View>

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.welcomeButtonWrap}>
            <AppButton
              title="Tiếp"
              onPress={handleSubmit}
              style={styles.ctaButton}
              textStyle={styles.ctaText}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
