import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MagicCard, MAX_PHASE } from './src/components/MagicCard';
import { useShakeDetector } from './src/hooks/useShakeDetector';

type Screen = 'home' | 'game';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [phase, setPhase] = useState(0);
  const [isFaceUp, setIsFaceUp] = useState(false);
  const cardX = useRef(new Animated.Value(0)).current;
  const flipAnim = useRef(new Animated.Value(1)).current;

  // PanResponder クロージャから最新の state を参照するための ref
  const isFaceUpRef = useRef(false);
  const phaseRef = useRef(0);
  useEffect(() => { isFaceUpRef.current = isFaceUp; }, [isFaceUp]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // シェイク中（フェーズが途中）はタップ無効
  const isRevealing = phase > 0 && phase < MAX_PHASE;

  const handleBackToHome = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setScreen('home');
    setPhase(0);
    setIsFaceUp(false);
    cardX.setValue(0);
    flipAnim.setValue(1);
    isFaceUpRef.current = false;
    phaseRef.current = 0;
  }, [cardX, flipAnim]);

  const handleStart = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPhase(0);
    setIsFaceUp(false);
    cardX.setValue(0);
    flipAnim.setValue(1);
    isFaceUpRef.current = false;
    phaseRef.current = 0;
    setScreen('game');
  }, [cardX, flipAnim]);

  // シェイク：表向きのときのみ有効
  const handleShake = useCallback(() => {
    if (!isFaceUpRef.current) return;
    setPhase((prev) => {
      if (prev >= MAX_PHASE) return prev;
      const next = prev + 1;
      phaseRef.current = next;
      if (next >= MAX_PHASE) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      return next;
    });
  }, []);

  // タップでカードを裏返す（シェイク中は無効）
  const handleFlip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.timing(flipAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      setIsFaceUp((prev) => {
        isFaceUpRef.current = !prev;
        return !prev;
      });
      Animated.timing(flipAnim, { toValue: 1, duration: 120, useNativeDriver: true }).start();
    });
  }, [flipAnim]);

  // 3本指長押し検出用
  const longPressStartTime = useRef<number>(0);
  const longPressFingerCount = useRef<number>(0);

  // 右スワイプ用：タッチ開始時刻（長押し判定に使用）
  const swipeTouchStartTime = useRef<number>(0);

  // 右スワイプ：シェイク完了後（phase === MAX_PHASE）かつ裏向きかつ長押し後（300ms）のみ有効
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) =>
        phaseRef.current >= MAX_PHASE &&
        !isFaceUpRef.current &&
        Date.now() - swipeTouchStartTime.current >= 300 &&
        evt.nativeEvent.touches.length === 1 &&
        gestureState.dx > 15 &&
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx > 0) {
          cardX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 80 || gestureState.vx > 0.5) {
          // 右に飛ばして黒背景だけ残す
          Animated.timing(cardX, {
            toValue: 600,
            duration: 280,
            useNativeDriver: true,
          }).start();
        } else {
          Animated.spring(cardX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useShakeDetector(handleShake, screen === 'game');

  if (screen === 'home') {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <Text style={styles.title}>✨ Magic Card</Text>
        <Text style={styles.homeSubtitle}>スマホを振ってカードを呼び出せ</Text>
        <TouchableOpacity style={styles.startButton} onPress={handleStart} activeOpacity={0.8}>
          <Text style={styles.startButtonText}>START</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={styles.gameContainer}
      onTouchStart={(e) => {
        if (e.nativeEvent.touches.length === 3) {
          longPressStartTime.current = Date.now();
          longPressFingerCount.current = 3;
        } else {
          longPressFingerCount.current = 0;
        }
      }}
      onTouchEnd={() => {
        if (longPressFingerCount.current === 3 && Date.now() - longPressStartTime.current >= 600) {
          handleBackToHome();
        }
        longPressFingerCount.current = 0;
      }}
    >
      <StatusBar style="light" />
      <Animated.View
        style={{ transform: [{ translateX: cardX }, { scaleX: flipAnim }] }}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          onPressIn={() => { swipeTouchStartTime.current = Date.now(); }}
          onPress={handleFlip}
          activeOpacity={1}
          disabled={isRevealing}
        >
          <MagicCard phase={phase} isFaceUp={isFaceUp} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  gameContainer: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#e2d9f3',
    letterSpacing: 2,
  },
  homeSubtitle: {
    fontSize: 15,
    color: '#a78bfa',
    textAlign: 'center',
  },
  startButton: {
    paddingVertical: 16,
    paddingHorizontal: 64,
    borderRadius: 50,
    backgroundColor: '#a78bfa',
  },
  startButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 3,
  },
});
