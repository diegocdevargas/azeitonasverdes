'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function CursorGlow() {
  const cursor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const xTo = gsap.quickTo(cursor.current, "x", {
      duration: 0.25,
      ease: "power3.out",
    });

    const yTo = gsap.quickTo(cursor.current, "y", {
      duration: 0.25,
      ease: "power3.out",
    });

    const move = (e: MouseEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);
    };

    window.addEventListener("mousemove", move);

    return () => {
      window.removeEventListener("mousemove", move);
    };
  }, []);

  return (
    <>
      {/* SVG Filter */}
      <svg
        width="0"
        height="0"
        style={{
          position: "absolute",
          overflow: "hidden",
        }}
      >
        <defs>
          <filter
            id="cursorGlow"
            x="-100%"
            y="-100%"
            width="300%"
            height="300%"
          >
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation="35"
              result="blur"
            />

            <feColorMatrix
              in="blur"
              type="matrix"
              values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 40 -18
              "
              result="goo"
            />

            <feMerge>
              <feMergeNode in="goo" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* Cursor */}
      <div
        ref={cursor}
        className="cursor-glow"
      />
    </>
  );
}