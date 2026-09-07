"use client";

import { useRef, useState, type TouchEvent } from "react";

interface MonthGridProps {
  children: React.ReactNode;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  className?: string;
}

const SWIPE_THRESHOLD_PX = 50;
const SWIPE_MAX_VERTICAL_PX = 80;

export function MonthGrid({
  children,
  onSwipeLeft,
  onSwipeRight,
  className,
}: MonthGridProps) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const [dragX, setDragX] = useState(0);

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
    setDragX(0);
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!touchStart.current) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStart.current.x;
    setDragX(deltaX);
  };

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (!touchStart.current) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.current.x;
    const deltaY = touch.clientY - touchStart.current.y;

    if (
      Math.abs(deltaX) >= SWIPE_THRESHOLD_PX &&
      Math.abs(deltaY) <= SWIPE_MAX_VERTICAL_PX
    ) {
      if (deltaX < 0) {
        onSwipeLeft();
      } else {
        onSwipeRight();
      }
    }

    touchStart.current = null;
    setDragX(0);
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: dragX ? `translateX(${dragX * 0.15}px)` : undefined,
        transition: dragX ? "none" : "transform 150ms ease-out",
      }}
      className={className ?? "grid grid-cols-7 gap-px"}
    >
      {children}
    </div>
  );
}
