# Trump Magic App - トラブルシューティングレポート

## 概要

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
