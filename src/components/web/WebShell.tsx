import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '@/theme';
import { WebSidebar } from './WebSidebar';
import { WebTopBar } from './WebTopBar';

/** Desktop chrome: fixed sidebar + top bar around page content. */
export function WebShell({ children, title }: PropsWithChildren<{ title?: string }>) {
  return (
    <View style={styles.root}>
      <WebSidebar />
      <View style={styles.main}>
        <WebTopBar title={title} />
        <View style={styles.body}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: colors.background, minHeight: '100%' as unknown as number },
  main: { flex: 1, minWidth: 0 },
  body: { flex: 1, minHeight: 0 },
});
