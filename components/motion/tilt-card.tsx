"use client";

import React, { useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

/**
 * Vendored from transitions.dev — "P19: Tilt card (hover 3D tilt + cursor-tracked glare)"
 * Follows the cursor with 3D perspective smoothing, dynamic glare highlight,
 * and eases back to resting flat state via spring easing on mouse leave.
 */

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  maxTilt?: number; // Maximum rotation in degrees (default: 8)
  perspective?: number; // Perspective distance in px (default: 1000)
  glareOpacity?: number; // Max glare opacity (default: 0.18)
  className?: string;
  enableGlare?: boolean;
}

export function TiltCard({
  children,
  maxTilt = 8,
  perspective = 1000,
  glareOpacity = 0.18,
  enableGlare = true,
  className,
  ...props
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Calculate tilt angles inversely
      const rY = ((x - centerX) / centerX) * maxTilt;
      const rX = -((y - centerY) / centerY) * maxTilt;

      // Calculate glare percentage
      const gX = (x / rect.width) * 100;
      const gY = (y / rect.height) * 100;

      setRotateX(rX);
      setRotateY(rY);
      setGlarePos({ x: gX, y: gY });
    },
    [maxTilt]
  );

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: `${perspective}px`,
      }}
      className={cn("relative group select-none", className)}
      {...props}
    >
      <div
        style={{
          transform: isHovered
            ? `rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(4px)`
            : "rotateX(0deg) rotateY(0deg) translateZ(0px)",
          transition: isHovered
            ? "transform 120ms cubic-bezier(0.22, 1, 0.36, 1)"
            : "transform 700ms cubic-bezier(0.22, 1, 0.36, 1)",
          transformStyle: "preserve-3d",
        }}
        className="relative w-full h-full will-change-transform"
      >
        {children}

        {/* Dynamic Specular Glare Overlay from transitions.dev */}
        {enableGlare && (
          <div
            aria-hidden="true"
            style={{
              background: `radial-gradient(circle 240px at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, ${
                isHovered ? glareOpacity : 0
              }), transparent 80%)`,
              transition: isHovered
                ? "opacity 200ms ease"
                : "opacity 600ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
            className="pointer-events-none absolute inset-0 rounded-[inherit] z-20 mix-blend-overlay"
          />
        )}
      </div>
    </div>
  );
}
