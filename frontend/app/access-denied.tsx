import { View, Text } from 'react-native';
import PageContainer from 'components/PageContainer';

export default function AccessDenied() {
  return (
    <PageContainer>
      <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 10 }}>
        Accès refusé
      </Text>

      <Text style={{ color: '#ccc', fontSize: 16 }}>
        Cette application est strictement réservée aux agents du SDMIS.
      </Text>
    </PageContainer>
  );
}
