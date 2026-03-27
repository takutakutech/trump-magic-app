import { useEffect, useRef } from 'react';
import { Accelerometer } from 'expo-sensors';

const SHAKE_THRESHOLD = 1.5; // 重力加速度の倍率
const DEBOUNCE_MS =150;      // シェイク間の最小間隔(ms)

export function useShakeDetector(onShake: () => void, enabled: boolean) {
  const lastShakeTime = useRef<number>(0);
  const onShakeRef = useRef(onShake);

  // onShake が変わっても古い subscription を張り替えないよう ref で管理
  useEffect(() => {
    onShakeRef.current = onShake;
  }, [onShake]);

  useEffect(() => {
    if (!enabled) return;

    Accelerometer.setUpdateInterval(100);

    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      const magnitude = Math.sqrt(x * x + y * y + z * z);

      if (magnitude > SHAKE_THRESHOLD) {
        const now = Date.now();
        if (now - lastShakeTime.current > DEBOUNCE_MS) {
          lastShakeTime.current = now;
          onShakeRef.current();
        }
      }
    });

    return () => subscription.remove();
  }, [enabled]);
}
