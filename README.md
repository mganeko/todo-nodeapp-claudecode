# Todo アプリケーション

Node.js、Express、SQLite3を使用したシンプルなTodoアプリケーションです。

## 機能

- **タスクの追加**: テキスト入力欄にタスクを入力してEnterキーを押すか、「追加」ボタンをクリックしてタスクを追加
- **タスクの完了管理**: チェックボックスをクリックしてタスクの完了/未完了を切り替え（削除はせず、完了状態を管理）
- **個別タスクの削除**: 各タスクの「削除」ボタンで個別にタスクを削除
- **完了済みタスクの一括削除**: 「完了済みを削除」ボタンで完了済みタスクをまとめて削除

## 技術仕様

### サーバーサイド
- **Node.js**: サーバー環境
- **Express**: Webアプリケーションフレームワーク
- **SQLite3**: データベース（todo.dbファイル）
- **REST API**: 以下のエンドポイントを提供
  - `GET /api/todos` - 全タスク取得
  - `GET /api/todos/:id` - 単一タスク取得
  - `POST /api/todos` - 新規タスク作成
  - `PUT /api/todos/:id` - タスク更新
  - `DELETE /api/todos/:id` - 個別タスク削除
  - `DELETE /api/todos/completed/all` - 完了済みタスク一括削除

### クライアントサイド
- **HTML5**: マークアップ
- **CSS3**: スタイリング（レスポンシブデザイン対応）
- **JavaScript (ES6+)**: クライアントサイドロジック（クラスベース）

## ファイル構成

```
todo-nodeapp-claudecode/
├── server.js           # Expressサーバー
├── database.js         # SQLiteデータベース初期化
├── package.json        # Node.js依存関係設定
├── .gitignore         # Git除外設定
├── todo.db            # SQLiteデータベースファイル（自動生成）
├── public/            # 静的ファイル
│   ├── index.html     # メインHTML
│   ├── style.css      # スタイルシート
│   └── script.js      # クライアントサイドJavaScript
└── README.md          # このファイル
```

## インストールと実行

### 必要な環境
- Node.js (v14以上推奨)
- npm

### セットアップ手順

1. **依存関係のインストール**
   ```bash
   npm install
   ```

2. **アプリケーションの起動**
   ```bash
   npm start
   ```
   
   開発時は以下のコマンドでファイル変更を監視して自動再起動：
   ```bash
   npm run dev
   ```

3. **アクセス**
   ブラウザで http://localhost:3000 にアクセス

## データベース

SQLite3を使用してローカルファイル（`todo.db`）にデータを保存します。
データベースとテーブルは初回起動時に自動的に作成されます。

### テーブル構造
```sql
todos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

## 開発について

このアプリケーションは**Claude Code (Sonnet 4)**を使用して生成されました。
Claude CodeはAnthropic社のAIアシスタントであり、コード生成と開発支援を行います。

## ライセンス

MIT License

## 今後の拡張可能性

- ユーザー認証機能
- タスクのカテゴリ分け
- 期限設定機能
- タスクの並び替え機能
- データのエクスポート/インポート機能