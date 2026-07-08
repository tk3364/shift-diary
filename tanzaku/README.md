# 短冊 (tanzaku) — 言葉のジュエリーSNS プロトタイプ

一首(短い詩)と、その下に積もる「解凍」(散文の注釈)と「返歌」のためのSNS。
仕様書のMVPスコープを実装したプロトタイプです。

## 動かし方

```sh
cd tanzaku
npm install
npm run dev   # http://localhost:3000
```

DB は SQLite(`tanzaku/var/tanzaku.db`、初回起動時に自動作成)。マイグレーション不要。

### 動作検証(e2e)

仕様書 §6 の完了条件を Playwright で通しで確認できます。
**まっさらなDB**でサーバーを起動してから:

```sh
rm -rf var/tanzaku.db*
npm run build && npm start &
npm run e2e        # Chromium の場所が特殊な環境では CHROMIUM_PATH=/path/to/chromium を付ける
```

登録二人 → 一日一首制限 → 歌の表示 → 解凍 → 返歌(元歌との連結・枠の消費)→
いいね/通知の不在、までを検証します。

## 実装した思想 → 仕組みの対応

| 原則 | 実装 |
| --- | --- |
| 一首の重みは等しい | どの歌も同じ大きさ・横書きで載せる。字数で扱いを変えない(初版の「短いほど大きく」は検討の末に廃止) |
| 速度を殺す | いいね・数値・通知は存在しない。投稿は一日一首(JST日付で判定) |
| 応答は返歌と解凍のみ | 返歌 = `poems.reply_to_poem_id`、解凍 = `annotations` |
| 一首が種、解凍が年輪 | 詳細ページは解凍スレッドが主役。古い層から順に積む |
| 終わりがある | タイムラインは一日単位。「この日は、ここまで。」で区切り、前後の日へ手動で移動 |
| 盛らない | 明朝+和紙色+墨色+余白のみ。モーションは詳細画面の「墨が滲む」一箇所 |

## 設計判断(仕様書で「要検討」だった点)

- **返歌も一日の投稿枠を消費する**:一首の重みを等しくするため。詠む画面に明記。
- **認証**:ハンドル+合言葉(scryptハッシュ)+ httpOnly cookie セッション。メール不要の最小構成。
- **タイムラインの順序**:その日の時系列(投稿順)。
- **上限60字 / 解凍2000字**。字数は書記素でなくコードポイント単位。

## 画面

- `/` — 眺める(タイムライン)。`?d=YYYY-MM-DD` で過去の日へ
- `/poem/[id]` — 投稿詳細(解凍の場)
- `/yomu` — 詠む。`?reply=ID` で返歌
- `/nanoru` — 名乗る(登録・ログイン)

## スキーマ

`users(id, handle, password_hash)` / `sessions(token, user_id)` /
`poems(id, user_id, body, day, reply_to_poem_id, created_at)` /
`annotations(id, poem_id, user_id, body, created_at)`

`day` は投稿時に確定する JST の日付文字列。一日一首制限とタイムラインの区切りの両方に使う。

## デプロイについての注意

SQLite ファイルはローカルディスク前提なので、Vercel のサーバーレス環境では永続しません。
プロトタイプ段階は `npm run build && npm start` できる VPS / Fly.io / Railway 等が素直です。
Vercel に載せる段になったら仕様書どおり Supabase(Postgres)へ差し替えてください
(DBアクセスは `src/lib/db.ts` に集約してあります)。

## 将来構想のために塞いでいないこと

- `poems.reply_to_poem_id` は連鎖可能(返歌への返歌)→ 本歌取りのリンクグラフ
- 解凍はユーザーIDを持つ通常の行 → AI解凍者は「AIユーザー」を1行足すだけで参加できる
- 通知テーブルは存在しない → ダイジェストは日次バッチで poems/annotations を集計すればよい
