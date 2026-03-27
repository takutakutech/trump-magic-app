# Trump Magic App - 開発レポート

---

## Part 1：環境セットアップ（初回） — 2026-03-25

Expo Go 54.0.2 (iPhone) でアプリが起動できなかった問題の記録。

---

## エラー① SDK バージョン不一致

### エラー内容
```
Your project is using incompatible versions of Expo SDK.
Project: 55.x / Expo Go: 54.0.2
```

### 原因
プロジェクトの expo SDK バージョン（55.x）と、iPhone にインストールされている Expo Go のバージョン（54.0.2）が一致していなかった。

### 解決方法
`package.json` の expo を SDK 54 に合わせてダウングレードする。

---

## エラー② TurboModuleRegistry / PlatformConstants

### エラー内容
```
TurboModuleRegistry.getEnforcing(...): 'PlatformConstants' could not be found
```

### 原因（複数重なっていた）

| # | 原因 | 詳細 |
|---|------|------|
| 1 | **`babel.config.js` が存在しなかった** | Expo プロジェクトに必須のファイル。これがないと `babel-preset-expo` が適用されず、React Native の TurboModule（New Architecture）の初期化が正しく行われない |
| 2 | **`metro.config.js` が存在しなかった** | Metro Bundler の Expo 用設定が未適用のため、モジュール解決が壊れていた |
| 3 | **`newArchEnabled: false` を app.json に追加していた** | SDK 54 はデフォルトで New Architecture を使用する。`false` にすることで JS 側と Expo Go ネイティブ側のアーキテクチャが食い違い、エラーが悪化していた |
| 4 | **`@types/react` のバージョンが古かった** | `react-native@0.81.5` は `@types/react@^19.1.0` を要求するが、`~18.3.0` を指定していたため依存関係の競合が発生していた |

### 解決方法

**1. `babel.config.js` を作成する**
```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
```

**2. `metro.config.js` を作成する**
```js
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
module.exports = config;
```

**3. `app.json` から `newArchEnabled: false` を削除する**

**4. `package.json` の依存関係を正しいバージョンに修正する**
```json
{
  "dependencies": {
    "expo": "~54.0.0",
    "expo-haptics": "~15.0.8",
    "expo-sensors": "~15.0.8",
    "expo-status-bar": "~3.0.9",
    "react": "19.1.0",
    "react-native": "0.81.5"
  },
  "devDependencies": {
    "@types/react": "~19.1.0",
    "typescript": "~5.3.3"
  }
}
```

---

## エラー③ npm install の失敗（ERESOLVE）

### エラー内容
```
npm error ERESOLVE could not resolve
npm error peerOptional @types/react@"^19.1.0" from react-native@0.81.5
```

### 原因
peer dependency のバージョン競合。主に `@types/react` のバージョン不一致が原因。

### 解決方法
```powershell
npm install --legacy-peer-deps
```
`--legacy-peer-deps` フラグで peer dependency の競合を無視してインストールする（npm v6 以前の挙動）。

---

## エラー④ ネットワーク接続エラー

### エラー内容
```
There was a problem running the requested app.
Unknown error: Could not connect to the server.
```
```
The request timed out. exp://...:8082
```

### 原因
PC とスマホが異なるネットワーク（または同一 WiFi でもファイアウォール等でブロック）にあり、Metro Bundler に直接接続できなかった。

### 解決方法
```powershell
npx expo start --tunnel
```
`--tunnel` モードで ngrok 経由のトンネルを使用することで、ネットワーク構成に関わらず接続できる。

---

## エラー⑤ PowerShell でのコマンド構文エラー

### エラー内容
```
Remove-Item: A positional parameter cannot be found that accepts argument '/q'.
```

### 原因
`rmdir /s /q` は Windows CMD の構文。PowerShell では使えない。

### 解決方法
PowerShell では以下を使用する：
```powershell
Remove-Item -Recurse -Force node_modules
```

---

## 最終的な起動手順

```powershell
Remove-Item -Recurse -Force node_modules
npm install --legacy-peer-deps
npx expo start --clear
```

スマホと PC が別ネットワークの場合：
```powershell
npx expo start --tunnel --clear
```

---

## 教訓

- `create-expo-app` で作成されたプロジェクトには必ず `babel.config.js` と `metro.config.js` が含まれる。手動でセットアップする場合は必ず作成すること。
- Expo Go のバージョンに合わせた SDK バージョンを使用すること。
- `newArchEnabled` は基本的に触らない。SDK 54 以降はデフォルトで New Architecture が有効。
- npm の依存関係競合は `--legacy-peer-deps` で回避できる場合が多い。

---

## Part 2：機能開発ログ

### セッション 1：MVP 〜 UX 改善 — 2026-03-27

#### フェーズ遷移のフラッシュ除去
- 元実装は遷移ごとに `Animated.sequence`（フェードアウト→フェードイン）を使っており、一瞬消える現象が発生
- アニメーション全廃除。PHASES 配列の `backOpacity` / `faceOpacity` の値ブレンドのみに統一
- **学び**：アニメーションを「重ねる」のではなく、表示状態の定義を増やすことで滑らかな遷移ができる

#### 段階数の増加・グラデーション滑らか化
- フェーズ数を 5 → 12 段階に増加（0.09 刻みの均等グラデーション）
- フェーズ 0〜1 をバッファ（同一裏面）とし、誤シェイク時のリカバリを確保
- シェイク debounce を 150ms に短縮（合計シェイク時間 約3秒をキープしつつ感度を上げた）

