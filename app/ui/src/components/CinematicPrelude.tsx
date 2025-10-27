import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import clsx from "clsx";
import {
  useExperienceStore,
  useInterfaceReady,
  useStage,
  ExperienceStage,
} from "../hooks/useExperienceStore";
import worldImageUrl from "../assets/storyboard/world.png";
import pedestalImageUrl from "../assets/storyboard/pedestal.png";

gsap.registerPlugin(useGSAP);

const stageCopy: Record<
  ExperienceStage,
  { title: string; whisper: string; caption?: string }
> = {
  intro: {
    title: "The Whisper Before Thought",
    whisper: "RAGnarok",
    caption: "The rune sigil stirs within the void.",
  },
  approach: {
    title: "The Path of Discovery",
    whisper: "Wind and ward beckon you forward.",
  },
  encounter: {
    title: "The Book of the Builder",
    whisper: "Roots cradle the tome of Symphonic Prompting.",
  },
  awakening: {
    title: "The Interface Revealed",
    whisper: "Light blooms between the gilded pages.",
  },
  interface: {
    title: "Symphonic Prompting",
    whisper: "The manuscript awaits your command.",
    caption: "The Chorus is ready to answer.",
  },
};

const preloadImage = (src: string) =>
  new Promise<void>((resolve) => {
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = src;
  });

