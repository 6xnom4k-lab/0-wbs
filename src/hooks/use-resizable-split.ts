"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";

const DIVIDER_WIDTH_PX = 4;

type UseResizableSplitOptions = {
  storageKey: string;
  defaultRatio?: number;
  minStartPx?: number;
  minEndPx?: number;
};

function readStoredRatio(storageKey: string, defaultRatio: number): number {
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) {
    return defaultRatio;
  }

  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0.1 || value >= 0.9) {
    return defaultRatio;
  }

  return value;
}

export function useResizableSplit({
  storageKey,
  defaultRatio = 0.6,
  minStartPx = 320,
  minEndPx = 160,
}: UseResizableSplitOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const splitRatioRef = useRef(defaultRatio);
  const [splitRatio, setSplitRatio] = useState(defaultRatio);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    setSplitRatio(readStoredRatio(storageKey, defaultRatio));
  }, [defaultRatio, storageKey]);

  useEffect(() => {
    splitRatioRef.current = splitRatio;
  }, [splitRatio]);

  const clampRatio = useCallback(
    (ratio: number, containerWidth: number) => {
      const maxStart = containerWidth - minEndPx - DIVIDER_WIDTH_PX;
      const minRatio = minStartPx / containerWidth;
      const maxRatio = maxStart / containerWidth;
      return Math.min(Math.max(ratio, minRatio), maxRatio);
    },
    [minEndPx, minStartPx],
  );

  const startResize = useCallback((event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) {
      return;
    }

    const handlePointerMove = (event: globalThis.PointerEvent) => {
      const container = containerRef.current;
      if (!container) {
        return;
      }

      const rect = container.getBoundingClientRect();
      const rawRatio = (event.clientX - rect.left) / rect.width;
      const nextRatio = clampRatio(rawRatio, rect.width);
      splitRatioRef.current = nextRatio;
      setSplitRatio(nextRatio);
    };

    const handlePointerUp = () => {
      setIsResizing(false);
      window.localStorage.setItem(storageKey, String(splitRatioRef.current));
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [clampRatio, isResizing, storageKey]);

  const startPanelStyle: CSSProperties = {
    width: `${splitRatio * 100}%`,
    flexShrink: 0,
  };

  return {
    containerRef,
    splitRatio,
    isResizing,
    startPanelStyle,
    startResize,
  };
}
