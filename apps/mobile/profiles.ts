// 取り込み分類の辞書（ここを編集すれば即反映）
export const DICT: Record<string, string[]> = {
  // 収入
  base: ['基本','ベース','通常','base','trip','delivery','配達料金','fare'],
  incentive: ['ブースト','クエスト','プロモ','ピーク','ボーナス','promotion','boost','quest','peak','incentive'],
  tip: ['チップ','tip'],
  adjust_plus: ['未払い回収','補填','調整(+)','adjustment +','adjustment','補償','reimbursement'],

  // マイナス側
  adjust_minus: ['返金','調整(-)','ペナルティ','adjustment -','penalty','chargeback'],
  fee: ['手数料','振込手数料','fee','deposit fee'],

  // 相殺/現金
  cash_received: ['現金で相殺','現金受取','cash collected','cash to collect']
};

// 任意：プラットフォーム別の“言い回しの癖”も将来ここに拡張していける
export const PROFILES = {
  demaecan: {
    alias: ['出前館','demaecan'],
    notes: ['「現金で相殺」あり','金額にカンマ、▲表記あり']
  },
  uber: {
    alias: ['Uber','Uber Eats'],
    notes: ['Promotion/Quest/Boost など英語表記混在']
  }
} as const;
