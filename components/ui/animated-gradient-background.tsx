"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

const DEFAULT_COLORS = [
  "#0A0A0A",
  "#2979FF",
  "#FF80AB",
  "#FF6D00",
  "#FFD600",
  "#00E676",
  "#3D5AFE",
];
const DEFAULT_STOPS = [35, 50, 60, 70, 80, 90, 100];

export interface AnimatedGradientBackgroundProps {
  /**
   * Initial size of the radial gradient (width, in %).
   * @default 125
   */
  startingGap?: number;
  /**
   * Enables the breathing animation. Automatically disabled when the user
   * prefers reduced motion.
   * @default false
   */
  breathing?: boolean;
  /**
   * Colors of the radial gradient. Each color maps to a stop in `gradientStops`.
   */
  gradientColors?: string[];
  /**
   * Percentage stops (0-100) matching each color in `gradientColors`.
   */
  gradientStops?: number[];
  /**
   * Speed of the breathing animation. Lower is slower.
   * @default 0.02
   */
  animationSpeed?: number;
  /**
   * How far the gradient expands/contracts, in percentage points.
   * @default 5
   */
  breathingRange?: number;
  /** Extra inline styles for the inner gradient layer. */
  containerStyle?: React.CSSProperties;
  /** Extra class names for the outer wrapper. */
  containerClassName?: string;
  /**
   * Extra vertical size (in %) added to the gradient for finer control.
   * @default 0
   */
  topOffset?: number;
}

/**
 * Decorative animated radial-gradient background.
 *
 * - Purely visual: hidden from assistive tech and ignores pointer events.
 * - Respects `prefers-reduced-motion` (no entrance zoom, no breathing).
 * - Only runs a requestAnimationFrame loop while breathing is active.
 *
 * Place it inside a `relative` parent; it fills the parent with `absolute inset-0`.
 */
function AnimatedGradientBackground({
  startingGap = 125,
  breathing = false,
  gradientColors = DEFAULT_COLORS,
  gradientStops = DEFAULT_STOPS,
  animationSpeed = 0.02,
  breathingRange = 5,
  containerStyle,
  containerClassName,
  topOffset = 0,
}: AnimatedGradientBackgroundProps) {
  const prefersReducedMotion = useReducedMotion();
  const layerRef = React.useRef<HTMLDivElement | null>(null);

  // Validate without crashing the whole page: fall back to defaults.
  const isValid = gradientColors.length === gradientStops.length;
  if (!isValid && process.env.NODE_ENV !== "production") {
    console.error(
      `[AnimatedGradientBackground] gradientColors (${gradientColors.length}) and gradientStops (${gradientStops.length}) must have the same length. Falling back to defaults.`
    );
  }
  const colors = isValid ? gradientColors : DEFAULT_COLORS;
  const stops = isValid ? gradientStops : DEFAULT_STOPS;

  React.useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;

    const stopsString = stops
      .map((stop, index) => `${colors[index]} ${stop}%`)
      .join(", ");

    const paint = (width: number) => {
      layer.style.background = `radial-gradient(${width}% ${
        width + topOffset
      }% at 50% 20%, ${stopsString})`;
    };

    // Static paint first; the loop below only runs when breathing is active.
    paint(startingGap);

    if (!breathing || prefersReducedMotion) return;

    let frame = 0;
    let width = startingGap;
    let direction = 1;

    const tick = () => {
      if (width >= startingGap + breathingRange) direction = -1;
      if (width <= startingGap - breathingRange) direction = 1;
      width += direction * animationSpeed;
      paint(width);
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [
    colors,
    stops,
    startingGap,
    breathing,
    prefersReducedMotion,
    animationSpeed,
    breathingRange,
    topOffset,
  ]);

  return (
    <motion.div
      aria-hidden="true"
      initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 1.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: prefersReducedMotion ? 0.2 : 2,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        containerClassName
      )}
    >
      <div
        ref={layerRef}
        style={containerStyle}
        className="absolute inset-0 will-change-transform"
      />
    </motion.div>
  );
}

export { AnimatedGradientBackground };
export default AnimatedGradientBackground;
