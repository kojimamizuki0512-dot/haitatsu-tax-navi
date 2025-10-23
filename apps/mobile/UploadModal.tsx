import React, { useMemo, useRef } from 'react';
import { View, Text, Pressable, Platform, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

type InboxKind = 'work' | 'statement' | 'bank' | 'entry';

type Props = {
  visible: boolean;
  kind: InboxKind;
  onClose: () => void;
  // Web: name/type/text を返す / ネイティブ: name/uri を返す
  onPicked: (files: { name: string; type?: string; text?: string; uri?: string }[]) => void;
};

// 日本語判定の簡易スコア
const jpScore = (s: string) => (s.match(/[\u3040-\u30ff\u4e00-\u9faf]/g) || []).length;

export default function UploadModal({ visible, kind, onClose, onPicked }: Props) {
  const accept = useMemo(() => {
    switch (kind) {
      case 'work':      return '.png,.jpg,.jpeg,.webp,.m4a,.mp3';
      case 'statement': return '.csv,.tsv,.txt,.pdf,.png,.jpg,.jpeg,.webp'; // ← tsv / txt 追加
      case 'bank':      return '.csv,.tsv,.txt'; // 銀行も tsv / txt を許容
      case 'entry':     return '.png,.jpg,.jpeg,.webp,.mp4,.mov,.m4a';
    }
  }, [kind]);

  const title = useMemo(
    () =>
      kind === 'work'
        ? '稼働（日次）'
        : kind === 'statement'
        ? '明細（CSV/TSV/PDF）'
        : kind === 'bank'
        ? '銀行（CSV/TSV）'
        : '入口（写真/動画/音声）',
    [kind]
  );

  const inputRef = useRef<HTMLInputElement | null>(null);
  if (!visible) return null;

  const pickFromFilesNative = async () => {
    // 画像/動画/音声/ドキュメントなど広めに許可
    const res = await DocumentPicker.getDocumentAsync({
      multiple: true,
      copyToCacheDirectory: true, // ← true 推奨（Android で content:// を避ける）
      type: '*/*'
    });
    if (res.canceled) return;
    const files = res.assets.map(a => ({
      name: a.name ?? 'file',
      type: a.mimeType,
      uri: a.uri
    }));
    onPicked(files);
    onClose();
  };

  const captureCameraNative = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('カメラ許可が必要です', '設定からカメラ権限を有効にしてください。');
      return;
    }
    const cap = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8
    });
    if (cap.canceled) return;
    const files = cap.assets.map(a => ({
      name: a.fileName ?? 'photo.jpg',
      type: a.type === 'video' ? 'video/mp4' : 'image/jpeg',
      uri: a.uri
    }));
    onPicked(files);
    onClose();
  };

  return (
    <View
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.28)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
    >
      <View
        style={{
          width: '100%',
          maxWidth: 520,
          backgroundColor: '#fff',
          borderRadius: 20,
          padding: 20,
          shadowColor: '#000',
          shadowOpacity: 0.12,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 }
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: '800', marginBottom: 8 }}>{title} のアップロード</Text>
        <Text style={{ color: '#666', marginBottom: 16 }}>
          {Platform.OS === 'web'
            ? 'ファイルを選ぶと、受付→解析中→完了（要確認）の順に進みます。'
            : '写真・動画・CSVなどを端末から選ぶか、カメラ撮影できます。'}
        </Text>

        {Platform.OS === 'web' ? (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <input
              ref={inputRef}
              type="file"
              multiple
              // tsv / txt も許可
              accept={accept}
              style={{ flex: 1 }}
              onChange={async e => {
                const files = Array.from(e.target.files ?? []);
                const enriched = await Promise.all(
                  files.map(async (f: any) => {
                    const name = (f.name as string) || 'file';
                    const type = ((f.type as string) || '').toLowerCase();
                    const isTextish =
                      type.startsWith('text/') ||
                      /(csv|tsv|plain)/.test(type) ||
                      /\.(csv|tsv|txt)$/i.test(name);
                    let text: string | undefined;

                    if (isTextish) {
                      // UTF-8 と Shift_JIS の両方でデコードして、日本語の多い方を採用
                      const ab = await f.arrayBuffer();
                      const utf8 = new TextDecoder('utf-8').decode(new Uint8Array(ab));
                      let best = utf8;
                      try {
                        const sjis = new TextDecoder('shift_jis').decode(new Uint8Array(ab));
                        best = jpScore(sjis) > jpScore(utf8) ? sjis : utf8;
                      } catch {
                        // shift_jis 非対応環境なら UTF-8 のまま
                      }
                      text = best;
                    }

                    return { name, type, text };
                  })
                );
                onPicked(enriched);
                onClose();
              }}
            />
            <button
              onClick={() => inputRef.current?.click()}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid #ddd',
                background: '#f7f7f8',
                cursor: 'pointer'
              }}
            >
              選択
            </button>
          </div>
        ) : (
          <View style={{ gap: 12 }}>
            <Pressable
              onPress={pickFromFilesNative}
              style={({ pressed }) => ({
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: pressed ? '#efefef' : '#f5f5f6'
              })}
            >
              <Text style={{ fontWeight: '700', textAlign: 'center' }}>ファイルから選ぶ</Text>
            </Pressable>

            {(kind === 'work' || kind === 'entry') && (
              <Pressable
                onPress={captureCameraNative}
                style={({ pressed }) => ({
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: pressed ? '#e6f3ff' : '#eef6ff'
                })}
              >
                <Text style={{ fontWeight: '700', textAlign: 'center' }}>カメラで撮影（写真）</Text>
              </Pressable>
            )}
          </View>
        )}

        <View style={{ height: 16 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => ({
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 10,
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
