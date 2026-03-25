# アプリ要件定義書：Magic Card（トランプマジックアプリ）

## 1. コンセプト
「スマホを振ると、トランプの絵柄が徐々に浮かび上がる」マジック体験アプリ。
Expo Go のネイティブコンポーネント（センサー・ハプティクス・アニメーション）を学ぶための習作プロジェクト。

---

## 2. 開発方針
- **Expo Go で完結**（EAS Build・カスタムDev Client 不要）
- ネイティブモジュール: `expo-sensors`（加速度センサー）、`expo-haptics`（触覚フィードバック）
- 画像ファイル不使用。カードは React Native の View + Text で描画

---

## 3. 体験フロー

1. アプリ起動 → トランプの**裏面**が表示される
2. スマホを振る → フェーズが +1 進み、「チッ」とバイブが鳴る
3. 6回振ると → **スペードのA** が完全に表になる（成功バイブ）
4. 「もう一度」ボタンをタップ → 裏面にリセット

---

## 4. スコアリング（フェーズ定義）

| フェーズ | 状態 |
|--------|------|
| 0 | カード裏面（青い模様） |
| 1 | 裏面 + うっすらグロー（opacity 15%） |
| 2 | 絵柄が少し透けている（opacity 35%） |
| 3 | 絵柄がかなり見える（opacity 60%） |
| 4 | ほぼ表面（opacity 85%） |
| 5 | 完全に表面 — スペードのA（opacity 100%） |

---

## 5. 技術スタック

| 項目 | 採用技術 |
|------|---------|
| フレームワーク | Expo (React Native) SDK 55 |
| 言語 | TypeScript |
| シェイク検知 | `expo-sensors` — Accelerometer |
| 触覚フィードバック | `expo-haptics` |
| アニメーション | React Native `Animated` API |
| 状態管理 | React `useState` / `useRef` |
| ビルド環境 | Expo Go（実機テスト） |

---

## 6. シェイク検知アルゴリズム

```
magnitude = √(ax² + ay² + az²)
magnitude > 1.8g かつ 直前のシェイクから 600ms 以上経過 → シェイクとみなす
```

- ポーリング間隔: 100ms
- debounce で連続検知を防止

---

## 7. ファイル構成

```
trump-magic-app/
├── App.tsx                        # メイン画面（レイアウト・状態管理）
├── src/
│   ├── hooks/
│   │   └── useShakeDetector.ts    # シェイク検知カスタムフック
│   └── components/
│       └── MagicCard.tsx          # カード表示コンポーネント（フェーズ対応）
├── app.json
├── package.json
└── requirement.md                 # 本ファイル
```

---

## 8. スコープ外（今後の拡張候補）

- ウィジェット連携（expo-widgets）
- HealthKit / スクリーンタイム連携
- カードの種類をランダムに選択
- Android 対応（expo-haptics の動作確認）
