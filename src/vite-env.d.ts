
declare module "*.svg?react" {
  import { FC, SVGProps } from "react";

  const ReactComponent: FC<SVGProps<SVGSVGElement>>;

  export default ReactComponent;
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