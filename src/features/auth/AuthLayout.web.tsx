import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppText, Icon, Logo } from '@/components';
import { colors, fonts, radius, spacing } from '@/theme';

/**
 * Desktop auth: exact split-screen treatment from the web specification.
 * Mobile keeps the hero-sheet `AuthLayout.tsx`.
 */
export function AuthLayout({ children }: PropsWithChildren<{ compactHero?: boolean }>) {
  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <View style={styles.brand}>
          <Logo size={40} />
          <AppText variant="heading">EduTask</AppText>
        </View>
        <View style={styles.pitch}>
          <AppText style={styles.pitchTitle}>Practise CEIT subjects. Stay on top of every deadline.</AppText>
          <AppText style={styles.pitchBody}>
            EduTask brings level-based IT quizzes and your assignment list into one place — on the web and on your phone.
          </AppText>
        </View>
        <View style={styles.previewStack} accessibilityElementsHidden>
          <View style={styles.quizPreview}>
            <View style={styles.previewMeta}>
              <AppText variant="code" color="textSecondary">CEIT-4031 · Level 4</AppText>
              <AppText variant="caption" color="textSecondary">Question 4 of 10</AppText>
            </View>
            <View style={styles.previewTrack}><View style={styles.previewFill} /></View>
            <AppText variant="label" style={styles.previewQuestion}>Which of the following is a relational database?</AppText>
            <View style={styles.previewGrid}>
              {['MongoDB', 'PostgreSQL', 'Redis', 'Neo4j'].map((option) => (
                <View key={option} style={[styles.previewOption, option === 'PostgreSQL' && styles.previewOptionSelected]}>
                  <AppText variant="captionStrong">{option}</AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.taskPreview}>
            <View style={styles.taskRing} />
            <View style={styles.taskText}>
              <AppText variant="label">Database Assignment</AppText>
              <AppText variant="caption" color="warningText">Due today, 11:59 PM</AppText>
            </View>
            <Icon name="chevron-right" size={16} color="textDisabled" />
          </View>
        </View>
        <View style={styles.facts}>
          <Fact value="7" label="CEIT fields" />
          <Fact value="15" label="levels per subject" />
          <Fact value="10" label="questions per quiz" />
        </View>
      </View>
      <View style={styles.formPane}>
        <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.form}>{children}</View>
        </ScrollView>
      </View>
    </View>
  );
}

function Fact({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.fact}>
      <AppText variant="bodyStrong">{value}</AppText>
      <AppText variant="label" color="textSubtle">{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: colors.card, minHeight: '100%' as unknown as number },
  hero: {
    flex: 1,
    minWidth: 0,
    paddingVertical: spacing.huge,
    paddingHorizontal: 64,
    backgroundColor: colors.primarySurface,
    borderRightWidth: 1,
    borderRightColor: colors.primarySurfaceStrong,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  pitch: { maxWidth: 520, marginTop: 'auto', gap: spacing.lg },
  pitchTitle: { fontFamily: fonts.bold, fontSize: 40, lineHeight: 48, letterSpacing: -1.2 },
  pitchBody: { fontSize: 17, lineHeight: 27, color: colors.textSubtle },
  previewStack: { maxWidth: 440, marginTop: spacing.huge, gap: spacing.md },
  quizPreview: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.primarySurfaceStrong,
    borderRadius: radius.xxl,
    padding: 18,
    gap: spacing.md,
  },
  previewMeta: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  previewTrack: { height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' },
  previewFill: { width: '40%', height: '100%', backgroundColor: colors.primary },
  previewQuestion: { marginTop: 2 },
  previewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  previewOption: { width: '48%', flexGrow: 1, paddingVertical: 9, paddingHorizontal: spacing.md, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
  previewOptionSelected: { borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.primarySurface },
  taskPreview: {
    alignSelf: 'flex-end',
    width: 300,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.primarySurfaceStrong,
    borderRadius: radius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  taskRing: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.warning },
  taskText: { flex: 1, gap: 2 },
  facts: { flexDirection: 'row', gap: spacing.xxl, marginTop: spacing.huge },
  fact: { flexDirection: 'row', gap: 5, alignItems: 'baseline' },
  formPane: { flex: 1, minWidth: 0 },
  formScroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: spacing.huge, paddingHorizontal: spacing.xxl },
  form: {
    width: '100%',
    maxWidth: 400,
    gap: spacing.lg,
  },
});
