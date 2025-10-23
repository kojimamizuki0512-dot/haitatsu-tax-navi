import React, { useMemo, useState } from 'react';
import { Alert, SafeAreaView, View, Text, Pressable, FlatList, Platform, Image } from 'react-native';
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

type PickedFile = { name: string; type?: string; text?: string; uri?: string };

const INITIAL_TILES: Tile[] = [
  { id: 'work',      title: '稼働（日次）',           subtitle: 'スクショ／メモ音声',          emoji: '📈', status: '受付待ち' },
  { id: 'statement', title: '明細（CSV/PDF）',        subtitle: '（将来はスクショもOCR）',     emoji: '📄', status: '受付待ち' },
  { id: 'bank',      title: '銀行（CSV）',            subtitle: '（今回は使わない想定）',       emoji: '🏦', status: '受付待ち' },
  { id: 'entry',     title: '入口（写真/動画/音声）', subtitle: '3枚＋10秒でカード化',         emoji: '🚪', status: '受付待ち' },
];

export default function App() {
  const [tiles, setTiles] = useState<Tile[]>(INITIAL_TILES);
  const [activeKind, setActiveKind] = useState<InboxKind | null>(null);
  // 画像プレビュー（work/entryのみ使用）
  const [previews, setPreviews] = useState<{ work: string[]; entry: string[] }>({ work: [], entry: [] });

  const data = useMemo(() => tiles, [tiles]);

  const onPress = (tile: Tile) => setActiveKind(tile.id);
  const updateStatus = (kind: InboxKind, status: Tile['status']) =>
    setTiles(prev => prev.map(t => (t.id === kind ? { ...t, status } : t)));
  const onCloseModal = () => setActiveKind(null);

  const onPicked = async (kind: InboxKind, files: PickedFile[]) => {
    updateStatus(kind, '解析中');

    if (kind === 'statement') {
      // いまはCSVのみ即時集計（Web）。OCRは次の手で。
      const csvFiles = files.filter(f =>
        (f.name || '').toLowerCase().endsWith('.csv') || (f.type || '').includes('text/csv')
      );

      if (Platform.OS === 'web' && csvFiles.length) {
        let total = initTotals();
        let parsedCount = 0;
        for (const f of csvFiles) {
          const text = f.text ?? '';
          if (!text) continue;
          const rows = parseCSV(text);
          if (!rows.length) continue;
          const { headers, body } = splitHeader(rows);
          const idx = detectColumns(headers);
          for (const r of body) {
            const desc = safe(r, idx.description);
            const amountStr = safe(r, idx.amount);
            const amt = parseAmount(amountStr);
            if (!amt && !desc) continue;
            const k = classify(desc);
            addToTotals(total, k, amt);
          }
          parsedCount++;
        }
        setTimeout(() => {
          updateStatus('statement', parsedCount > 0 ? '完了' : '要確認');
          const msg = parsedCount
            ? formatTotalsAlert(total, parsedCount)
            : 'テキスト系（CSV/TSV/TXT）が見つからなかったか、読み取れませんでした。';
          Alert.alert('明細の取り込み結果', msg);
        }, 250);
        return;
      }

      // ネイティブや非テキストは今回は受付のみ
      setTimeout(() => updateStatus('statement', files.length ? '完了' : '要確認'), 250);
      return;
    }

    // 画像プレビュー（work / entry）
    if (kind === 'work' || kind === 'entry') {
      const imgUris = files
        .filter(f => {
          const n = (f.name || '').toLowerCase();
          const t = (f.type || '').toLowerCase();
          return t.startsWith('image/') || /\.(png|jpg|jpeg|webp)$/i.test(n);
        })
        .map(f => f.uri)
        .filter((u): u is string => !!u);

      if (imgUris.length) {
        setPreviews(prev => {
          const next = [ ...imgUris, ...prev[kind] ].slice(0, 3); // 最大3枚
          return { ...prev, [kind]: next } as typeof prev;
        });
      }
    }

    setTimeout(() => updateStatus(kind, files.length ? '完了' : '要確認'), 200);
  };

  const renderItem = ({ item }: { item: Tile }) => {
    const pv = item.id === 'work' ? previews.work : item.id === 'entry' ? previews.entry : [];
    return (
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
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: pv.length ? 10 : 0 }}>
          <StatusPill label={item.status} />
          <Text style={{ marginLeft: 8, color: '#999', fontSize: 12 }}>
            {Platform.OS === 'web'
              ? (item.id === 'statement' ? 'CSVは即時集計 / 画像は受付のみ' : '画像はプレビュー表示')
              : '端末から選択 or 撮影（OCRは次で接続）'}
          </Text>
        </View>

        {/* 画像プレビュー（最大3枚） */}
        {!!pv.length && (
          <View style={{ flexDirection: 'row' }}>
            {pv.map((uri, i) => (
              <Image
                key={uri + i}
                source={{ uri }}
                style={{
                  width: 56, height: 56, borderRadius: 10,
                  marginRight: i < pv.length - 1 ? 8 : 0,
                  backgroundColor: '#f2f2f4'
                }}
                resizeMode="cover"
              />
            ))}
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F6F6F7' }}>
      <StatusBar style="dark" />
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
        <Text style={{ fontSize: 22, fontWeight: '800' }}>INBOX（取り込み）</Text>
        <Text style={{ color: '#666', marginTop: 4 }}>稼働・明細・入口の素材を集める入口です（CSVは使わない想定）。</Text>
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
          onPicked={(picked) => onPicked(activeKind, picked as any)}
        />
      )}
    </SafeAreaView>
  );
}

