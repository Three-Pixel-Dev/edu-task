import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, fonts } from '@/theme';
import { AppText } from '../ui';

interface ScoreRingProps {
  score: number;
  total: number;
  size?: number;
}

export function ScoreRing({ score, total, size = 176 }: ScoreRingProps) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = total ? score / total : 0;
  const tone = pct >= 0.7 ? colors.primary : pct >= 0.5 ? colors.warning : colors.error;

  return (
    <View
      style={{ width: size, height: size }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Score ${score} out of ${total}, ${Math.round(pct * 100)} percent`}
    >
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.border} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={tone}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference * pct} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.center}>
          <AppText style={styles.score}>
            {score}
            <AppText style={styles.total} color="textSecondary">{` / ${total}`}</AppText>
          </AppText>
          <AppText variant="bodyStrong" color="primaryDark">
            {`${Math.round(pct * 100)}%`}
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  score: { fontFamily: fonts.bold, fontSize: 44, lineHeight: 50, letterSpacing: -1 },
  total: { fontFamily: fonts.semibold, fontSize: 20 },
});
