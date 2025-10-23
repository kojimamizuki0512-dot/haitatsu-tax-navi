import React, { useMemo, useRef } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';

type InboxKind = 'work' | 'statement' | 'bank' | 'entry';

type Props = {
  visible: boolean;
  kind: InboxKind;
  onClose: () => void;
  // Webでは name/type/text を返す（CSVは text あり）
  onPicked: (files: { name: string; type?: string; text?: string }[]) => void;
};

export default function UploadModal({ visible, kind, onClose, onPicked }: Props) {
  const accept = useMemo(() => {
    switch (kind) {
      case 'work':      return '.png,.jpg,.jpeg,.webp,.m4a,.mp3';
      case 'statement': return '.csv,.pdf,.png,.jpg,.jpeg,.webp';
      case 'bank':      return '.csv';
      case 'entry':     return '.png,.jpg,.jpeg,.webp,.mp4,.mov,.m4a';
    }
  }, [kind]);

  const title = useMemo(() =>
    kind === 'work' ? '稼働（日次）'
    : kind === 'statement' ? '明細（CSV/PDF）'
    : kind === 'bank' ? '銀行（CSV）'
    : '入口（写真/動画/音声）', [kind]);

  const inputRef = useRef<any>(null);
  if (!visible) return null;

  return (
    <View style={{
      position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.28)',
      alignItems: 'center', justifyContent: 'center', padding: 16
    }}>
      <View style={{
        width: '100%', maxWidth: 520, backgroundColor: '#fff', borderRadius: 20,
        padding: 20, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }
      }}>
        <Text style={{ fontSize: 18, fontWeight: '800', marginBottom: 8 }}>{title} のアップロード</Text>
        <Text style={{ color: '#666', marginBottom: 16 }}>
          {Platform.OS === 'web'
            ? 'CSVを選ぶとその場で解析します（今日の範囲）。'
            : 'モバイルのピッカーは次の手で実装。'}
        </Text>

        {Platform.OS === 'web' ? (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={accept}
              style={{ flex: 1 }}
              onChange={async (e) => {
                const files = Array.from(e.target.files ?? []);
                const enriched = await Promise.all(files.map(async (f: any) => {
                  const name = f.name as string;
                  const type = (f.type as string) || '';
                  const needText = type.includes('text/csv') || name.toLowerCase().endsWith('.csv');
                  const text = needText ? await f.text() : undefined;
                  return { name, type, text };
                }));
                onPicked(enriched);
                onClose();
              }}
            />
            <button
              onClick={() => inputRef.current?.click()}
              style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #ddd', background: '#f7f7f8', cursor: 'pointer' }}
            >
              選択
            </button>
          </div>
        ) : (
          <View style={{ padding: 12, borderWidth: 1, borderColor: '#eee', borderRadius: 12 }}>
            <Text>モバイルは次の手で DocumentPicker を入れます。</Text>
          </View>
        )}

        <View style={{ height: 16 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => ({
              paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
              backgroundColor: pressed ? '#efefef' : '#f5f5f6'
            })}
          >
            <Text style={{ fontWeight: '700' }}>閉じる</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
