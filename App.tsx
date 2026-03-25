import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MagicCard, MAX_PHASE } from './src/components/MagicCard';
import { useShakeDetector } from './src/hooks/useShakeDetector';

export default function App() {
  const [phase, setPhase] = useState(0);
  const isRevealed = phase >= MAX_PHASE;

  const handleShake = useCallback(() => {
    setPhase((prev) => {
      if (prev >= MAX_PHASE) return prev; // 完全公開後は無視

      const next = prev + 1;

      if (next >= MAX_PHASE) {
        // 完全公開: 成功バイブ
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        // 途中: 軽いタップ感
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      return next;
    });
  }, []);

  const handleReset = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhase(0);
  }, []);

  useShakeDetector(handleShake);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <Text style={styles.title}>✨ Magic Card</Text>
      <Text style={styles.subtitle}>
        {isRevealed ? '🎉 カードが現れた！' : 'スマホを振ってカードを呼び出せ'}
      </Text>

      <View style={styles.cardWrapper}>
        <MagicCard phase={phase} />
      </View>

      <TouchableOpacity
        style={[styles.resetButton, isRevealed && styles.resetButtonActive]}
        onPress={handleReset}
        activeOpacity={0.7}
      >
        <Text style={styles.resetButtonText}>
          {isRevealed ? '🔄 もう一度' : 'リセット'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0c29',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#e2d9f3',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 15,
    color: '#a78bfa',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  cardWrapper: {
    marginVertical: 20,
    paddingBottom: 48,
  },
  resetButton: {
    marginTop: 16,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: 'rgba(167,139,250,0.4)',
    backgroundColor: 'rgba(167,139,250,0.08)',
  },
  resetButtonActive: {
    borderColor: '#a78bfa',
    backgroundColor: 'rgba(167,139,250,0.2)',
  },
  resetButtonText: {
    color: '#e2d9f3',
    fontSize: 16,
    fontWeight: '600',
  },
});
