import { useState, useEffect, useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { Menu, X, Instagram, Youtube, Music2, Mail, MapPin, Calendar, Play, Pause, ChevronDown } from "lucide-react";
import GooFilters from "./components/GooFilters";
import VectorLogo from "./components/VectorLogo";
import logoUrl from "../assets/imgs/azeitona.png";
import WbzCopyright from "../assets/svg/wbz_copyright.svg?react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./components/ui/carousel";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./components/ui/dialog";
import siteData from "./data/site.json";
// import AudioMatrixFromFile from "./components/MusicFilter";

const navLinks = ["Sobre", "Música", "Vídeos", "Onde", "Galeria", "Banda", "Contato"];

type Album = {
  title: string;
  year: string;
  tracks: number;
  label: string;
  cover: string;
  type: string;
  audioSrc: string;
  videoSrc?: string;
  hasVideo?: boolean;
};

const musicAlbums = siteData.albums.filter((album: any) => !album.hasVideo);
const videoAlbums = siteData.albums.filter((album: any) => album.hasVideo && album.videoSrc);

const { tours, gallery, aboutSlides, bandMembers, albums } = siteData;

const members = bandMembers;

type RevealVariant = "fadeUp" | "fadeLeft" | "fadeRight" | "scaleIn";

type RevealProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: RevealVariant;
  delay?: number;
  amount?: number;
};

const revealVariants: Record<RevealVariant, { from: Record<string, number | string>; to: Record<string, number | string> }> = {
  fadeUp: {
    from: { opacity: 0, y: 26, filter: "blur(8px)" },
    to: { opacity: 1, y: 0, filter: "blur(0px)" },
  },
  fadeLeft: {
    from: { opacity: 0, x: -24, filter: "blur(8px)" },
    to: { opacity: 1, x: 0, filter: "blur(0px)" },
  },
  fadeRight: {
    from: { opacity: 0, x: 24, filter: "blur(8px)" },
    to: { opacity: 1, x: 0, filter: "blur(0px)" },
  },
  scaleIn: {
    from: { opacity: 0, scale: 0.96, filter: "blur(8px)" },
    to: { opacity: 1, scale: 1, filter: "blur(0px)" },
  },
};

