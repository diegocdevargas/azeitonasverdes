
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";

  let mounted = false;
  const mount = () => {
    if (mounted) return;
    mounted = true;
    createRoot(document.getElementById("root")!).render(<App />);
  };

  // Let the static hero in index.html paint first, then hand over to React on the
  // next frame (capped so a slow image never holds the app back).
  const afterPaint = () => requestAnimationFrame(() => setTimeout(mount));
  const hero = document.querySelector<HTMLImageElement>("#root img");
  if (hero && !hero.complete) {
    hero.addEventListener("load", afterPaint, { once: true });
    hero.addEventListener("error", afterPaint, { once: true });
    setTimeout(afterPaint, 1500);
  } else {
    afterPaint();
  }

