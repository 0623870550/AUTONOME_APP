import { useRouter } from 'expo-router';
import { supabase } from 'lib/supabase';
import { useEffect, useState } from 'react';
import {
  Image,
  ScrollView,
  Text,
  View,
  Dimensions,
  ActivityIndicator,
  Modal,
  Linking,
  Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function Home() {
  const router = useRouter();
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState<any>(null);
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  // CETTE LIGNE DOIT TOUT BLOQUER ET AFFICHER DU ROUGE
  return <View style={{ flex: 1, backgroundColor: 'red', justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: 'white', fontSize: 30 }}>CA MARCHE ENFIN !</Text></View>;

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const { data, error } = await supabase
        .from('actualites')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(3);

      if (!error) setNews(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#F8FF00" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <ScrollView contentContainerStyle={{ paddingVertical: 20, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>

        {/* HEADER / LOGO */}
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <Image
            source={require('./assets/logo_autonome_sdmis.png')}
            style={{ width: 100, height: 100, marginBottom: 15 }}
            resizeMode="contain"
          />
          <Text style={{ color: '#F8FF00', fontSize: 24, fontWeight: '900', letterSpacing: 2 }}>SDMIS AUTONOME</Text>
          <Text style={{ color: '#aaa', fontSize: 14, marginTop: 5 }}>L'actualité de votre syndicat</Text>
        </View>

        {/* LISTE DES ACTUALITÉS (3 MAX) */}
        <View style={{ marginBottom: 20 }}>
          {news.map((item) => {
            const date = new Date(item.created_at).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
            });

            return (
              <Pressable
                key={item.id}
                style={{
                  width: '100%',
                  backgroundColor: '#111',
                  borderRadius: 15,
                  marginBottom: 15,
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderColor: '#222',
                }}
                onPress={() => setSelectedNews(item)}
              >
                {/* IMAGE DE LA CARTE */}
                <View style={{ width: '100%', height: 160, backgroundColor: '#000' }}>
                  {item.image_url ? (
                    <Image
                      source={{ uri: item.image_url }}
                      style={{ width: '100%', height: 160 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={{ width: '100%', height: 160, justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ fontSize: 40 }}>📢</Text>
                    </View>
                  )}
                </View>

                {/* TEXTE DE LA CARTE */}
                <View style={{ padding: 15 }}>
                  <Text style={{ color: '#F8FF00', fontSize: 16, fontWeight: 'bold', marginBottom: 5 }}>
                    {item.title}
                  </Text>
                  <Text style={{ color: '#666', fontSize: 11 }}>{date}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* BOUTON ACCÈS ESPACE */}
        <Pressable
          style={{ backgroundColor: '#F8FF00', marginTop: 10, paddingVertical: 15, borderRadius: 30, alignItems: 'center' }}
          onPress={() => router.push('/')}
        >
          <Text style={{ color: '#000', fontSize: 16, fontWeight: 'bold' }}>Accéder à mon espace ➔</Text>
        </Pressable>

      </ScrollView>

      {/* POPUP D'ARTICLE (Modale Interne) */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={selectedNews !== null}
        onRequestClose={() => setSelectedNews(null)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#1A1A1A', borderRadius: 25, width: '100%', maxHeight: '85%', overflow: 'hidden', borderWidth: 1, borderColor: '#333' }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedNews?.image_url && (
                <Pressable onPress={() => setIsImageZoomed(true)}>
                  <Image source={{ uri: selectedNews.image_url }} style={{ width: '100%', height: 220 }} resizeMode="cover" />
                </Pressable>
              )}
              <View style={{ padding: 20 }}>
                <Text style={{ color: '#F8FF00', fontSize: 22, fontWeight: 'bold', marginBottom: 15 }}>{selectedNews?.title}</Text>
                <Text style={{ color: '#eee', fontSize: 16, lineHeight: 24, marginBottom: 20 }}>{selectedNews?.content}</Text>
              </View>
            </ScrollView>

            {/* PIED DE PAGE MODALE */}
            <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: '#333', gap: 10 }}>
              {selectedNews?.link_url && (
                <Pressable
                  style={{ backgroundColor: '#007AFF', padding: 15, borderRadius: 12, alignItems: 'center' }}
                  onPress={() => Linking.openURL(selectedNews.link_url)}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Suivre le lien 🔗</Text>
                </Pressable>
              )}
              <Pressable
                style={{ backgroundColor: '#333', padding: 15, borderRadius: 12, alignItems: 'center' }}
                onPress={() => setSelectedNews(null)}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Fermer</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ZOOM IMAGE PLEIN ÉCRAN */}
      <Modal
        animationType="fade"
        transparent={false}
        visible={isImageZoomed}
        onRequestClose={() => setIsImageZoomed(false)}
      >
        <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
          {selectedNews?.image_url && (
            <Image
              source={{ uri: selectedNews.image_url }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="contain"
            />
          )}
          <Pressable
            style={{
              position: 'absolute',
              top: 50,
              right: 20,
              backgroundColor: 'rgba(0,0,0,0.6)',
              padding: 10,
              borderRadius: 25,
              width: 50,
              height: 50,
              justifyContent: 'center',
              alignItems: 'center'
            }}
            onPress={() => setIsImageZoomed(false)}
          >
            <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>✕</Text>
          </Pressable>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
