'use client'

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import Logo from "../../assets/svg/main_two.svg?react";
import { Play, Pause } from "lucide-react";

import { gsap } from "gsap";
// import { DrawSVGPlugin }       from "gsap/DrawSVGPlugin";
// import { MotionPathPlugin }    from "gsap/MotionPathPlugin";
// import { CustomEase }          from "gsap/CustomEase";
// import { CustomBounce }        from "gsap/CustomBounce";
// import { CustomWiggle }        from "gsap/CustomWiggle";
// import { RoughEase, ExpoScaleEase, SlowMo } from "gsap/EasePack";
// import { GSDevTools }          from "gsap/GSDevTools";
// import { Physics2DPlugin }     from "gsap/Physics2DPlugin";
// import { PhysicsPropsPlugin }  from "gsap/PhysicsPropsPlugin";
// import { ScrollTrigger }       from "gsap/ScrollTrigger";
// import { ScrollSmoother }      from "gsap/ScrollSmoother";
// import { ScrollToPlugin }      from "gsap/ScrollToPlugin";
// import { SplitText }           from "gsap/SplitText";
// import { TextPlugin }          from "gsap/TextPlugin";

gsap.registerPlugin(
  // DrawSVGPlugin, MotionPathPlugin, GSDevTools,
  // Physics2DPlugin, PhysicsPropsPlugin,
  // ScrollTrigger, ScrollSmoother, ScrollToPlugin,
  // SplitText, TextPlugin,
  // RoughEase, ExpoScaleEase, SlowMo,
  // CustomEase, CustomBounce, CustomWiggle,
);

interface VectorLogoProps {
  className?: string;
  width?: string | number;
  // ── lifted from app.tsx ──────────────────────────────────────────────────
  isPlaying: boolean;
  onToggle: () => void;
}

