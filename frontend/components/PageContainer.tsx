import { ReactNode } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PageContainer({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 120,
        }}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
