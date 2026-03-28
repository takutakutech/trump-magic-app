import React from 'react';
import { Dimensions, Image, StyleSheet, View } from 'react-native';

export const MAX_PHASE = 12;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CARD_RATIO = 1.4; // 縦横比（実際のトランプと同じ）
const cardWidth = Math.min(screenWidth * 0.88, (screenHeight * 0.88) / CARD_RATIO);
const cardHeight = cardWidth * CARD_RATIO;

type Props = {
  phase: number;
  isFaceUp: boolean;
};

export function MagicCard({ phase, isFaceUp }: Props) {
  const clampedPhase = Math.min(phase, MAX_PHASE);
  // phase 0-1 はバッファ（スペードA非表示）、phase 2〜12 で線形にフェードイン
  const spadeOpacity = clampedPhase <= 1 ? 0 : (clampedPhase - 1) / (MAX_PHASE - 1);

  return (
    <View style={styles.card}>
      {/* 裏面レイヤー */}
      <Image
        source={require('../../assets/cards/trump_back.png')}
        style={[StyleSheet.absoluteFill, styles.cardImage, { opacity: isFaceUp ? 0 : 1 }]}
        resizeMode="cover"
      />

      {/* 表面レイヤー①：ダイヤ8（常に土台として表示） */}
      <Image
        source={require('../../assets/cards/trump_dia_8.png')}
        style={[StyleSheet.absoluteFill, styles.cardImage, { opacity: isFaceUp ? 1 : 0 }]}
        resizeMode="cover"
      />

      {/* 表面レイヤー②：スペードA（シェイクでフェードイン） */}
      <Image
        source={require('../../assets/cards/trump_spade_13.png')}
        style={[StyleSheet.absoluteFill, styles.cardImage, { opacity: isFaceUp ? spadeOpacity : 0 }]}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: cardWidth,
    height: cardHeight,
    borderRadius: 16,
    backgroundColor: '#000',
    shadowColor: '#a78bfa',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
    overflow: 'hidden',
  },
  cardImage: {
    width: cardWidth,
    height: cardHeight,
    borderRadius: 16,
  },
});
