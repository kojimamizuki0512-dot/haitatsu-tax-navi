@'
# 配達員確定申告ナビ（時給ハッカー）

- **アプリ表示名（日本語）**：配達員確定申告ナビ
- **短いスラッグ（内部名）**：haitatsu-tax-navi
- **英名（任意）**：Delivery Riders’ Tax Navi
- **想定バンドルID**：com.jikyuhacker.haitatsutax（後で変更可）

## ねらい（SEO）
- タイトルに主要KW：配達員 / 確定申告 / e-Tax / .xtx
- 説明で補助KW：Uber / 出前館 / Wolt / menu / PickGo / ロケットナウ / CSV / 銀行 / MUFG / SMBC / 入口カード / 到着判定
- ストアの正式タイトルに他社商標は入れない（説明文・ヘルプで明記）

## モノレポ構成（現時点は空）
/apps
  /mobile        # Expo（React Native）
  /functions     # Firebase Cloud Functions
/packages
  /parsers       # 明細・銀行CSV・メールパーサ
  /ocr           # OCR前処理ユーティリティ
  /scoring       # 当たり3枠スコア
  /arrival       # 到着判定（端末内アルゴリズム）
  /xtx           # e-Tax .xtx出力エンジン
/infra
  firebase.json
  firestore.rules
  storage.rules
  remote-config.json

## プロダクト原則（抜粋）
- 0〜1タップ／元プラの再実装はしない／スクレイピング禁止
- 位置・IMUは端末内判定→サーバへは合否・数値のみ
- 税データは同意ONの人だけ、原画像・動画は短期保持（既定7日）
'@ | Out-File -FilePath C:\work\haitatsu-tax-navi\README.md -Encoding UTF8