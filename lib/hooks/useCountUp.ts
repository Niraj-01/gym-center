'use client';

/**
 * useCountUp — Animate a number from 0 to target with easing.
 * Used for stats/counters to give a "live data" feel.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

function easeOutExpo(t: number): number {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function useCountUp(target: number, duration: number = 1200, delay: number = 0): number {
    const [current, setCurrent] = useState(0);
    const prevTarget = useRef(0);
    const frameRef = useRef<number>(0);

    const animateTo = useCallback((newTarget: number) => {
        const startValue = prevTarget.current;
        prevTarget.current = newTarget;

        if (newTarget === 0) {
            // Reset without animation
            prevTarget.current = 0;
            return;
        }

        let startTime: number | null = null;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeOutExpo(progress);

            const value = Math.round(startValue + (newTarget - startValue) * easedProgress);
            setCurrent(value);

            if (progress < 1) {
                frameRef.current = requestAnimationFrame(animate);
            }
        };

        const timeoutId = setTimeout(() => {
            frameRef.current = requestAnimationFrame(animate);
        }, delay);

        return () => {
            clearTimeout(timeoutId);
            cancelAnimationFrame(frameRef.current);
        };
    }, [duration, delay]);

    useEffect(() => {
        const cleanup = animateTo(target);
        return cleanup;
    }, [target, animateTo]);

    return current;
}