export default function VectorLogo({
  className = "w-32 h-auto opacity-90 full h-full",
  width,
  isPlaying,
  onToggle,
}: VectorLogoProps) {

  const svgRef = useRef<SVGSVGElement>(null);

  // ─── Play/Pause — just bubbles up to parent ───────────────────────────────
  const handlePlayPause = (e: React.MouseEvent) => {
    e.preventDefault();
    onToggle();
  };

  const floatTweensRef = useRef<gsap.core.Tween[]>([]);
  const randomTweenRef = useRef<gsap.core.Tween | null>(null);
  const hasFlickeredRef = useRef(false); // ← persists across rerenders, never resets

  // ─── GSAP animations (unchanged) ─────────────────────────────────────────
  useGSAP(() => {
    // ── Kill previous runs first ─────────────────────────────────────────
    floatTweensRef.current.forEach(t => t.kill());
    floatTweensRef.current = [];
    randomTweenRef.current?.kill();
    randomTweenRef.current = null;

    if (!isPlaying) return; // ← nothing starts until play is pressed

    // ── Float animations (unchanged) ─────────────────────────────────────
    const floatTargets = [
      //{ selector: "#logoAzeitonas .azeitonas", dur: 3.2, amp: 200, delay: 0 },
      //{ selector: "#logoAzeitonas .verdes",    dur: 2.6, amp: 50,  delay: 0.55 },
      { selector: "#logoAzeitonas .slimer",    dur: 3.6, amp: 0.5,  delay: 0.33 },

      { selector: "#logoAzeitonas .left-olive",    dur: 3.6, amp: 70,  delay: 0.3 },
      { selector: "#logoAzeitonas .extra-olive",    dur: 4.6, amp: 150,  delay: 0.95 },
      { selector: "#logoAzeitonas .right-olive",    dur: 6.6, amp: -30,  delay: 0.75 },

      { selector: "#logoAzeitonas .lingua",    dur: 6.6, amp: -10,  delay: 0.75 },
      
    ];

    floatTargets.forEach(({ selector, dur, amp, delay }) => {
      floatTweensRef.current.push(
        gsap.to(selector, { y: amp,       duration: dur,        ease: "sine.inOut", yoyo: true, repeat: -1, delay,             stagger: 0.1  }),
        gsap.to(selector, { y: amp * 0.3, duration: dur * 1.4,  ease: "sine.inOut", yoyo: true, repeat: -1, delay: delay * 0.6, stagger: 0.08 }),
        gsap.to(selector, { scale: 1.03,  duration: dur * 0.85, ease: "sine.inOut", yoyo: true, repeat: -1, delay: delay * 0.4, stagger: 0.06 }),
      );
    });

    // tlDrip.to("#logoAzeitonas .verdes", { duration: 6, y: 60, stagger: 0.5, fill: "#75d21b"}, "<")
    // tlDrip.to("#logoAzeitonas .azeitonas", { duration: 6, y: 90, stagger: 0.5, fill: "#75d21b"}, ">")
    //tl.to("#logoAzeitonas circle", { duration: 15, x: 360, y: -100, yoyo: true, repeat: -1}, 1);
    // var tl = gsap.timeline({ stagger: 15, duration: 360 });
    //tl.fromTo("#logoAzeitonas path", { duration: 15, drawSVG: "0%" }, { duration: 3, drawSVG: "100%" }, ">")
    //tl.to("#logoAzeitonas circle", { duration: 15, x: 360, y: -100, yoyo: true, repeat: -1}, 1);
    // gsap.set(randomTweenRef, { 
    //   ease: "rough({strength: 3, points: 50, template: strong.inOut, taper: both, randomize: false})",
    //    duration: 1, opacity: 1, x: 0, y: 0 });

   // ── Flicker-on → then hand off to randomMove loop ────────────────────
// ── Random move loop ──────────────────────────────────────────────────
  function randomMove(target: gsap.TweenTarget) {
    randomTweenRef.current = gsap.to(target, {
      scaleY:          gsap.utils.random(3, 3.2),
      scaleX:          gsap.utils.random(3, 3.6),
      rotation:        gsap.utils.random(1, 3),
      transformOrigin: "50% 50%",
      duration:        gsap.utils.random(1, 3),
      x:               gsap.utils.random(15, 500),
      y:               gsap.utils.random(15, 40),
      skewY:           gsap.utils.random(-3, 3),
      skewX:           gsap.utils.random(-3, 3),
      filter: () => {
        const shadowBlur = gsap.utils.random(3, 9);
        const invert     = gsap.utils.random(60, 300);
        const r = gsap.utils.random(0, 256);
        const g = gsap.utils.random(0, 256);
        const b = gsap.utils.random(0, 256);
        return `drop-shadow(0px 0px ${shadowBlur}px rgba(${r},${g},${b},0.5)) invert(${invert}%)`;
      },
      ease: "sine.inOut",
      onComplete() { randomMove(target); },
    });
  }

  // // ── Flicker intro (first click only) ─────────────────────────────────
  // function flickerOn(target: gsap.TweenTarget) {
  //   const tl = gsap.timeline({
  //     onComplete: () => randomMove(target),
  //   });

  //   tl.set(target, { opacity: 0, filter: "brightness(1)" });
  //   tl.to(target, { opacity: 1,  duration: 0.08, ease: "none" })
  //   tl.to(target, { opacity: 0,  duration: 0.05, ease: "none" })
  //   tl.to(target, { opacity: 1,  duration: 0.12, ease: "none" })
  //   tl.to(target, { opacity: 0,  duration: 0.08, ease: "none" })
  //   tl.to(target, { opacity: 1,  duration: 0.04, ease: "none" })
  //   tl.to(target, { opacity: 0,  duration: 0.10, ease: "none" })
  //   tl.to(target, { opacity: 0,  duration: 0.30, ease: "none" })
  //   tl.to(target, { opacity: 1,  duration: 0.06, ease: "none" })
  //   tl.to(target, { opacity: 0,  duration: 0.04, ease: "none" })
  //   tl.to(target, { opacity: 1,  duration: 0.08, ease: "none" })
  //   tl.to(target, { filter: "brightness(1) saturate(1)", scale: 1.02, duration: 0.25, ease: "power2.out" });
  //   tl.to(target, { filter: "brightness(1)",                 scale: 1,    duration: 0.40, ease: "power2.inOut" });
  // }

  // // ── Decision: flicker once, randomMove on every resume ───────────────
  // if (!hasFlickeredRef.current) {
  //   hasFlickeredRef.current = true; // ← lock it, never flickers again
  //   flickerOn("#logoAzeitonas circle");
  // } else {
  //   randomMove("#logoAzeitonas circle"); // ← all subsequent plays skip straight here
  // }

}, { dependencies: [isPlaying] }); // ← reruns on every toggle
  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={className} style={width ? { width } : undefined}>
      <div className="wrapper flex flex-col items-center justify-center gap-4 full h-full">
        <div className="logo-stage">
          <Logo width={500} />
        </div>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={handlePlayPause}
            className="play-btn font-['Anton'] text-sm tracking-widest uppercase px-8 py-3 inline-flex items-center gap-2 transition-colors"
          >
            {isPlaying ? <Pause size={36} /> : <Play size={36} />}
          </button>
        </div>
      </div>
    </div>
  );
}

gsap.to(".class", { duration: 0, x: 100, y: 50, opacity: 0 });

// ─── Helper: split multi-segment paths ───────────────────────────────────────
function splitPaths(paths: NodeListOf<Element>): (SVGPathElement | Element)[] {
  const toSplit = Array.from(paths);
  const newPaths: (SVGPathElement | Element)[] = [];

  if (toSplit.length > 1) {
    toSplit.forEach((path) => {
      newPaths.push(...splitPaths((path as SVGPathElement).querySelectorAll("path")));
    });
  } else if (toSplit.length === 1) {
    const path   = toSplit[0] as SVGPathElement;
    const rawPath = MotionPathPlugin.getRawPath(path);
    const parent  = path.parentNode as SVGElement;
    const attributes = Array.from(path.attributes);

    const splitResult = (rawPath as any[]).map((segment) => {
      const newPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
      attributes.forEach((attr) => {
        if (attr.nodeValue !== null) {
          newPath.setAttributeNS(null, attr.nodeName, attr.nodeValue);
        }
      });
      const pathData = `M${segment[0]},${segment[1]}C${segment.slice(2).join(",")}${(segment as any).closed ? "z" : ""}`;
      newPath.setAttributeNS(null, "d", pathData);
      parent.insertBefore(newPath, path);
      return newPath;
    });

    parent.removeChild(path);
    newPaths.push(...splitResult);
  }

  return newPaths;
}