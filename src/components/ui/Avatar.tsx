import { StyleSheet, View } from 'react-native';
import { colors, fonts } from '@/theme';
import { initialsOf } from '@/utils/format';
import { AppText } from './AppText';

export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <AppText style={{ fontFamily: fonts.bold, fontSize: size * 0.36, lineHeight: size * 0.46 }} color="primaryDark">
        {initialsOf(name)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { backgroundColor: colors.primarySurfaceStrong, alignItems: 'center', justifyContent: 'center' },
});