function Reveal({ children, variant = "fadeUp", delay = 0, amount = 0.2, ...props }: RevealProps) {
  const selectedVariant = revealVariants[variant];

  return (
    <div
      data-reveal={variant}
      data-delay={delay}
      data-amount={amount}
      style={{ willChange: "transform, opacity, filter" }}
      {...props}
    >
      {children}
    </div>
  );
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const heroVideoRef = useRef<HTMLVideoElement | null>(null);
  const aboutImageRef = useRef<HTMLDivElement | null>(null);
  const aboutLineRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [activeAlbum, setActiveAlbum] = useState<Album | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Album | null>(null);
  const [aboutIndex, setAboutIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const scrollContentRef = useRef<HTMLDivElement | null>(null);
  const smootherRef = useRef<ScrollSmoother | null>(null);

  const handleToggle = () => {
    setSelectedVideo(null);
    setIsPlaying((prev) => !prev);
  };
  const handleEnded = () => {
    setIsPlaying(false);
    setActiveAlbum(null);
  };

  const handlePlayAlbum = (album: Album) => {
    setSelectedVideo(null);

    if (activeAlbum?.title === album.title) {
      setIsPlaying((prev) => !prev);
      return;
    }

    setActiveAlbum(album);
    setIsPlaying(true);
  };

  const openVideoModal = (album: Album) => {
    setIsPlaying(false);
    setSelectedVideo(album);
  };

  const handleSectionNavigation = (event: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    event.preventDefault();
    setMenuOpen(false);

    const target = document.getElementById(targetId);
    if (!target) return;

    if (smootherRef.current) {
      smootherRef.current.scrollTo(target, true, "top top");
      window.history.replaceState(null, "", `#${targetId}`);
      return;
    }

    const top = target.getBoundingClientRect().top + window.scrollY;
    gsap.to(window, {
      duration: 1.1,
      ease: "power3.out",
      scrollTo: { y: top, autoKill: false },
    });
    window.history.replaceState(null, "", `#${targetId}`);
  };

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger, ScrollSmoother, ScrollToPlugin);

    if (!scrollContainerRef.current || !scrollContentRef.current) return;

    smootherRef.current = ScrollSmoother.create({
      wrapper: scrollContainerRef.current,
      content: scrollContentRef.current,
      smooth: 1.2,
      effects: true,
      normalizeScroll: true,
      ignoreMobileResize: true,
    });

    const navScrollTrigger = ScrollTrigger.create({
      trigger: heroRef.current,
      start: "top top",
      end: "bottom top",
      onUpdate: (self) => {
        setScrolled(self.scroll() > 24);
      },
    });

    return () => {
      navScrollTrigger.kill();
      smootherRef.current?.kill();
      smootherRef.current = null;
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const revealNodes = gsap.utils.toArray<HTMLElement>("[data-reveal]");

    revealNodes.forEach((el) => {
      const variant = (el.dataset.reveal as RevealVariant) || "fadeUp";
      const config = revealVariants[variant];
      const delay = Number(el.dataset.delay ?? 0);

      gsap.fromTo(
        el,
        config.from,
        {
          ...config.to,
          duration: 0.8,
          ease: "power3.out",
          delay,
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            end: "bottom 20%",
            toggleActions: "play none none reverse",
            once: false,
          },
        }
      );
    });

    if (!aboutImageRef.current || !aboutLineRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        aboutImageRef.current,
        { scale: 1, y: 0 },
        {
          scale: 0.9,
          y: 18,
          ease: "none",
          scrollTrigger: {
            trigger: aboutImageRef.current,
            start: "top 78%",
            end: "bottom 22%",
            scrub: 1.2,
            toggleActions: "play none none reverse",
          },
        }
      );

      gsap.fromTo(
        aboutLineRef.current,
        { opacity: 0.5, scale: 0.9, y: 0 },
        {
          opacity: 1,
          scale: 0.85,
          y: 10,
          ease: "none",
          scrollTrigger: {
            trigger: aboutLineRef.current,
            start: "top 78%",
            end: "bottom 22%",
            scrub: 1.2,
            toggleActions: "play none none reverse",
          },
        }
      );
    }, aboutImageRef);

    return () => {
      ctx.revert();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setAboutIndex((current) => (current + 1) % aboutSlides.length);
    }, 2600);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const video = heroVideoRef.current;
    if (!video) return;

    if (isPlaying) {
      void video.play();
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [isPlaying]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) { setSubmitted(true); setEmail(""); }
  };

  return (
    <>
      {/* ── NAV ── */}
      <nav
        className={`fixed top-0 z-50 w-full border-b border-transparent transition-all duration-800 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          scrolled
            ? "bg-background/80 border-border backdrop-blur-md shadow-[0_8px_25px_rgba(0,0,0,0.12)] h-14"
            : "bg-transparent backdrop-blur-none shadow-none h-16"
        }`}
      >
        <div className={`max-w-7xl mx-auto px-6 flex items-center justify-between transition-all duration-800 ease-[cubic-bezier(0.22,1,0.36,1)] ${scrolled ? "h-14" : "h-16"}`}>
          <Reveal variant="fadeUp" delay={0.05} className="inline-block transition-all duration-800 ease-[cubic-bezier(0.22,1,0.36,1)]">
            <a
              href="/"
              onClick={(event) => {
                event.preventDefault();
                window.location.href = "/";
              }}
              className="font-['Anton'] text-primary tracking-widest uppercase"
            >
              <img
                width={60}
                height={60}
                src={logoUrl}
                alt="Azeitona"
                className={`transition-all duration-800 ease-[cubic-bezier(0.22,1,0.36,1)] ${scrolled ? "h-8 w-8 md:h-9 md:w-9" : "h-11 w-11 md:h-10 md:w-10"}`}
              />
            </a>
          </Reveal>
          <div className="hidden md:flex gap-8">
            {navLinks.map((l, index) => {
              const targetId = l.toLowerCase();

              return (
                <Reveal key={l} variant="fadeUp" delay={0.08 + index * 0.04} className="inline-block transition-all duration-500 ease-out">
                  <a
                    href={`#${targetId}`}
                    onClick={(event) => handleSectionNavigation(event, targetId)}
                    className={`font-['Pathway_Gothic_One'] uppercase text-foreground/60 hover:text-primary transition-all duration-800 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      scrolled ? "text-[1rem] tracking-[0.14em]" : "text-[1.1rem] tracking-[0.12em]"
                    }`}
                  >
                    {l}
                  </a>
                </Reveal>
              );
            })}
          </div>
          <button onClick={() => setMenuOpen(o => !o)} className="md:hidden text-primary">
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden bg-background border-t border-border px-6 py-6 flex flex-col gap-5">
            {navLinks.map((l, index) => {
              const targetId = l.toLowerCase();

              return (
                <Reveal key={l} variant="fadeUp" delay={0.05 + index * 0.05}>
                  <a
                    href={`#${targetId}`}
                    onClick={(event) => handleSectionNavigation(event, targetId)}
                    className="font-['Pathway_Gothic_One'] text-[1.1rem] tracking-[0.18em] uppercase text-foreground hover:text-primary transition-colors"
                  >
                    {l}
                  </a>
                </Reveal>
              );
            })}
          </div>
        )}
      </nav>

      <div ref={scrollContainerRef} className="smooth-scroll-wrapper">
        <div ref={scrollContentRef} className="smooth-scroll-content">

          {/* ── HERO ── */}
        <section id="hero" ref={heroRef} className="relative min-h-screen flex flex-col justify-end overflow-hidden bg-background">
          <img
            src="/assets/imgs/original_first_frame.webp"
            alt="Azeitonas Verdes performing on MotoClube"
            className={`bg-hero absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-500 ${isPlaying ? "opacity-0" : "opacity-40"}`}
          />
          <video
            ref={heroVideoRef}
            className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-500 ${isPlaying ? "opacity-30" : "opacity-0"}`}
            loop
            muted
            playsInline
            preload="metadata"
            poster="/assets/imgs/first_frame.webp"
          >
            <source src="/assets/videos/hero_11s_loop.mp4" type="video/mp4" />
          </video>
          {/* psychedelic color overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#FF2D5520] via-transparent to-background pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-tr from-background via-transparent to-[#75d21b15] pointer-events-none" />

          <div className="relative z-10 max-w-7xl mx-auto px-6 pb-20 pt-0 flex flex-col h-screen w-screen flex items-center justify-center">
            <div className="mb-4">
            </div>
            <Reveal variant="scaleIn" delay={0.08}>
              <GooFilters
                isPlaying={isPlaying}
                onEnded={handleEnded}
                audioSrc={activeAlbum?.audioSrc ?? "/assets/sounds/azeitonas_verdes_noite_sombria_original.mp3"}
              />
            </Reveal>
            <Reveal variant="fadeUp" delay={0.14}>
              <VectorLogo isPlaying={isPlaying} onToggle={handleToggle} />
            </Reveal>
          </div>
        </section>

        {/* ── SOBRE ── */}
        <section id="sobre" className="py-32 bg-background overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
            <Reveal variant="scaleIn" className="relative" delay={0.08} amount={0.25}>
              <div
                ref={aboutLineRef}
                className="w-full h-full absolute -top-3 -left-2 origin-left bg-gradient-to-r from-primary/90 via-secondary to-transparent"
              />
              <div
                ref={aboutImageRef}
                className="relative overflow-hidden rounded-none aspect-[2/3] border border-secondary/30 bg-muted will-change-transform shadow-[0_0_0_rgba(0,0,0,0)] transition-[transform,box-shadow,border-color] duration-700 ease-out"
                style={{ transformOrigin: "center center" }}
              >
                {aboutSlides.map((image, index) => (
                  <img
                    key={`${image.src}-${index}`}
                    src={image.src}
                    alt={image.alt}
                    className={`absolute inset-0 h-full w-full object-cover grayscale contrast-125 transition-opacity duration-700 ease-out ${
                      index === aboutIndex ? "opacity-100" : "opacity-0"
                    }`}
                  />
                ))}
              </div>
              <div className="absolute inset-0 bg-transparent from-secondary/20 to-primary/10 mix-blend-multiply" />
              <div className="absolute bottom-0 left-0 bg-secondary px-4 py-2">
                <span className="font-['Share_Tech_Mono'] text-xs text-foreground tracking-widest">DESDE 2023</span>
              </div>
            </Reveal>

            <Reveal variant="fadeLeft" delay={0.12} className="w-full">
              <span className="font-['Share_Tech_Mono'] text-xs text-primary tracking-[0.4em] uppercase mb-4 block">// una palavrita</span>
              <h2 className="font-['Anton'] text-[clamp(3rem,7vw,5rem)] leading-none uppercase text-foreground mb-8">
                Sobre<br /><span className="text-primary">Nós</span>
              </h2>
              <div className="space-y-5 font-['Pathway_Gothic_One'] text-3xl text-foreground/75 leading-tight">
                <p>
                  Nascemos de forma aleatória, iniciando com algumas composições próprias.
                </p>
                <p>
                  Aos poucos as músicas e o som foram tomando forma, dando o início a formação como power trio hoje.
                </p>
                <p>
                  Nosso som é simples e objetivo, de forma crua e natural.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── MÚSICA── */}
        <section id="música" className="py-32 bg-card border-t border-border">
          <div className="max-w-7xl mx-auto px-6">
            <Reveal variant="fadeUp" delay={0.06} className="mb-16">
              <div className="flex items-end justify-between flex-wrap gap-4">
                <div>
                  <span className="font-['Share_Tech_Mono'] text-xs text-primary tracking-[0.4em] uppercase mb-4 block">// discografia</span>
                  <h2 className="font-['Anton'] text-[clamp(3rem,7vw,5rem)] leading-none uppercase text-foreground">
                    Nossas<br /><span className="text-primary">Músicas</span>
                  </h2>
                </div>
              </div>
            </Reveal>
            <div className="grid md:grid-cols-3 gap-8">
              {musicAlbums.map((a, i) => {
                const isCurrentPlaying = activeAlbum?.title === a.title && isPlaying;

                return (
                  <Reveal key={a.id} variant="fadeUp" delay={0.08 + i * 0.08}>
                    <div className="group relative border border-border hover:border-primary transition-colors duration-300 h-full">
                      <div className="relative overflow-hidden aspect-[4/3] bg-muted">
                        <img
                          src={`https://images.unsplash.com/${a.cover}`}
                          alt={`${a.title} album cover`}
                          className="w-full h-full object-cover object-top grayscale group-hover:grayscale-0 transition-all duration-500 scale-105 group-hover:scale-100"
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                        {/* <div className="absolute top-4 right-4 bg-primary text-primary-foreground font-['Anton'] text-xs px-2 py-1 tracking-widest">
                          {i === 0 ? a.type : a.year}
                        </div> */}
                        <span className="absolute top-3 right-3 z-10 bg-primary/90 text-primary-foreground font-['Share_Tech_Mono'] text-[10px] tracking-[0.25em] uppercase px-2 py-1">
                          {a.type}
                        </span>
                        <button
                          type="button"
                          onClick={() => handlePlayAlbum(a)}
                          className="absolute inset-0 flex items-center justify-center md:opacity-0 opacity-100 group-hover:opacity-100 transition-opacity"
                        >
                          <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/30">
                            {isCurrentPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                          </div>
                        </button>
                      </div>
                      <div className="p-5">
                        <div className="font-['Share_Tech_Mono'] text-xs text-muted-foreground tracking-widest mb-1">{a.label} · {a.year}</div>
                        <h3 className="font-['Anton'] text-2xl text-foreground uppercase tracking-wide mb-1">{a.title}</h3>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── VÍDEOS ── */}
      <section id="vídeos" className="py-32 bg-background border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal variant="fadeUp" delay={0.06} className="mb-16">
            <div className="flex items-end justify-between flex-wrap gap-4">
              <div>
                <span className="font-['Share_Tech_Mono'] text-xs text-primary tracking-[0.4em] uppercase mb-4 block">// clipes + vídeos</span>
                <h2 className="font-['Anton'] text-[clamp(3rem,7vw,5rem)] leading-none uppercase text-foreground">
                  Vídeos
                </h2>
              </div>
            </div>
          </Reveal>

          <div className="relative">
            <Carousel
              opts={{ loop: true, align: "start", containScroll: "trimSnaps" }}
              className="relative"
            >
              <CarouselContent className="-ml-4">
                {videoAlbums.map((a, i) => (
                  <CarouselItem key={a.id} className="pl-4 basis-full md:basis-1/3">
                    <Reveal variant="fadeUp" delay={0.08 + i * 0.08} className="h-full">
                      <div className="group relative border border-border hover:border-primary transition-colors duration-300 h-full">
                        <div className="relative overflow-hidden aspect-[4/3] bg-muted">
                          <img
                            src={`${a.cover}`}
                            alt={`${a.title} video cover`}
                            className="w-full h-full object-cover object-top grayscale group-hover:grayscale-0 transition-all duration-500 scale-105 group-hover:scale-100"
                          />

                          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                          <span className="absolute top-3 right-3 z-10 bg-primary/90 text-primary-foreground font-['Share_Tech_Mono'] text-[10px] tracking-[0.25em] uppercase px-2 py-1">
                            {a.type}
                          </span>

                          <button
                            type="button"
                            onClick={() => openVideoModal(a)}
                            className="absolute inset-0 flex items-center justify-center md:opacity-0 opacity-100 group-hover:opacity-100 transition-opacity"
                          >
                            <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/30">
                              <Play size={24} fill="currentColor" />
                            </div>
                          </button>

                          {/* <button
                            type="button"
                            onClick={() => openVideoModal(a)}
                            className="absolute bottom-3 left-3 z-10 border border-border bg-background/80 backdrop-blur-sm px-3 py-1.5 font-['Share_Tech_Mono'] text-[10px] tracking-[0.2em] uppercase text-foreground hover:border-primary hover:text-primary transition-colors"
                          >
                            Abrir
                          </button> */}
                        </div>

                        <div className="p-5">
                          <div className="font-['Share_Tech_Mono'] text-xs text-muted-foreground tracking-widest mb-1">{a.label} · {a.year}</div>
                          <h3 className="font-['Anton'] text-2xl text-foreground uppercase tracking-wide mb-1">{a.title}</h3>
                        </div>
                      </div>
                    </Reveal>
                  </CarouselItem>
                ))}
              </CarouselContent>

              <CarouselPrevious className="left-0 top-1/2 -translate-y-1/2 border border-border bg-background/80 text-foreground hover:bg-primary hover:text-primary-foreground md:-left-12" />
              <CarouselNext className="right-0 top-1/2 -translate-y-1/2 border border-border bg-background/80 text-foreground hover:bg-primary hover:text-primary-foreground md:-right-12" />
            </Carousel>
          </div>
        </div>
      </section>

      <Dialog open={!!selectedVideo} onOpenChange={(open) => !open && setSelectedVideo(null)}>
        <DialogContent className="max-w-[100%] xl:max-w-[45%] px- border-border bg-background p-0 overflow-hidden gap-0">
          {selectedVideo && (
            <>
              <DialogHeader className="dialog-header border-b border-border px-5 py-4 bg-transparent">
                <DialogTitle className="font-['Anton'] text-2xl uppercase tracking-wide text-foreground gap-0">{selectedVideo.title}</DialogTitle>
                <DialogDescription className="font-['Share_Tech_Mono'] text-[10px] tracking-[0.18em] uppercase text-muted-foreground">
                  Ao vivo · {selectedVideo.year}
                </DialogDescription>
              </DialogHeader>

              <div className="bg-black dialog-video">
                <video
                  key={selectedVideo.title}
                  src={selectedVideo.videoSrc}
                  controls
                  autoPlay
                  playsInline
                  
                  className="w-full h-auto max-h-[75vh] object-contain"
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── ONDE ── */}
      <section id="onde" className="py-32 bg-background border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal variant="fadeUp" delay={0.06} className="mb-16">
            <span className="font-['Share_Tech_Mono'] text-xs text-primary tracking-[0.4em] uppercase mb-4 block">// datas ao vivo</span>
            <h2 className="font-['Anton'] text-[clamp(3rem,7vw,5rem)] leading-none uppercase text-foreground">
              Eventos<br /><span className="text-primary">2026</span>
            </h2>
          </Reveal>
          <div className="space-y-0">
            {tours.map((t, i) => (
              <Reveal key={i} variant="fadeUp" delay={0.06 + i * 0.06}>
                <div
                  className="group grid grid-cols-[auto_1fr_auto] md:grid-cols-[160px_1fr_200px_auto] items-center gap-4 md:gap-8 py-6 border-b border-border hover:bg-card transition-colors px-4 -mx-4"
                >
                  <div className="font-['Share_Tech_Mono'] text-sm text-primary whitespace-nowrap">{t.date}</div>
                  <div>
                    <div className="font-['Anton'] text-xl md:text-2xl uppercase text-foreground">{t.city}</div>
                    <div className="font-['Pathway_Gothic_One'] text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin size={12} /> {t.venue}
                    </div>
                  </div>
                  <div className="hidden md:block">
                    {t.status === "soldout" ? (
                      <span className="font-['Share_Tech_Mono'] text-xs tracking-widest uppercase text-secondary border border-secondary/50 px-3 py-1">À DEFINIR</span>
                    ) : t.status === "finalizado" ? (
                      <span className="font-['Share_Tech_Mono'] text-xs tracking-widest uppercase text-muted-foreground border border-foreground/20 px-3 py-1">Finalizado</span>
                    ) : (
                      <span className="font-['Share_Tech_Mono'] text-xs tracking-widest uppercase text-primary border border-primary/50 px-3 py-1">Disponível</span>
                    )}
                  </div>
                  <div>
                    {t.status === "available" ? (
                      <a href="#" className="font-['Anton'] text-xs tracking-widest uppercase bg-primary text-primary-foreground px-5 py-2.5 hover:bg-primary/80 transition-colors whitespace-nowrap">
                        Ver mais
                      </a>
                    ) : t.status === "finalizado" ? (
                      <span className="font-['Anton'] text-xs tracking-widest uppercase border border-foreground/20 text-foreground/30 px-5 py-2.5 cursor-not-allowed">
                        Finalizado
                      </span>
                    ) : (
                      <span className="font-['Anton'] text-xs tracking-widest uppercase border border-foreground/20 text-foreground/30 px-5 py-2.5 cursor-not-allowed">
                        À definir
                      </span>
                    )}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── GALERIA ── */}
      <section id="galeria" className="py-32 bg-card border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal variant="fadeUp" delay={0.06} className="mb-16">
            <span className="font-['Share_Tech_Mono'] text-xs text-primary tracking-[0.4em] uppercase mb-4 block">// ao vivo + bastidores</span>
            <h2 className="font-['Anton'] text-[clamp(3rem,7vw,5rem)] leading-none uppercase text-foreground">
              Galeria
            </h2>
          </Reveal>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 auto-rows-[180px] md:auto-rows-[220px]">
            {gallery.map((img, i) => (
              <Reveal key={i} variant="scaleIn" delay={0.08 + i * 0.05} className={`overflow-hidden ${img.span}`}>
                <div className="relative h-full overflow-hidden group bg-muted">
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-background/40 group-hover:bg-transparent transition-colors duration-300" />
                  <div className="absolute inset-0 border border-transparent group-hover:border-primary/60 transition-colors duration-300 pointer-events-none" />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── BANDA ── */}
      <section id="banda" className="py-32 bg-background border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal variant="fadeUp" delay={0.06} className="mb-16">
            <span className="font-['Share_Tech_Mono'] text-xs text-primary tracking-[0.4em] uppercase mb-4 block">// os ingredientes</span>
            <h2 className="font-['Anton'] text-[clamp(3rem,7vw,5rem)] leading-none uppercase text-foreground">
              da <span className="text-primary">Conserva</span>
            </h2>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {members.map((m, i) => (
              <Reveal key={m.name} variant="fadeUp" delay={0.08 + i * 0.08}>
                <div className="group relative border border-border hover:border-primary transition-colors duration-300 h-full bg-card/50">
                  <div className="relative">
                    <Carousel
                      opts={{ loop: true, align: "start" }}
                      className="relative overflow-hidden"
                    >
                      <CarouselContent>
                        {m.photos.map((photo, photoIndex) => (
                          <CarouselItem key={`${m.name}-${photoIndex}`} className="basis-full">
                            <div className="relative overflow-hidden aspect-[3/4] bg-muted">
                              <img
                                src={photo}
                                alt={`${m.name} ${photoIndex + 1}`}
                                className="w-full h-full object-cover object-top grayscale group-hover:grayscale-0 transition-all duration-500"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>

                      <CarouselPrevious className="left-3 top-1/2 -translate-y-1/2 border border-border bg-background/80 text-foreground hover:bg-primary hover:text-primary-foreground" />
                      <CarouselNext className="right-3 top-1/2 -translate-y-1/2 border border-border bg-background/80 text-foreground hover:bg-primary hover:text-primary-foreground" />
                    </Carousel>
                  </div>

                  <div className="p-5">
                    <div className="font-['Share_Tech_Mono'] text-xs text-primary tracking-widest uppercase text-foreground/75 mb-1">{m.role}</div>
                    <h3 className="font-['Anton'] text-xl uppercase text-foreground mb-2">{m.name}</h3>
                    <p className="font-['Pathway_Gothic_One'] text-lg text-muted-foreground leading-relaxed">{m.bio}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTATO ── */}
      <section id="contato" className="py-32 bg-card border-t border-border relative overflow-hidden">
        {/* bg decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-secondary/5 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid gap-20">
            {/* Newsletter */}
            {/* <Reveal variant="fadeLeft" delay={0.08}>
              <div>
                <span className="font-['Share_Tech_Mono'] text-xs text-primary tracking-[0.4em] uppercase mb-4 block">// fique por dentro</span>
                <h2 className="font-['Anton'] text-[clamp(2.5rem,6vw,4rem)] leading-none uppercase text-foreground mb-6">
                  Dê um<br /><span className="text-primary">Alô</span>
                </h2>
              </div>
            </Reveal> */}

            {/* Contact info */}
            <Reveal variant="fadeRight" delay={0.12}>
              <div className="w-full flex flex-col items-center justify-center">
                <span className="font-['Share_Tech_Mono'] text-xs text-primary tracking-[0.4em] uppercase mb-4 block">// contato</span>
                <h2 className="font-['Anton'] text-[clamp(2.5rem,6vw,4rem)] leading-none uppercase text-foreground mb-6 text-center">
                  Fala<br /><span className="text-primary">gurizada</span>
                </h2>
                <div className="space-y-5 mb-10">
                {/* <a href="mailto:contato@azeitonasverdes.com" className="flex items-center gap-4 group">
                  <div className="w-10 h-10 border border-border group-hover:border-primary flex items-center justify-center transition-colors">
                    <Mail size={16} className="text-primary" />
                  </div>
                  <div>
                    <div className="font-['Share_Tech_Mono'] text-xs text-muted-foreground tracking-widest uppercase">Contato do porão</div>
                    <div className="font-['Pathway_Gothic_One'] text-foreground group-hover:text-primary transition-colors">contato@azeitonasverdes.com</div>
                  </div>
                </a> */}
                {/* <a href="mailto:booking@azeitonasverdes.com" className="flex items-center gap-4 group">
                  <div className="w-10 h-10 border border-border group-hover:border-primary flex items-center justify-center transition-colors">
                    <Music2 size={16} className="text-secondary" />
                  </div>
                  <div>
                    <div className="font-['Share_Tech_Mono'] text-xs text-muted-foreground tracking-widest uppercase">Contato do porão</div>
                    <div className="font-['Pathway_Gothic_One'] text-foreground group-hover:text-primary transition-colors">press@azeitonasverdes.com</div>
                  </div>
                </a> */}
              </div>
                <div className="flex gap-4">
                  {[
                    { icon: Instagram, label: "Instagram", url: "https://www.instagram.com/azeitonasverdes/" },
                    // { icon: Youtube, label: "YouTube", url: "https://www.youtube.com/azeitonasverdes" },
                    // { icon: Music2, label: "Spotify" },
                  ].map(({ icon: Icon, label, url }, index) => (
                    <Reveal key={label} variant="fadeUp" delay={0.14 + index * 0.08}>
                      <a href={url} aria-label={label}
                        className="w-12 h-12 border border-border hover:border-primary hover:text-primary text-foreground/50 flex items-center justify-center transition-colors group">
                        <Icon size={18} />
                      </a>
                    </Reveal>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-background border-t border-border py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-['Share_Tech_Mono'] text-xs text-muted-foreground tracking-widest text-center">
            © 2026 Azeitonas Verdes · Todos os direitos reservados
          </div>
          <div className="font-['Pathway_Gothic_One '] text-xs text-muted-foreground/50 tracking-wide">
            ROCK DO INTERIOR · PUNK · PSICODELIA
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-6">
          <div className="wbz-container">
            <div className="container">
              <div className="inner-container">
                <a className="wbz-link" href="https://webcraftz.com.br/" target="_blank" rel="noopener noreferrer">
                  <WbzCopyright className="mr-2" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
        </div>
      </div>
      
    </>
  );
}
