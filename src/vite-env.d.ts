
declare module "*.svg?react" {
  import { FC, SVGProps } from "react";

  const ReactComponent: FC<SVGProps<SVGSVGElement>>;

  export default ReactComponent;
}

// Build-time responsive WebP variants (plugins/vite-plugin-responsive.ts)
declare module '*?responsive' {
  const img: { src: string; srcset: string; width: number; height: number };
  export default img;
}

declare module '*?responsive&w=64;128' {
  const img: { src: string; srcset: string; width: number; height: number };
  export default img;
}

declare module '*.mp3' {
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.webp' {
  const src: string;
  export default src;
}

declare module '*.gif' {
  const src: string;
  export default src;
}