import AppButton from '@/components/common/AppButton';
import baseStyles from '@/styles/auth/base.styles';
import birthdayStyles from '@/styles/auth/birthday.styles';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, StatusBar, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ITEM_HEIGHT = 56;

function daysInMonth(month, year) {
  return new Date(year, month, 0).getDate();
}

function isAtLeast13(day, month, year) {
  const today = new Date();
  const birth = new Date(year, month - 1, day);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }

  return age >= 13;
}

const styles = { ...baseStyles, ...birthdayStyles };

function WheelColumn({ data, selectedValue, onChange }) {
  const listRef = useRef(null);
  const isUserScrollRef = useRef(false);
  const didInitRef = useRef(false);
  const lastWheelTimeRef = useRef(0);
  const selectedIndex = Math.max(0, data.indexOf(selectedValue));
  const applyIndexFromOffset = (offsetY) => {
    const nextIndex = Math.round(offsetY / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(nextIndex, data.length - 1));
    onChange(data[clampedIndex]);
  };

  useEffect(() => {
    if (!listRef.current) return;
    if (!didInitRef.current) {
      didInitRef.current = true;
      listRef.current.scrollToIndex({
        index: selectedIndex,
        animated: false,
      });
      return;
    }

    if (!isUserScrollRef.current) {
      listRef.current.scrollToIndex({
        index: selectedIndex,
        animated: true,
      });
    }
  }, [selectedIndex]);

  return (
    <FlatList
      ref={listRef}
      data={data}
      keyExtractor={(item) => String(item)}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_HEIGHT}
      snapToAlignment="center"
      disableIntervalMomentum
      decelerationRate={0.9}
      contentContainerStyle={styles.birthdayColumnContent}
      style={styles.birthdayColumnList}
      scrollEventThrottle={16}
      bounces={false}
      overScrollMode="never"
      getItemLayout={(_, index) => ({
        length: ITEM_HEIGHT,
        offset: ITEM_HEIGHT * index,
        index,
      })}
      onScrollBeginDrag={() => {
        isUserScrollRef.current = true;
      }}
      onWheel={(event) => {
        const now = Date.now();
        if (now - lastWheelTimeRef.current < 80) {
          if (event?.preventDefault) event.preventDefault();
          return;
        }
        lastWheelTimeRef.current = now;

        const direction = event?.nativeEvent?.deltaY > 0 ? 1 : -1;
        const nextIndex = Math.max(0, Math.min(selectedIndex + direction, data.length - 1));

        if (event?.preventDefault) event.preventDefault();

        if (nextIndex !== selectedIndex && listRef.current) {
          isUserScrollRef.current = true;
          listRef.current.scrollToIndex({ index: nextIndex, animated: true });
          onChange(data[nextIndex]);
          isUserScrollRef.current = false;
        }
      }}
      onScrollEndDrag={(event) => {
        const velocityY = Math.abs(event.nativeEvent.velocity?.y ?? 0);
        if (velocityY < 0.02) {
          applyIndexFromOffset(event.nativeEvent.contentOffset.y);
          isUserScrollRef.current = false;
        }
      }}
      onMomentumScrollEnd={(event) => {
        applyIndexFromOffset(event.nativeEvent.contentOffset.y);
        isUserScrollRef.current = false;
      }}
      renderItem={({ item }) => {
        const isSelected = item === selectedValue;

        return (
          <View style={styles.birthdayItem}>
            <Text style={[styles.birthdayItemText, isSelected && styles.birthdayItemTextSelected]}>
              {String(item).padStart(2, '0')}
            </Text>
          </View>
        );
      }}
    />
  );
}

export default function SignupBirthdayScreen() {
  const params = useLocalSearchParams();
  const fullName = typeof params.fullName === 'string' ? params.fullName : '';

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/(auth)/name');
  };

  const now = new Date();
  const [day, setDay] = useState(now.getDate());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear() - 18);
  const [error, setError] = useState('');

  const years = useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 100 }, (_, i) => current - i);
  }, []);

  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);

  const days = useMemo(() => {
    return Array.from({ length: daysInMonth(month, year) }, (_, i) => i + 1);
  }, [month, year]);

  useEffect(() => {
    const maxDay = daysInMonth(month, year);
    if (day > maxDay) {
      setDay(maxDay);
    }
  }, [day, month, year]);

  const handleContinue = () => {
    if (!isAtLeast13(day, month, year)) {
      setError('Bạn cần từ 13 tuổi trở lên để đăng ký tài khoản.');
      return;
    }

    setError('');
    router.push({
      pathname: '/(auth)/terms',
      params: {
        fullName,
        birthDate: `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`,
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.container}>
        <View style={styles.signupHeaderRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
            onPress={handleBack}
            style={styles.signupBackButton}
          >
            <Text style={styles.signupBackText}>←</Text>
          </Pressable>

          <Text style={styles.signupHeaderTitle}>Ngày sinh</Text>
        </View>

        <View style={styles.birthdayBody}>
          <Text style={styles.birthdayQuestion}>Sinh nhật của bạn khi nào?</Text>

          <View style={styles.birthdayPickerShell}>
            <View style={styles.birthdayPickerHighlight} pointerEvents="none" />

            <View style={styles.birthdayColumns}>
              <WheelColumn data={days} selectedValue={day} onChange={setDay} />
              <WheelColumn data={months} selectedValue={month} onChange={setMonth} />
              <WheelColumn data={years} selectedValue={year} onChange={setYear} />
            </View>
          </View>

          <Text style={styles.birthdayHint}>Bạn cần đủ 13 tuổi để tạo tài khoản.</Text>
          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.birthdayButtonWrap}>
            <AppButton
              title="Tiếp"
              onPress={handleContinue}
              style={styles.ctaButton}
              textStyle={styles.ctaText}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
