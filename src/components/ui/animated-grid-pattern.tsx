"use client";

import * as React from "react";
import { motion, useAnimation, useMotionValue, useTransform, useMotionTemplate } from "framer-motion";

import { cn } from "@/lib/utils";

type AnimatedGridPatternProps = {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  strokeDasharray?: number;
  numSquares?: number;
  className?: string;
  maxOpacity?: number;
  duration?: number;
  repeatDelay?: number;
};

export function AnimatedGridPattern({
  width = 40,
  height = 40,
  x = -1,
  y = -1,
  strokeDasharray = 0,
  numSquares = 50,
  className,
  maxOpacity = 0.5,
  duration = 4,
  repeatDelay = 0.5,
  ...props
}: AnimatedGridPatternProps) {
  const controls = useAnimation();
  const [squares, setSquares] = React.useState<Array<[number, number, number]>>([]);
  const containerRef = React.useRef<SVGSVGElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = React.useCallback((event: MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      mouseX.set(event.clientX - rect.left);
      mouseY.set(event.clientY - rect.top);
    }
  }, [mouseX, mouseY]);

  React.useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  const gridWidth = width;
  const gridHeight = height;

  React.useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const observer = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect();
      const columns = Math.floor(rect.width / gridWidth);
      const rows = Math.floor(rect.height / gridHeight);

      const generatedSquares = Array.from({ length: numSquares }, (_, i) => [
        Math.floor(Math.random() * columns),
        Math.floor(Math.random() * rows),
        i,
      ]) as Array<[number, number, number]>;

      setSquares(generatedSquares);
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [gridWidth, gridHeight, numSquares]);

  React.useEffect(() => {
    controls.start((i) => ({
      opacity: [0, maxOpacity, 0],
      transition: {
        duration,
        repeat: Infinity,
        delay: i * 0.05,
      },
    }));
  }, [controls, maxOpacity, duration]);

  const maskImage = useMotionTemplate`radial-gradient(200px circle at ${mouseX}px ${mouseY}px, white, transparent)`;
  const opacity = useTransform(mouseX, [0, 1000], [0.15, 0.5]);

  return (
    <svg
      ref={containerRef}
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
      {...props}
    >
      <defs>
        <pattern
          id="grid"
          width={gridWidth}
          height={gridHeight}
          patternUnits="userSpaceOnUse"
          x={x}
          y={y}
        >
          <path
            d={`M.5 ${gridHeight}V.5H${gridWidth}`}
            fill="none"
            strokeDasharray={strokeDasharray}
            className="stroke-black/10 dark:stroke-white/10"
          />
        </pattern>
      </defs>

      <motion.rect
        width="100%"
        height="100%"
        fill="url(#grid)"
        style={{
          maskImage,
          opacity,
        }}
      />

      {squares.map(([column, row, i]) => (
        <motion.rect
          key={`${column}-${row}-${i}`}
          custom={i}
          initial={{ opacity: 0 }}
          animate={controls}
          x={column * gridWidth + 1}
          y={row * gridHeight + 1}
          width={gridWidth - 2}
          height={gridHeight - 2}
          className="fill-black/20 stroke-black/10 dark:fill-white/10 dark:stroke-white/10"
        />
      ))}
    </svg>
  );
}
