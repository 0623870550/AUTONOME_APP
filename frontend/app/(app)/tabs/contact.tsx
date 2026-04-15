import { useState } from 'react';
import { View, Text, TextInput, Pressable, Linking } from 'react-native';
import PageContainer from 'components/PageContainer';
import AuthGate from 'app/auth-gate';

export default function Contact() {
  const [message, setMessage] = useState('');

  const openLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (e) {
      console.log('Erreur ouverture lien :', e);
    }
  };

  return (
    <AuthGate>
      <PageContainer>

        {/* HEADER */}
        <Text style={{ color: '#F8FF00', fontSize: 26, fontWeight: '700', marginBottom: 6 }}>
          Contact & Informations
        </Text>

        <Text style={{ color: '#ccc', fontSize: 15, marginBottom: 20 }}>
          Le Syndicat AUTONOME SDMIS est à votre écoute.
        </Text>

        {/* COORDONNÉES */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ color: '#F8FF00', fontSize: 20, fontWeight: '700', marginBottom: 12 }}>
            Coordonnées officielles
          </Text>

          <Text style={{ color: '#fff', marginBottom: 6 }}>📧 contact@syndicatautonomesdmis.com</Text>
          <Text style={{ color: '#fff', marginBottom: 6 }}>📞 04 72 80 53 98</Text>
          <Text style={{ color: '#fff', marginBottom: 6 }}>
            📍 Syndicat AUTONOME SDMIS — 19 Avenue DEBOURG 69007 Lyon/ Rhône
          </Text>
        </View>

        {/* LIENS INSTITUTIONNELS */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ color: '#F8FF00', fontSize: 20, fontWeight: '700', marginBottom: 12 }}>
            Liens utiles
          </Text>

          {[
            {
              title: 'Site officiel',
              icon: '🌐',
              url: 'https://www.syndicatautonomesdmis.com/',
              desc: 'Toutes les informations officielles du syndicat.',
            },
            {
              title: 'Actualités',
              icon: '📰',
              url: 'https://www.syndicatautonomesdmis.com/actualite/',
              desc: 'Suivez les dernières informations et actions.',
            },
            {
              title: 'Adhésion',
              icon: '📝',
              url: 'https://www.syndicatautonomesdmis.com/adhesion/',
              desc: 'Rejoignez le syndicat et renforcez notre action.',
            },
          ].map((item) => (
            <Pressable
              key={item.title}
              onPress={() => openLink(item.url)}
              style={{
                backgroundColor: '#111',
                borderColor: '#333',
                borderWidth: 1,
                padding: 16,
                borderRadius: 10,
                marginBottom: 12,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>
                {item.icon} {item.title}
              </Text>
              <Text style={{ color: '#aaa', marginTop: 4 }}>{item.desc}</Text>
            </Pressable>
          ))}
        </View>

        {/* MESSAGE DIRECT */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ color: '#F8FF00', fontSize: 20, fontWeight: '700', marginBottom: 12 }}>
            Envoyer un message
          </Text>

          <TextInput
            placeholder="Votre message…"
            placeholderTextColor="#666"
            value={message}
            onChangeText={setMessage}
            multiline
            style={{
              backgroundColor: '#111',
              color: '#fff',
              padding: 12,
              borderRadius: 8,
              height: 120,
              textAlignVertical: 'top',
              marginBottom: 12,
              borderWidth: 1,
              borderColor: '#333',
            }}
          />

          <Pressable
            onPress={() => {
              if (message.trim().length < 5) return;
              alert('Message envoyé (simulation)');
              setMessage('');
            }}
            style={{
              backgroundColor: message.trim().length < 5 ? '#444' : '#F8FF00',
              padding: 14,
              borderRadius: 10,
            }}
          >
            <Text
              style={{
                color: message.trim().length < 5 ? '#888' : '#000',
                textAlign: 'center',
                fontSize: 16,
                fontWeight: '700',
              }}
            >
              Envoyer
            </Text>
          </Pressable>
        </View>

        {/* CTA FINAL */}
        <View style={{ marginBottom: 80 }}>
          <Text style={{ color: '#ccc', marginBottom: 12 }}>
            Besoin d’aide ou envie de contribuer ?
          </Text>

          <Pressable
            onPress={() => openLink('https://www.syndicatautonomesdmis.com/adhesion/')}
            style={{
              backgroundColor: '#F8FF00',
              padding: 14,
              borderRadius: 10,
              marginBottom: 10,
            }}
          >
            <Text style={{ color: '#000', fontWeight: '700', textAlign: 'center' }}>
              Rejoindre le syndicat
            </Text>
          </Pressable>
        </View>

      </PageContainer>
    </AuthGate>
  );
}
