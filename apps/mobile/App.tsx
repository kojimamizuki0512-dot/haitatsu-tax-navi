import React, { useMemo, useState } from 'react';
import { Alert, SafeAreaView, View, Text, Pressable, FlatList, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import UploadModal from './UploadModal';

type InboxKind = 'work' | 'statement' | 'bank' | 'entry';

type Tile = {
  id: InboxKind;
  title: string;
  subtitle: string;
  emoji: string;
  status: '受付待ち' | '解析中' | '完了' | '要確認';
};

const INITIAL_TILES: Tile[] = [
  { id: 'work',      title: '稼働（日次）',           subtitle: 'スクショ／メモ音声',          emoji: '📈', status: '受付待ち' },
  { id: 'statement', title: '明細（CSV/PDF）',        subtitle: 'Uber/出前館/Wolt ほか',       emoji: '📄', status: '受付待ち' },
  { id: 'bank',      title: '銀行（CSV）',            subtitle: 'MUFG / SMBC',                 emoji: '🏦', status: '受付待ち' },
  { id: 'entry',     title: '入口（写真/動画/音声）', subtitle: '3枚＋10秒でカード化',         emoji: '🚪', status: '受付待ち' },
];

export default function App() {
  const [tiles, setTiles] = useState<Tile[]>(INITIAL_TILES);
  const [activeKind, setActiveKind] = useState<InboxKind | null>(null);
  const data = useMemo(() => tiles, [tiles]);

  const onPress = (tile: Tile) => {
    setActiveKind(tile.id);
  };

  const updateStatus = (kind: InboxKind, status: Tile['status']) => {
    setTiles(prev => prev.map(t => (t.id === kind ? { ...t, status } : t)));
  };

  const onCloseModal = () => setActiveKind(null);

  const onPicked = (kind: InboxKind, fileNames: string[]) => {
    // 受付 → 解析中 → 完了 の擬似進行（体験用）
    updateStatus(kind, '解析中');
    setTimeout(() => {
      updateStatus(kind, fileNames.length ? '完了' : '要確認');
      if (fileNames.length) {
        Alert.alert('受付完了', `受け付けたファイル:\n- ${fileNames.slice(0,5).join('\n- ')}${fileNames.length > 5 ? '\n…' : ''}`);
      }
    }, 900);
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
        <Text style={{ marginLeft: 8, color: '#999', fontSize: 12 }}>
          {Platform.OS === 'web' ? 'ファイル選択できます' : 'タップでアップロード（次の手で実装）'}
        </Text>
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

      {/* アップロードモーダル */}
      {activeKind && (
        <UploadModal
          visible={!!activeKind}
          kind={activeKind}
          onClose={onCloseModal}
          onPicked={(names) => onPicked(activeKind, names)}
        />
      )}
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