export const CinematicPrelude: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const pedestalRef = useRef<HTMLDivElement>(null);
  const storyPanelRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const approachRef = useRef<HTMLDivElement>(null);
  const encounterRef = useRef<HTMLDivElement>(null);
  const awakeningRef = useRef<HTMLDivElement>(null);
  const flareRef = useRef<HTMLDivElement>(null);
  const skipButtonRef = useRef<HTMLButtonElement>(null);

  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const finalizeRef = useRef<() => void>(() => undefined);
  const finishedRef = useRef(false);

  const interfaceReady = useInterfaceReady();
  const stage = useStage();

  const setStage = useExperienceStore((state) => state.setStage);
  const markInterfaceReady = useExperienceStore((state) => state.markInterfaceReady);

  const [mediaReady, setMediaReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([worldImageUrl, pedestalImageUrl].map(preloadImage)).then(() => {
      if (!cancelled) {
        setMediaReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const { contextSafe } = useGSAP(
    (context) => {
      if (interfaceReady || !mediaReady || !containerRef.current) {
        return;
      }

      finishedRef.current = false;

      const timeline = gsap.timeline({
        defaults: { ease: "cubic-bezier(0.65, 0, 0.35, 1)" },
      });
      timelineRef.current = timeline;
      timeline.eventCallback("onComplete", () => {
        completeSequence();
      });

      const fadeTargets = [
        worldRef.current,
        pedestalRef.current,
        storyPanelRef.current,
        skipButtonRef.current,
        titleRef.current,
        approachRef.current,
        encounterRef.current,
        awakeningRef.current,
        flareRef.current,
      ];

      const completeSequence = () => {
        if (finishedRef.current) {
          return;
        }
        finishedRef.current = true;
        setStage("interface");
        markInterfaceReady();

        const targets = fadeTargets.filter(Boolean) as Element[];
        targets.forEach((node) => {
          gsap.killTweensOf(node);
          gsap.set(node, { autoAlpha: 0 });
        });

        const container = containerRef.current;
        if (container) {
          gsap.killTweensOf(container);
          gsap.set(container, {
            autoAlpha: 0,
            pointerEvents: "none",
            display: "none",
            visibility: "hidden",
          });
        }
      };

      finalizeRef.current = completeSequence;

      if (containerRef.current) {
        gsap.set(containerRef.current, {
          autoAlpha: 0,
          visibility: "hidden",
          display: "flex",
          pointerEvents: "auto",
        });
      }
      if (worldRef.current) {
        gsap.set(worldRef.current, { autoAlpha: 0, zIndex: 2 });
      }
      if (pedestalRef.current) {
        gsap.set(pedestalRef.current, { autoAlpha: 0, zIndex: 2 });
      }
      if (storyPanelRef.current) {
        gsap.set(storyPanelRef.current, { autoAlpha: 0, yPercent: 8, zIndex: 3 });
      }
      [
        skipButtonRef.current,
        titleRef.current,
        approachRef.current,
        encounterRef.current,
        awakeningRef.current,
        flareRef.current,
      ].forEach((node) => {
        if (node) {
          gsap.set(node, { autoAlpha: 0 });
        }
      });

      timeline
        .set(containerRef.current, { autoAlpha: 1, visibility: "visible" })
        .fromTo(
          titleRef.current,
          { autoAlpha: 0, yPercent: 12, filter: "blur(12px)" },
          { autoAlpha: 1, yPercent: 0, filter: "blur(0px)", duration: 1.6 }
        )
        .to(titleRef.current, { autoAlpha: 0, duration: 1.1 }, "+=1.2")
        .add(() => setStage("approach"))
        .to(skipButtonRef.current, { autoAlpha: 1, duration: 0.4 }, "<")
        .addLabel("worldReveal")
        .to(
          worldRef.current,
          { autoAlpha: 1, scale: 1, duration: 3.0, ease: "power2.out" },
          "worldReveal+=0.1"
        )
        .to(
          storyPanelRef.current,
          { autoAlpha: 0.9, yPercent: 0, duration: 1.4, ease: "power2.out" },
          "-=1.8"
        )
        .fromTo(
          approachRef.current,
          { autoAlpha: 0, filter: "blur(10px)" },
          { autoAlpha: 1, filter: "blur(0px)", duration: 2.8 }
        )
        .to(approachRef.current, { autoAlpha: 0, duration: 1.0 }, "+=0.4")
        .to(
          worldRef.current,
          { autoAlpha: 0, duration: 0.8, ease: "power1.inOut" },
          "-=0.4"
        )
        .add(() => setStage("encounter"))
        .to(
          storyPanelRef.current,
          { autoAlpha: 0.82, duration: 0.9, ease: "power2.out" },
          "-=0.4"
        )
        .to(
          pedestalRef.current,
          { autoAlpha: 1, scale: 1, duration: 1.8, ease: "power2.out" },
          "-=0.6"
        )
        .fromTo(
          encounterRef.current,
          { autoAlpha: 0, filter: "blur(10px)" },
          { autoAlpha: 1, filter: "blur(0px)", duration: 2.0 }
        )
        .to(encounterRef.current, { autoAlpha: 0.7, duration: 1.0 }, "+=0.6")
        .add(() => setStage("awakening"))
        .fromTo(
          awakeningRef.current,
          { autoAlpha: 0, filter: "blur(14px)", yPercent: 16 },
          { autoAlpha: 1, filter: "blur(0px)", yPercent: 0, duration: 1.6 }
        )
        .fromTo(
          flareRef.current,
          { autoAlpha: 0, scale: 0.6 },
          { autoAlpha: 1, scale: 1.2, duration: 1.2, ease: "power2.out" },
          "-=0.8"
        )
        .to([worldRef.current, pedestalRef.current], {
          autoAlpha: 0,
          duration: 1.0,
          ease: "power1.inOut",
        })
        .to(
          storyPanelRef.current,
          { autoAlpha: 0, duration: 0.7, ease: "power2.in" },
          "-=0.6"
        );

      context.add(() => timeline);

      return () => {
        timeline.kill();
      };
    },
    {
      scope: containerRef,
      dependencies: [interfaceReady, mediaReady],
      revertOnUpdate: true,
    }
  );

  const handleSkip = useMemo(
    () =>
      contextSafe?.(() => {
        timelineRef.current?.kill();
        finalizeRef.current?.();
      }) ??
      (() => {
        timelineRef.current?.kill();
        finalizeRef.current?.();
      }),
    [contextSafe]
  );

  const copy = stageCopy[stage];

  if (interfaceReady && finishedRef.current) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={clsx(
        "pointer-events-auto",
        "fixed inset-0 z-40 flex items-center justify-center overflow-hidden bg-[rgba(6,4,2,0.85)] text-parchment",
        interfaceReady && "pointer-events-none"
      )}
      style={{
        opacity: interfaceReady ? 0 : 1,
        visibility: interfaceReady ? "hidden" : "visible",
      }}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div
          ref={worldRef}
          className="absolute inset-0 flex items-center justify-center opacity-0 will-change-transform"
        >
          <div className="relative w-full max-w-[min(1080px,90vw)] aspect-[3/2]">
            <img
              src={worldImageUrl}
              alt="The ward of Yggdrasil awakening under golden light."
              className="absolute inset-0 h-full w-full select-none object-contain"
              draggable={false}
            />
            <div className="absolute inset-0 rounded-[48px] bg-[radial-gradient(circle_at_center,_rgba(248,222,126,0.35),_transparent_70%)] mix-blend-screen opacity-80" />
            <div className="absolute inset-0 rounded-[48px] bg-[#050302]/35 mix-blend-multiply" />
          </div>
        </div>

        <div
          ref={pedestalRef}
          className="absolute inset-0 flex items-center justify-center opacity-0 will-change-transform"
        >
          <div className="relative w-full max-w-[min(620px,75vw)] aspect-[2/3]">
            <img
              src={pedestalImageUrl}
              alt="The Symphonic Prompting tome resting on a rooted pedestal, guarded by an angel."
              className="absolute inset-0 h-full w-full select-none object-contain"
              draggable={false}
            />
            <div className="absolute inset-0 rounded-[40px] bg-gradient-to-br from-[#050302]/55 via-transparent to-[#120c08]/60 mix-blend-multiply" />
            <div className="absolute inset-0 rounded-[40px] bg-[radial-gradient(circle_at_center,_rgba(248,222,126,0.45),_transparent_65%)] mix-blend-screen opacity-90" />
          </div>
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-[#050302]/75 via-transparent to-[#120c08]/70" />

      <div className="relative z-10 flex w-full max-w-5xl flex-col items-center gap-10 px-6 text-center">
        <div
          ref={titleRef}
          className="space-y-3 font-display text-4xl tracking-[0.35em] uppercase text-accentGold sm:text-5xl"
        >
          <p>{stageCopy.intro.whisper}</p>
        </div>

        <div
          ref={storyPanelRef}
          className="relative w-full max-w-[min(36rem,90vw)] rounded-[36px] border border-accentGold/35 bg-[rgba(12,8,6,0.58)] px-6 py-8 shadow-codex backdrop-blur opacity-0"
        >
          <div
            ref={approachRef}
            className="mx-auto max-w-xl text-lg leading-relaxed text-accentGold/84"
          >
            <p>
              A hush falls as the ward of grass breathes with you. Soft embers trace
              forgotten constellations along the path ahead.
            </p>
          </div>

          <div
            ref={encounterRef}
            className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-accentGold/86"
          >
            <p>
              The pedestal emerges, roots entwined around a tome sealed with radiant
              sigils. A pagan angel watches, wings carved in twilight.
            </p>
          </div>

          <div
            ref={awakeningRef}
            className="mx-auto mt-6 max-w-xl space-y-4 font-serif text-lg leading-relaxed text-glow/90"
          >
            <p>The book trembles; light spills from between its vellum leaves.</p>
            <p>
              Pages flutter without touch. A bloom of iridescent dawn consumes the dark
              and invites your hand to the interface within.
            </p>
          </div>

          <div
            ref={flareRef}
            className="pointer-events-none absolute inset-0 -z-10 rounded-[36px] bg-[radial-gradient(circle_at_center,_rgba(248,222,126,0.35),_transparent_65%)] blur-3xl"
          />

          <div className="mt-8 flex flex-col items-center gap-2 text-sm text-accentGold/75">
            <p className="font-display text-lg uppercase tracking-[0.55em] text-accentGold">
              {copy.title}
            </p>
            <p>{copy.whisper}</p>
            {copy.caption ? (
              <p className="text-accentGold/60">{copy.caption}</p>
            ) : null}
          </div>

          <button
            ref={skipButtonRef}
            type="button"
            className="mt-8 rounded-full border border-accentGold/35 bg-transparent px-6 py-2 text-sm uppercase tracking-[0.3em] text-accentGold/85 opacity-0 transition hover:border-accentGold hover:text-accentGold focus:outline-none focus-visible:ring-2 focus-visible:ring-accentGold/60"
            onClick={handleSkip}
          >
            Skip Invocation
          </button>
        </div>
      </div>
    </div>
  );
};

export default CinematicPrelude;
