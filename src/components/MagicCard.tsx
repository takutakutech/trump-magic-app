import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

export const MAX_PHASE = 5;

// フェーズごとのカード状態定義
const PHASES = [
  { label: null,  suit: null,   backOpacity: 1.0, faceOpacity: 0.0 }, // 0: 裏面
  { label: null,  suit: null,   backOpacity: 0.8, faceOpacity: 0.15 }, // 1: うっすら
  { label: 'A',   suit: '♠',   backOpacity: 0.55, faceOpacity: 0.35 }, // 2: 少し見える
  { label: 'A',   suit: '♠',   backOpacity: 0.35, faceOpacity: 0.6  }, // 3: かなり見える
  { label: 'A',   suit: '♠',   backOpacity: 0.15, faceOpacity: 0.85 }, // 4: ほぼ表
  { label: 'A',   suit: '♠',   backOpacity: 0.0,  faceOpacity: 1.0  }, // 5: 完全に表
];

type Props = {
  phase: number;
};

export function MagicCard({ phase }: Props) {
  const animatedOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // フェーズ変化時: 一瞬フェードアウト → フェードイン
    Animated.sequence([
      Animated.timing(animatedOpacity, {
        toValue: 0.2,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(animatedOpacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
  }, [phase]);

  const current = PHASES[phase] ?? PHASES[MAX_PHASE];

  return (
    <Animated.View style={{ opacity: animatedOpacity }}>
      <View style={styles.card}>
        {/* カード裏面レイヤー */}
        <View style={[StyleSheet.absoluteFill, styles.cardBack, { opacity: current.backOpacity }]}>
          <View style={styles.backPattern}>
            {Array.from({ length: 5 }).map((_, i) => (
              <View key={i} style={styles.backRow}>
                {Array.from({ length: 4 }).map((_, j) => (
                  <Text key={j} style={styles.backSymbol}>♦</Text>
                ))}
              </View>
            ))}
          </View>
        </View>

        {/* カード表面レイヤー */}
        <View style={[StyleSheet.absoluteFill, styles.cardFace, { opacity: current.faceOpacity }]}>
          {current.label && current.suit ? (
            <>
              <Text style={styles.cornerLabel}>{current.label}{current.suit}</Text>
              <Text style={styles.centerSuit}>{current.suit}</Text>
              <Text style={[styles.cornerLabel, styles.cornerLabelBottom]}>
                {current.label}{current.suit}
              </Text>
            </>
          ) : null}
        </View>
      </View>

      {/* フェーズ表示 (overflow:hiddenの外に移動) */}
      <View style={styles.phaseBar}>
        {Array.from({ length: MAX_PHASE + 1 }).map((_, i) => (
          <View
            key={i}
            style={[styles.phaseDot, i <= phase && styles.phaseDotActive]}
          />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 220,
    height: 320,
    borderRadius: 16,
    backgroundColor: '#fff',
    shadowColor: '#a78bfa',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
    overflow: 'hidden',
  },
  cardBack: {
    backgroundColor: '#1e3a8a',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    padding: 12,
  },
  backPattern: {
    gap: 8,
  },
  backRow: {
    flexDirection: 'row',
    gap: 16,
  },
  backSymbol: {
    color: '#93c5fd',
    fontSize: 22,
    opacity: 0.7,
  },
  cardFace: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
  },
  cornerLabel: {
    position: 'absolute',
    top: 12,
    left: 12,
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  cornerLabelBottom: {
    top: undefined,
    left: undefined,
    bottom: 12,
    right: 12,
    transform: [{ rotate: '180deg' }],
  },
  centerSuit: {
    fontSize: 100,
    textAlign: 'center',
    marginTop: 80,
    color: '#1a1a1a',
  },
  phaseBar: {
    position: 'absolute',
    bottom: -32,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  phaseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  phaseDotActive: {
    backgroundColor: '#a78bfa',
    borderColor: '#a78bfa',
  },
});