#### カードデザイン・画面整理
- 実際のトランプと同じ縦横比（1:1.4）に拡大 → 280 × 392px
- 背景を純黒（`#000000`）に変更
- 完了メッセージ・フェーズドット・リセットボタンなどを削除（お客さんに見せる画面に余計な情報は不要）

---

### セッション 2：ホーム画面・隠し操作の追加 — 2026-03-27

#### ホーム画面の実装
- `'home' | 'game'` の state による画面切り替え（ナビゲーションライブラリ不使用、2画面だけなので state で十分）
- ホーム画面：タイトル・サブタイトル・START ボタンのみ
- ゲーム画面：カードのみ（演技中にお客さんに見せる画面なので余計な UI は一切なし ← 重要設計方針）
- ホーム画面中はセンサーを停止（`useShakeDetector` に `enabled` フラグを追加）

#### 演者用の隠し操作
マジックの演技中、演者だけが使う「お客さんに見えない操作」として実装：
- **右スワイプ**：カードが画面外へ飛び去り、黒背景だけが残る
- **3本指長押し（600ms）**：ホーム画面へ戻る（最初はタップだったが誤作動防止で長押しに変更）

**実装のポイント**
- 右スワイプは `PanResponder` で実装。`onStartShouldSetPanResponder: () => false` にして通常タップは子コンポーネントに渡し、横スワイプ時のみ PanResponder が responder を奪う
- 3本指タップと PanResponder の競合防止：`onMoveShouldSetPanResponder` で `touches.length === 1` をチェック
- 長押し検出：`onTouchStart` でタッチ開始時刻を記録し `onTouchEnd` で経過時間を判定

---

### セッション 3：体験フローの大幅リデザイン — 2026-03-27

#### 新しい体験フロー
```
1. 裏面のカードが表示される
2. タップ → 表裏ひっくり返す（何回でも可）
3. 表向きの状態でシェイク → スペードが徐々に浮かび上がる
4. 柄が出てから、タップで表裏を行き来できる（何回でも可）
5. シェイク完了後・裏向き状態で右スライド → カードが飛び去り黒背景のみ残る
```

**制約ルール（マジックとして成立させるために重要）**
- シェイクは表向きのときのみ有効
- シェイク中（フェーズ途中）はタップ無効
- 右スライドはシェイク完了後（phase = MAX_PHASE）かつ裏向きのときのみ有効

#### 実装の変更点

**MagicCard.tsx の簡素化**
- PHASES 配列を廃止。`isFaceUp` prop を追加
- 裏向き時：常に青いダイヤ柄バックを表示（phase 無視）
- 表向き時：白いカード面を表示し、スペード文字の opacity を phase から線形計算
  ```
  spadeOpacity = phase <= 1 ? 0 : (phase - 1) / (MAX_PHASE - 1)
  ```

**フリップアニメーション**
- `flipAnim`（`Animated.Value`、scaleX に使用）でカードフリップを表現
- 流れ：scaleX 1→0（120ms）→ `isFaceUp` をトグル → scaleX 0→1（120ms）
- scaleX が 0（カードが端から見えている状態）のミッドポイントで内容を差し替えることで自然なフリップ演出になる

**PanResponder クロージャ問題の解決**
- PanResponder は `useRef` で初回のみ生成するためクロージャが古い state を参照する問題が発生
- `isFaceUpRef` / `phaseRef` を用意し、`useEffect` で state と同期させることで解決

#### スワイプとタップの誤作動防止
- 右スワイプとタップ（フリップ）の操作感が近く誤作動が発生
- **対策**：スワイプ開始前に 300ms の長押しを要求
  - `TouchableOpacity` の `onPressIn` でタッチ開始時刻を記録
  - `onMoveShouldSetPanResponder` で `Date.now() - swipeTouchStartTime >= 300` をチェック
  - 短いタップはスワイプ判定されず、そのまま `onPress`（フリップ）が発火する

---

## 最終的なパラメータ一覧

| 項目 | 値 |
|------|-----|
| フェーズ数 | 12（MAX_PHASE） |
| シェイク閾値 | 1.5g |
| Debounce | 150ms |
| カードサイズ | 280 × 392px |
| フリップアニメーション | scaleX 各 120ms |
| スワイプ長押し閾値 | 300ms |
| 3本指長押し閾値 | 600ms |

---

## 技術的な学び・メモ

| テーマ | 内容 |
|--------|------|
| PanResponder + TouchableOpacity 共存 | `onStartShouldSetPanResponder: () => false` でタップは子の TouchableOpacity が処理。スワイプ時のみ PanResponder が responder を奪う |
| PanResponder クロージャ問題 | `useRef` で一度だけ生成されるため state の変化がクロージャに反映されない。参照したい state は ref で別途管理する |
| フリップのミッドポイント切り替え | scaleX 0 のフレームで state を切り替えると、「カードが端から見えている瞬間」に内容が差し替わり自然なフリップになる |
| センサーの on/off | `useEffect` の cleanup（`subscription.remove()`）で `enabled` が false のときセンサーを止める。バッテリー消費の削減にもなる |
| 長押し判定のシンプルな実装 | `onTouchStart` で時刻記録 → `onTouchEnd` で経過時間チェック。タイマーや interval 不要 |
