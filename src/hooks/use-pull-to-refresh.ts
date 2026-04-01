import { useRef, useCallback, useState } from "react";

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
}

export const usePullToRefresh = ({ onRefresh, threshold = 80 }: UsePullToRefreshOptions) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    if (scrollTop <= 0 && !isRefreshing) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    }
  }, [isRefreshing]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling.current) return;
    const delta = Math.max(0, e.touches[0].clientY - startY.current);
    // Diminishing pull effect
    setPullDistance(Math.min(delta * 0.4, threshold * 1.5));
  }, [threshold]);

  const onTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;
    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      setPullDistance(threshold * 0.5);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    setPullDistance(0);
  }, [pullDistance, threshold, onRefresh]);

  return { pullDistance, isRefreshing, onTouchStart, onTouchMove, onTouchEnd };
};
