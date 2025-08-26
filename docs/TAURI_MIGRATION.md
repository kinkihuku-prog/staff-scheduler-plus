# Tauri Desktop App Migration Guide

この文書では、現在の Web アプリケーションを Tauri デスクトップアプリに移行するための手順を説明します。

## 前提条件

- Node.js & npm がインストール済み
- Rust がインストール済み ([rustup.rs](https://rustup.rs/) から)
- Git で GitHub に接続済み

## ステップ 1: Tauri セットアップ

### 1.1 Tauri CLI インストール

```bash
npm install -g @tauri-apps/cli
```

### 1.2 Tauri 初期化

```bash
npm install @tauri-apps/api
npm install -D @tauri-apps/cli
```

プロジェクトルートで実行：

```bash
npm run tauri init
```

設定例：
- App name: `勤怠管理システム`
- Window title: `Time Management System`
- Web assets location: `../dist`
- Dev server URL: `http://localhost:8080`
- Frontend dev command: `npm run dev`
- Frontend build command: `npm run build`

## ステップ 2: SQLite データベース統合

### 2.1 必要な依存関係を追加

```bash
npm install tauri-plugin-sql
```

### 2.2 Tauri 設定更新

`src-tauri/tauri.conf.json` に追加：

```json
{
  "plugins": {
    "sql": {
      "preload": ["sqlite:app.db"]
    }
  }
}
```

### 2.3 Rust 依存関係

`src-tauri/Cargo.toml` に追加：

```toml
[dependencies]
tauri-plugin-sql = { version = "1.0", features = ["sqlite"] }
```

### 2.4 main.rs 更新

```rust
use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

## ステップ 3: データベース移行

### 3.1 SQLite テーブル作成

`src/utils/database.ts` を更新して SQLite 操作を追加：

```typescript
import Database from "tauri-plugin-sql-api";

let db: Database;

export const initializeDatabase = async () => {
  db = await Database.load("sqlite:app.db");
  
  // テーブル作成
  await db.execute(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      role TEXT NOT NULL,
      department TEXT NOT NULL,
      hourly_wage INTEGER NOT NULL DEFAULT 1000,
      hire_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS time_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      clock_in TEXT,
      clock_out TEXT,
      break_start TEXT,
      break_end TEXT,
      break_duration INTEGER DEFAULT 0,
      working_hours REAL DEFAULT 0,
      overtime_hours REAL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'working',
      notes TEXT,
      approved_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees (id)
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS shifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      break_duration INTEGER DEFAULT 60,
      type TEXT NOT NULL DEFAULT 'regular',
      status TEXT NOT NULL DEFAULT 'scheduled',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees (id)
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS wage_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      base_rate INTEGER NOT NULL,
      overtime_rate REAL NOT NULL DEFAULT 1.25,
      night_rate REAL NOT NULL DEFAULT 1.25,
      holiday_rate REAL NOT NULL DEFAULT 1.35,
      night_start_hour INTEGER DEFAULT 22,
      night_end_hour INTEGER DEFAULT 5,
      rounding_minutes INTEGER DEFAULT 15,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
};
```

### 3.2 CRUD 操作の実装

```typescript
// 従業員管理
export const getEmployees = async () => {
  return await db.select("SELECT * FROM employees WHERE status = 'active'");
};

export const createEmployee = async (employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => {
  const result = await db.execute(
    `INSERT INTO employees (code, name, email, role, department, hourly_wage, hire_date, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [employee.code, employee.name, employee.email, employee.role, 
     employee.department, employee.hourlyWage, employee.hireDate, employee.status]
  );
  return result;
};

// 勤怠記録
export const createTimeRecord = async (record: Omit<TimeRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
  const result = await db.execute(
    `INSERT INTO time_records (employee_id, date, clock_in, clock_out, break_duration, working_hours, overtime_hours, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [record.employeeId, record.date, record.clockIn, record.clockOut, 
     record.breakDuration, record.workingHours, record.overtimeHours, record.status]
  );
  return result;
};

export const getTimeRecords = async (employeeId?: string, startDate?: string, endDate?: string) => {
  let query = "SELECT * FROM time_records WHERE 1=1";
  const params: any[] = [];

  if (employeeId) {
    query += " AND employee_id = ?";
    params.push(employeeId);
  }

  if (startDate) {
    query += " AND date >= ?";
    params.push(startDate);
  }

  if (endDate) {
    query += " AND date <= ?";
    params.push(endDate);
  }

  query += " ORDER BY date DESC, created_at DESC";

  return await db.select(query, params);
};
```

## ステップ 4: ビルドとデプロイ

### 4.1 開発モード

```bash
npm run tauri dev
```

### 4.2 本番ビルド

```bash
npm run tauri build
```

### 4.3 GitHub Actions 自動ビルド

`.github/workflows/tauri.yml` を作成：

```yaml
name: "publish"
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  publish-tauri:
    permissions:
      contents: write
    strategy:
      fail-fast: false
      matrix:
        platform: [macos-latest, ubuntu-20.04, windows-latest]

    runs-on: ${{ matrix.platform }}
    steps:
      - uses: actions/checkout@v3
      - name: setup node
        uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: install Rust stable
        uses: dtolnay/rust-toolchain@stable
      - name: install dependencies (ubuntu only)
        if: matrix.platform == 'ubuntu-20.04'
        run: |
          sudo apt-get update
          sudo apt-get install -y libgtk-3-dev libwebkit2gtk-4.0-dev libappindicator3-dev librsvg2-dev patchelf
      - name: install frontend dependencies
        run: npm install
      - uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tagName: app-v__VERSION__
          releaseName: "App v__VERSION__"
          releaseBody: "See the assets to download this version and install."
          releaseDraft: true
          prerelease: false
```

## ステップ 5: 自動アップデート機能

### 5.1 Updater 設定

`tauri.conf.json` で updater を有効化：

```json
{
  "updater": {
    "active": true,
    "endpoints": [
      "https://github.com/YOUR_USERNAME/YOUR_REPO/releases/latest/download/latest.json"
    ],
    "dialog": true,
    "pubkey": "YOUR_PUBLIC_KEY"
  }
}
```

### 5.2 アップデート確認

```typescript
import { checkUpdate, installUpdate } from '@tauri-apps/api/updater';

export const checkForUpdates = async () => {
  try {
    const { shouldUpdate, manifest } = await checkUpdate();
    
    if (shouldUpdate) {
      console.log(`Update available: ${manifest?.version}`);
      await installUpdate();
    }
  } catch (error) {
    console.error('Update check failed:', error);
  }
};
```

## ステップ 6: 追加機能

### 6.1 CSV/PDF エクスポート

```bash
npm install jspdf xlsx
```

### 6.2 ファイルシステム操作

```typescript
import { save } from '@tauri-apps/api/dialog';
import { writeTextFile } from '@tauri-apps/api/fs';

export const exportToCSV = async (data: any[]) => {
  const filePath = await save({
    filters: [{
      name: 'CSV',
      extensions: ['csv']
    }]
  });

  if (filePath) {
    const csvContent = convertToCSV(data);
    await writeTextFile(filePath, csvContent);
  }
};
```

## 注意事項

1. **セキュリティ**: Tauri は CSP を自動適用します
2. **パフォーマンス**: SQLite は大量データでも高速です
3. **マルチプラットフォーム**: Windows, macOS, Linux 対応
4. **バックアップ**: データベースファイルの定期バックアップを推奨

## 参考リンク

- [Tauri Documentation](https://tauri.app/)
- [tauri-plugin-sql](https://github.com/tauri-apps/plugins-workspace/tree/v1/plugins/sql)
- [SQLite Documentation](https://www.sqlite.org/docs.html)