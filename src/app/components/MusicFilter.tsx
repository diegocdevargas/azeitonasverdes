'use client';

import { useEffect, useRef } from 'react';

const GRID_W = 40;
const GRID_H = 25;

export default function AudioMatrixFromFile() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const rafRef = useRef<number | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const width = 800;
    const height = 500;

    const cellW = width / GRID_W;
    const cellH = height / GRID_H;

    const cells: SVGRectElement[] = [];

    // build grid once
    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        const rect = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'rect'
        );

        rect.setAttribute('x', String(x * cellW));
        rect.setAttribute('y', String(y * cellH));
        rect.setAttribute('width', String(cellW - 1));
        rect.setAttribute('height', String(cellH - 1));
        rect.setAttribute('fill', '#00ff00');
        rect.setAttribute('opacity', '0.05');

        svg.appendChild(rect);
        cells.push(rect);
      }
    }

    function start() {
      if (startedRef.current) return;
      startedRef.current = true;

      const audio = audioRef.current;
      if (!audio) return;

      const AudioCtx =
        window.AudioContext || (window as any).webkitAudioContext;

      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;

      const bufferLength = analyser.frequencyBinCount;
      const data = new Uint8Array(bufferLength);

      const source = ctx.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      audio.play();

      const animate = () => {
        analyser.getByteFrequencyData(data);

        for (let i = 0; i < cells.length; i++) {
          const value = data[i % data.length];
          const intensity = value / 255;

          const cell = cells[i];

          cell.setAttribute('opacity', String(0.05 + intensity));
          cell.setAttribute(
            'fill',
            `rgb(0, ${80 + intensity * 175}, 0)`
          );
          cell.setAttribute(
            'transform',
            `scale(${0.8 + intensity * 0.6})`
          );
        }

        rafRef.current = requestAnimationFrame(animate);
      };

      animate();
    }

    // ATTACH TO EXISTING ELEMENT (ID OR CLASS)
    const trigger = document.querySelector('#start-btn');
    // const trigger = document.querySelector('.start-animation');

    if (trigger) {
      trigger.addEventListener('click', start);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (trigger) trigger.removeEventListener('click', start);
    };
  }, []);

  return (
    <div style={{ background: 'black', padding: 20 }}>
      {/* <audio ref={audioRef} src="/web/assets/sounds/azeitonas_verdes_noite_sombria_original.mp3" controls />

      <svg
        ref={svgRef}
        width={800}
        height={500}
        style={{ display: 'block' }}
      /> */}
    </div>
  );
}