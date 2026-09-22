'use client';

import { useRef, useEffect } from 'react';
import gsap from 'gsap';

const AUDIO_SRC = '/assets/sounds/azeitonas_verdes_noite_sombria_original.mp3';
const AUDIO_GAIN = 6.85;
const BLUR_REST = 1.98;

const MATRIX_BASE = {
  rContrast: 1.92,
  gContrast: 10,
  bContrast: 1,
  alphaContrast: 2.1,
  alphaOffset: -0.9,
};

interface GooFiltersProps {
  isPlaying: boolean;
  onEnded: () => void;
  audioSrc?: string;
}

export default function GooFilters({ isPlaying, onEnded, audioSrc = AUDIO_SRC }: GooFiltersProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const dataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const rafRef = useRef<number | null>(null);
  const isReadyRef = useRef(false);
  const gainRef = useRef<GainNode | null>(null);

  const blurElRef = useRef<SVGFEGaussianBlurElement | null>(null);
  const matrixElRef = useRef<SVGFEColorMatrixElement | null>(null);
  const blurValueRef = useRef(BLUR_REST);

  const setBlur = (v: number) => {
    blurElRef.current?.setAttribute('stdDeviation', String(v));
    blurValueRef.current = v;
  };

  const setMatrix = (energy: number) => {
    if (!matrixElRef.current) return;

    const ac = MATRIX_BASE.alphaContrast + energy * 6;
    const ao = MATRIX_BASE.alphaOffset - energy * 2.5;
    const rc = MATRIX_BASE.rContrast + energy * 0.7;

    matrixElRef.current.setAttribute(
      'values',
      `${rc} 0 0 0 0  0 ${MATRIX_BASE.gContrast} 0 0 0  0 0 ${MATRIX_BASE.bContrast} 0 0  0 0 0 ${ac} ${ao}`,
    );
  };

  const setLogoEnergy = (energy: number) => {
    const root = document.documentElement;
    root.style.setProperty('--logo-glow', energy.toFixed(3));
    root.style.setProperty('--logo-pulse', (0.15 + energy * 0.8).toFixed(3));
  };

  const startAnalysis = () => {
    if (!analyserRef.current || !dataRef.current) return;

    const analyser = analyserRef.current;
    const data = dataRef.current;

    const tick = () => {
      rafRef.current = requestAnimationFrame(tick);
      analyser.getByteFrequencyData(data);

      const bass = Array.from(data.slice(10, 18));
      const avg = bass.reduce((a, b) => a + b, 0) / bass.length;
      const energy = Math.min(avg / 160, 1);
      const modBlur = 1.46 + energy * 2.96;

      setLogoEnergy(energy);
      setBlur(modBlur);
      setMatrix(energy);
    };

    tick();
  };

  const stopAnalysis = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const initAudio = () => {
    const audio = audioRef.current;
    if (!audio || (ctxRef.current && analyserRef.current)) return;

    const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) {
      console.warn('GooFilters: Web Audio API is not available in this browser.');
      return;
    }

    const ctx = new AudioContextCtor();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.75;

    const gain = ctx.createGain();
    gain.gain.value = AUDIO_GAIN;

    if (!sourceRef.current) {
      sourceRef.current = ctx.createMediaElementSource(audio);
      sourceRef.current.connect(gain);
      gain.connect(analyser);
      gain.connect(ctx.destination);
    }

    ctxRef.current = ctx;
    analyserRef.current = analyser;
    gainRef.current = gain;
    dataRef.current = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
  };

  const play = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!isReadyRef.current) {
      audio.addEventListener('canplaythrough', () => void play(), { once: true });
      return;
    }

    initAudio();

    const ctx = ctxRef.current;
    if (!ctx) return;

    try {
      if (ctx.state === 'suspended') await ctx.resume();
      await audio.play();
    } catch (err) {
      console.error('GooFilters: playback failed →', err);
      return;
    }

    startAnalysis();
  };

  const pause = () => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
    stopAnalysis();
    setLogoEnergy(0);

    const proxy = { blur: blurValueRef.current, energy: 1 };
    gsap.to(proxy, {
      blur: BLUR_REST,
      energy: 0,
      duration: 0.45,
      ease: 'power2.out',
      onUpdate() {
        setBlur(proxy.blur);
        setMatrix(proxy.energy);
      },
    });
  };

  useEffect(() => {
    if (isPlaying) {
      void play();
    } else {
      pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const nextSrc = new URL(audioSrc, window.location.href).toString();
    if (audio.src !== nextSrc) {
      audio.pause();
      audio.src = nextSrc;
      audio.load();
      isReadyRef.current = false;
    }

    if (isPlaying && audio.src === nextSrc) {
      void play();
    }
  }, [audioSrc, isPlaying]);

  useEffect(() => {
    const filter = document.getElementById('old-goo');
    blurElRef.current = (filter?.querySelector('feGaussianBlur') as SVGFEGaussianBlurElement) ?? null;
    matrixElRef.current = (filter?.querySelector('feColorMatrix') as SVGFEColorMatrixElement) ?? null;

    const logo = document.getElementById('logoAzeitonas');
    if (logo) {
      logo.style.filter = 'url(#old-goo)';
      logo.style.webkitFilter = 'url(#old-goo)';
    }

    const audio = audioRef.current;
    const onCanPlay = () => {
      isReadyRef.current = true;
    };

    const onError = () => {
      const reasons: Record<number, string> = {
        1: 'MEDIA_ERR_ABORTED',
        2: 'MEDIA_ERR_NETWORK',
        3: 'MEDIA_ERR_DECODE',
        4: 'MEDIA_ERR_SRC_NOT_FOUND',
      };
      const code = audio?.error?.code ?? 0;
      console.error('GooFilters media error:', reasons[code] ?? 'unknown');
    };

    const onEndedInternal = () => {
      stopAnalysis();
      setBlur(BLUR_REST);
      setMatrix(0);
      onEnded();
    };

    audio?.addEventListener('canplaythrough', onCanPlay);
    audio?.addEventListener('error', onError);
    audio?.addEventListener('ended', onEndedInternal);

    return () => {
      audio?.removeEventListener('canplaythrough', onCanPlay);
      audio?.removeEventListener('error', onError);
      audio?.removeEventListener('ended', onEndedInternal);

      stopAnalysis();
      gainRef.current?.disconnect();
      ctxRef.current?.close();
      sourceRef.current = null;
      gainRef.current = null;
      ctxRef.current = null;
      analyserRef.current = null;
    };
  }, []);

  return (
    <>
      <audio ref={audioRef} src={audioSrc} preload="auto" className="hidden" />

      <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
        <defs>
          <filter id="old-goo">
            <feGaussianBlur stdDeviation={BLUR_REST} />
            <feColorMatrix
              type="matrix"
              values={`
                ${MATRIX_BASE.rContrast} 0 0 0 0
                0 ${MATRIX_BASE.gContrast} 0 0 0
                0 0 ${MATRIX_BASE.bContrast} 0 0
                0 0 0 ${MATRIX_BASE.alphaContrast} ${MATRIX_BASE.alphaOffset}
              `}
            />
            <feBlend in="SourceGraphic" />
          </filter>
        </defs>
      </svg>
    </>
  );
}