/* ---------- UI ---------- */
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

/* ---------- CSV 解析（Web用に残置） ---------- */
type Kind =
  | 'base'
  | 'incentive'
  | 'tip'
  | 'adjust_plus'
  | 'adjust_minus'
  | 'fee'
  | 'cash_received';

type Totals = Record<Kind, number>;
function initTotals(): Totals {
  return { base: 0, incentive: 0, tip: 0, adjust_plus: 0, adjust_minus: 0, fee: 0, cash_received: 0 };
}
function addToTotals(t: Totals, kind: Kind, amount: number) { t[kind] += amount; }
function parseAmount(s: string): number { const n = parseFloat((s || '').replace(/[^\d\.-]/g, '')); return isNaN(n) ? 0 : n; }
function parseCSV(text: string): string[][] {
  const rows: string[][] = []; let i = 0, cur = '', row: string[] = [], q = false;
  while (i < text.length) { const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else { q = false; } } else { cur += c; } }
    else { if (c === '"') q = true; else if (c === ',') { row.push(cur); cur = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; }
      else { cur += c; } }
    i++; }
  row.push(cur); rows.push(row);
  return rows.filter(r => r.some(cell => cell.trim().length));
}
function splitHeader(rows: string[][]) { const headers = rows[0].map(h => h.trim()); const body = rows.slice(1); return { headers, body }; }
function detectColumns(headers: string[]) {
  const lower = headers.map(h => h.toLowerCase());
  const find = (cands: string[]) => Math.max(0, lower.findIndex(h => cands.some(c => h.includes(c))));
  return { description: find(['desc','項目','内容','type','説明','内訳','明細']), amount: find(['amount','金額','支払','payout','fare','total','合計']) };
}
function safe(row: string[], idx: number): string { return row[idx] ?? ''; }
const DICT: Record<Kind, string[]> = {
  base: ['基本','ベース','通常','base','trip','delivery','配達料金','fare'],
  incentive: ['ブースト','クエスト','プロモ','ピーク','ボーナス','promotion','boost','quest','peak','incentive'],
  tip: ['チップ','tip'],
  adjust_plus: ['未払い回収','補填','調整(+)','adjustment +','adjustment','補償','reimbursement'],
  adjust_minus: ['返金','調整(-)','ペナルティ','adjustment -','penalty','chargeback'],
  fee: ['手数料','振込手数料','fee','deposit fee'],
  cash_received: ['現金で相殺','現金受取','cash collected','cash to collect']
};
function classify(descRaw: string): Kind {
  const d = (descRaw || '').toLowerCase();
  for (const k of Object.keys(DICT) as Kind[]) if (DICT[k].some(w => d.includes(w))) return k;
  return /-/.test(descRaw) ? 'fee' : 'base';
}
function yen(n: number) { return '¥' + Math.round(n).toLocaleString('ja-JP'); }
function formatTotalsAlert(t: Totals, fileCount: number) {
  const rev = t.base + t.incentive + t.tip + t.adjust_plus - Math.max(0, t.adjust_minus);
  const lines = [
    `処理したCSV: ${fileCount}件`,
    `収入合計: ${yen(rev)}`,
    `  - 基本 ${yen(t.base)} / インセン ${yen(t.incentive)} / チップ ${yen(t.tip)} / 調整+ ${yen(t.adjust_plus)}`,
    `費用合計: ${yen(t.fee)}（手数料）`,
    `調整-: ${yen(t.adjust_minus)}`,
    `現金受取: ${yen(t.cash_received)}`
  ];
  return lines.join('\n');
}
