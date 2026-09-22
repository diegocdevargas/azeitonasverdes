import { useEffect, useRef } from "react";
import { gsap } from "gsap";

// ─── config ────────────────────────────────────────────────────────────────
const ELEMENTS = [
  { id: "el1", width: 90,  height: 90,  bg: "#B5D4F4", border: "#85B7EB", borderRadius: "50%",  label: "orb"  },
  { id: "el2", width: 60,  height: 60,  bg: "#9FE1CB", border: "#5DCAA5", borderRadius: "12px", label: "cube" },
  { id: "el3", width: 50,  height: 50,  bg: "#FACEA0", border: "#EF9F27", borderRadius: "50%",  label: "✦"   },
  { id: "el4", width: 100, height: 100, bg: "#EEEDFE", border: "#AFA9EC", borderRadius: "8px",  label: "card" },
  { id: "el5", width: 40,  height: 40,  bg: "#F5C4B3", border: "#F0997B", borderRadius: "50%",  label: "✦"   },
  { id: "el6", width: 70,  height: 70,  bg: "#C0DD97", border: "#97C459", borderRadius: "6px",  label: "gem"  },
];

const POSITIONS = [
  { x: -200, y: -60  },
  { x:  80,  y: -110 },
  { x: -100, y:  90  },
  { x:  160, y:  60  },
  { x:  -20, y: -130 },
  { x: -260, y:  70  },
];

// Phase offsets — prevents elements from floating in sync
const OFFSETS = [0, 0.6, 1.2, 1.8, 0.9, 1.5];

// ─── component ─────────────────────────────────────────────────────────────
export default function FloatAnimation({
  speed      = 1,    // tween speed multiplier
  amplitude  = 30,   // vertical travel in px
  rotation   = 15,   // max tilt in degrees
  scalePulse = true, // subtle breathe effect
}) {
  const refs = useRef([]);
  const tweens = useRef([]);

  // Set initial positions once on mount
  useEffect(() => {
    refs.current.forEach((el, i) => {
      if (!el) return;
      gsap.set(el, { x: POSITIONS[i].x, y: POSITIONS[i].y });
    });
  }, []);

  // Rebuild tweens whenever props change
  useEffect(() => {
    tweens.current.forEach((t) => t.kill());
    tweens.current = [];

    refs.current.forEach((el, i) => {
      if (!el) return;

      // Slightly different duration per element = organic, never-synced motion
      const dur   = (2.4 + i * 0.35) / speed;
      const delay = OFFSETS[i] / speed;

      tweens.current.push(
        // Vertical float
        gsap.to(el, {
          y: `+=${amplitude}`,
          duration: dur,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay,
        }),

        // Subtle horizontal drift (~40% of vertical)
        gsap.to(el, {
          x: `+=${amplitude * 0.4}`,
          duration: dur * 1.3,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: delay * 0.5,
        }),

        // Rotation tilt — alternating direction per element
        gsap.to(el, {
          rotation: rotation === 0 ? 0 : i % 2 === 0 ? rotation : -rotation,
          duration: dur * 1.6,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: delay * 0.7,
        }),

        // Optional scale breathe
        ...(scalePulse
          ? [
              gsap.to(el, {
                scale: 1.08,
                duration: dur * 0.9,
                ease: "sine.inOut",
                yoyo: true,
                repeat: -1,
                delay: delay * 0.3,
              }),
            ]
          : [])
      );
    });

    return () => tweens.current.forEach((t) => t.kill());
  }, [speed, amplitude, rotation, scalePulse]);

  return (
    <div style={styles.scene}>
      {ELEMENTS.map((el, i) => (
        <div
          key={el.id}
          ref={(node) => (refs.current[i] = node)}
          style={{
            ...styles.floatEl,
            width:        el.width,
            height:       el.height,
            background:   el.bg,
            border:       `0.5px solid ${el.border}`,
            borderRadius: el.borderRadius,
          }}
        >
          {el.label}
        </div>
      ))}
    </div>
  );
}

// ─── styles ────────────────────────────────────────────────────────────────
const styles = {
  scene: {
    position:       "relative",
    width:          "100%",
    height:         420,
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    overflow:       "hidden",
    borderRadius:   12,
    border:         "0.5px solid #d3d1c7",
    background:     "#f1efe8",
  },
  floatEl: {
    position:       "absolute",
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    fontWeight:     500,
    fontSize:       13,
    color:          "#1a1a1a",
    userSelect:     "none",
    cursor:         "default",
  },
};
