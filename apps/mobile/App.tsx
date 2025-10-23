import React, { useMemo } from 'react';
import { Alert, SafeAreaView, View, Text, Pressable, FlatList } from 'react-native';
import { StatusBar } from 'expo-status-bar';

type InboxKind = 'work' | 'statement' | 'bank' | 'entry';

type Tile = {
  id: InboxKind;
  title: string;
  subtitle: string;
  emoji: string;
  status: '受付待ち' | '解析中' | '完了' | '要確認';
};

const TILES: Tile[] = [
  { id: 'work',      title: '稼働（日次）',           subtitle: 'スクショ／メモ音声',          emoji: '📈', status: '受付待ち' },
  { id: 'statement', title: '明細（CSV/PDF）',        subtitle: 'Uber/出前館/Wolt ほか',       emoji: '📄', status: '受付待ち' },
  { id: 'bank',      title: '銀行（CSV）',            subtitle: 'MUFG / SMBC',                 emoji: '🏦', status: '受付待ち' },
  { id: 'entry',     title: '入口（写真/動画/音声）', subtitle: '3枚＋10秒でカード化',         emoji: '🚪', status: '受付待ち' },
];

export default function App() {
  const data = useMemo(() => TILES, []);

  const onPress = (tile: Tile) => {
    Alert.alert(
      tile.title,
      'アップロード画面と解析は次の手で実装します。\n今日は「INBOXの入口」を先に置きます。',
      [{ text: 'OK' }]
    );
  };

  const renderItem = ({ item }: { item: Tile }) => (
    <Pressable
      onPress={() => onPress(item)}
      style={({ pressed }) => [
        {
          flex: 1,
          margin: 8,
          padding: 16,
          borderRadius: 16,
          backgroundColor: '#ffffff',
          opacity: pressed ? 0.8 : 1,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 3
        }
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ fontSize: 28, marginRight: 8 }}>{item.emoji}</Text>
        <Text style={{ fontSize: 18, fontWeight: '700' }}>{item.title}</Text>
      </View>
      <Text style={{ color: '#666', marginBottom: 12 }}>{item.subtitle}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <StatusPill label={item.status} />
        <Text style={{ marginLeft: 8, color: '#999', fontSize: 12 }}>タップでアップロード（ダミー）</Text>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F6F6F7' }}>
      <StatusBar style="dark" />
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
        <Text style={{ fontSize: 22, fontWeight: '800' }}>INBOX（取り込み）</Text>
        <Text style={{ color: '#666', marginTop: 4 }}>稼働・明細・銀行・入口の素材を集める入口です。</Text>
      </View>
      <FlatList
        contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 24 }}
        data={data}
        numColumns={2}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />
    </SafeAreaView>
  );
}

function StatusPill({ label }: { label: string }) {
  const bg = label === '完了' ? '#E7F6EC'
    : label === '要確認' ? '#FFF3E0'
    : label === '解析中' ? '#E8F1FF'
    : '#F0F1F3';

  const color = label === '完了' ? '#12805A'
    : label === '要確認' ? '#8A4C12'
    : label === '解析中' ? '#0B63CE'
    : '#555';

  return (
    <View style={{
      backgroundColor: bg,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999
    }}>
      <Text style={{ color, fontSize: 12, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}
