# 勤怠管理システム | Time Management System

日本のビジネス向けプロフェッショナル勤怠管理・給与計算システム

## 機能概要

### ✅ 実装済み
- **ダッシュボード**: リアルタイム勤務状況表示
- **打刻システム**: 出勤・休憩・退勤の打刻
- **基本設計**: TypeScript + Zod バリデーション
- **UI/UX**: 日本語対応の美しいインターフェース
- **時間計算**: Day.js による正確な時間集計

### 🚧 準備中 (Tauri版で実装予定)
- **シフト管理**: 週/月カレンダー表示
- **従業員管理**: CRUD操作、権限管理
- **時給・手当設定**: 基本時給、残業率、深夜手当、法定休日
- **給与計算**: 期間指定での自動計算
- **レポート**: CSV/PDF エクスポート
- **設定**: 事業所情報、システム設定

## 技術スタック

### Web版 (現在)
- **Frontend**: React + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui
- **バリデーション**: Zod
- **時間処理**: Day.js
- **状態管理**: React Hooks

### Desktop版 (移行予定)
- **Desktop**: Tauri (Rust + Web)
- **Database**: SQLite + tauri-plugin-sql
- **自動更新**: Tauri Updater
- **ビルド**: GitHub Actions

## プロジェクト構造

```
src/
├── components/
│   ├── Layout/           # サイドバー、メインレイアウト
│   ├── Dashboard/        # ダッシュボード画面
│   ├── TimeClock/        # 打刻システム画面
│   └── ui/              # shadcn/ui コンポーネント
├── hooks/
│   └── useTimeManagement.ts  # 時間管理ロジック
├── types/
│   └── index.ts         # TypeScript型定義
├── utils/
│   ├── database.ts      # データベース操作 (SQLite移行準備)
│   └── dayjs.ts         # 時間計算ユーティリティ
└── pages/
    └── Index.tsx        # メインページ
```

## デザインシステム

### カラーパレット
- **Primary**: 企業ブルー (`--primary`)
- **Working**: グリーン (`--working`) - 勤務中表示
- **Break**: オレンジ (`--break`) - 休憩中表示
- **Overtime**: レッド (`--overtime`) - 残業表示
- **Offline**: グレー (`--offline`) - 退勤中表示

### コンポーネント設計
- セマンティックトークン使用
- レスポンシブデザイン
- ダークモード対応
- アクセシビリティ準拠

## 開発手順

### 1. Web版での開発・テスト
```bash
npm install
npm run dev
```

### 2. Tauri Desktop版への移行
詳細は `docs/TAURI_MIGRATION.md` を参照

### 3. SQLiteデータベース統合
- テーブル設計: 従業員、勤怠記録、シフト、給与ルール
- マイグレーション機能
- バックアップ・リストア

### 4. GitHub Actions自動ビルド
- Windows/macOS/Linux バイナリ生成
- 自動リリース作成
- 署名・公証 (macOS)

## データベース設計

### 主要テーブル
- **employees**: 従業員マスタ
- **time_records**: 勤怠記録
- **shifts**: シフト管理
- **wage_rules**: 時給・手当ルール
- **payroll_periods**: 給与計算期間
- **payroll_records**: 給与明細

## 法的要件対応

### 労働基準法準拠
- ✅ 法定労働時間 (8時間/日、40時間/週)
- ✅ 残業時間計算 (25%割増)
- ✅ 深夜労働 (22時-5時、25%割増)
- ✅ 法定休日労働 (35%割増)
- ✅ 打刻記録の保存義務

### セキュリティ
- データ暗号化
- アクセス権限管理
- 監査ログ
- バックアップ機能

## 導入・運用

### システム要件
- **OS**: Windows 10+, macOS 10.15+, Linux
- **メモリ**: 4GB以上推奨
- **ストレージ**: 1GB以上

### バックアップ
- 自動日次バックアップ
- 手動エクスポート機能
- クラウドストレージ連携

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## サポート

- 📧 技術サポート: [support@example.com]
- 📖 ドキュメント: `/docs`
- 🐛 バグレポート: GitHub Issues

---

**開発状況**: Web版完成 → Tauri版移行準備中 → 本格運用開始