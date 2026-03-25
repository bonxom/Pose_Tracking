import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
export default function HomeScreen() {
    const theme = useTheme();
    return (<ThemedView style={styles.container}>
      <View style={[styles.orb, styles.orbTop, { backgroundColor: '#ff7a59' }]}/>
      <View style={[styles.orb, styles.orbMiddle, { backgroundColor: '#ffd166' }]}/>
      <View style={[styles.orb, styles.orbBottom, { backgroundColor: '#39a0ed' }]}/>

      <SafeAreaView style={styles.safeArea}>
        <View style={[
            styles.cardShadow,
            {
                shadowColor: theme.text,
            },
        ]}>
          <ThemedView type="backgroundElement" style={styles.card}>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: '#111827' }]}>
                <ThemedText style={styles.badgeText}>NEW LOOK</ThemedText>
              </View>
              <View style={[styles.badge, { backgroundColor: '#f15bb5' }]}>
                <ThemedText style={styles.badgeText}>Vui vẻ</ThemedText>
              </View>
            </View>

            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.eyebrow}>
              Trang chủ
            </ThemedText>

            <ThemedText type="title" style={styles.title}>
              Welcome to mấy con gà
            </ThemedText>

            <ThemedText themeColor="textSecondary" style={styles.subtitle}>
              Một góc nhỏ màu mè hơn một chút, đủ nổi bật để mở app lên không còn thấy template
              mặc định nữa.
            </ThemedText>

            <View style={styles.highlightRow}>
              <View style={[styles.dot, { backgroundColor: '#ff7a59' }]}/>
              <View style={[styles.dot, { backgroundColor: '#ffd166' }]}/>
              <View style={[styles.dot, { backgroundColor: '#39a0ed' }]}/>
            </View>

            <View style={[styles.cta, { backgroundColor: theme.text }]}>
              <ThemedText style={[styles.ctaText, { color: theme.background }]}>
                Bắt đầu thôi
              </ThemedText>
            </View>
          </ThemedView>
        </View>
      </SafeAreaView>
    </ThemedView>);
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        overflow: 'hidden',
    },
    safeArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Spacing.four,
        paddingVertical: Spacing.four,
    },
    orb: {
        position: 'absolute',
        borderRadius: 999,
        opacity: 0.22,
    },
    orbTop: {
        width: 220,
        height: 220,
        top: -40,
        left: -60,
    },
    orbMiddle: {
        width: 180,
        height: 180,
        right: -50,
        top: '28%',
    },
    orbBottom: {
        width: 260,
        height: 260,
        bottom: -90,
        left: '18%',
    },
    cardShadow: {
        width: '100%',
        maxWidth: MaxContentWidth,
        borderRadius: 32,
        shadowOffset: {
            width: 0,
            height: 18,
        },
        shadowOpacity: 0.12,
        shadowRadius: 30,
        elevation: 8,
    },
    card: {
        borderRadius: 32,
        paddingHorizontal: Spacing.five,
        paddingVertical: Spacing.six,
        alignItems: 'center',
        gap: Spacing.three,
    },
    badgeRow: {
        flexDirection: 'row',
        gap: Spacing.two,
        marginBottom: Spacing.one,
    },
    badge: {
        borderRadius: 999,
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.one,
    },
    badgeText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: 0.8,
    },
    eyebrow: {
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        textAlign: 'center',
    },
    title: {
        textAlign: 'center',
        maxWidth: 560,
    },
    subtitle: {
        textAlign: 'center',
        maxWidth: 480,
        lineHeight: 26,
    },
    highlightRow: {
        flexDirection: 'row',
        gap: Spacing.two,
        marginTop: Spacing.one,
    },
    dot: {
        width: 14,
        height: 14,
        borderRadius: 999,
    },
    cta: {
        marginTop: Spacing.two,
        paddingHorizontal: Spacing.five,
        paddingVertical: Spacing.three,
        borderRadius: 999,
    },
    ctaText: {
        fontSize: 16,
        fontWeight: 700,
    },
});
