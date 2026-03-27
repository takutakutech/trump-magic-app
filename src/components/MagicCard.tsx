import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export const MAX_PHASE = 12;

type Props = {
  phase: number;
  isFaceUp: boolean;
};

export function MagicCard({ phase, isFaceUp }: Props) {
  const clampedPhase = Math.min(phase, MAX_PHASE);
  // phase 0-1 はバッファ（スペード非表示）、phase 2〜12 で線形にフェードイン
  const spadeOpacity = clampedPhase <= 1 ? 0 : (clampedPhase - 1) / (MAX_PHASE - 1);

  return (
    <View style={styles.card}>
      {/* 裏面レイヤー */}
      <View style={[StyleSheet.absoluteFill, styles.cardBack, { opacity: isFaceUp ? 0 : 1 }]}>
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

      {/* 表面レイヤー */}
      <View style={[StyleSheet.absoluteFill, styles.cardFace, { opacity: isFaceUp ? 1 : 0 }]}>
        <Text style={[styles.cornerLabel, { opacity: spadeOpacity }]}>A♠</Text>
        <Text style={[styles.centerSuit, { opacity: spadeOpacity }]}>♠</Text>
        <Text style={[styles.cornerLabel, styles.cornerLabelBottom, { opacity: spadeOpacity }]}>
          A♠
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 280,
    height: 392,
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
    fontSize: 28,
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
    fontSize: 128,
    textAlign: 'center',
    marginTop: 100,
    color: '#1a1a1a',
  },
});
