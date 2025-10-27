import { useMemo, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import clsx from "clsx";
import {
  useExperienceStore,
  useInterfaceReady,
  useStage,
  ExperienceStage,
} from "../hooks/useExperienceStore";

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

export const CinematicPrelude: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const approachRef = useRef<HTMLDivElement>(null);
  const encounterRef = useRef<HTMLDivElement>(null);
  const awakeningRef = useRef<HTMLDivElement>(null);
  const flareRef = useRef<HTMLDivElement>(null);
  const skipButtonRef = useRef<HTMLButtonElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  const interfaceReady = useInterfaceReady();
  const stage = useStage();

  const setStage = useExperienceStore((state) => state.setStage);
  const markInterfaceReady = useExperienceStore((state) => state.markInterfaceReady);
  const skipCinematic = useExperienceStore((state) => state.skipCinematic);

  const { contextSafe } = useGSAP(
    (context) => {
      if (interfaceReady || !containerRef.current) {
        return;
      }

      const timeline = gsap.timeline({
        defaults: {
          ease: "cubic-bezier(0.65, 0, 0.35, 1)",
        },
      });

      timelineRef.current = timeline;

      timeline
        .set(containerRef.current, { autoAlpha: 1 })
        .set(
          [
            approachRef.current,
            encounterRef.current,
            awakeningRef.current,
            flareRef.current,
          ],
          { autoAlpha: 0 }
        )
        .set(skipButtonRef.current, { autoAlpha: 0 })
        .fromTo(
          titleRef.current,
          { autoAlpha: 0, yPercent: 12, filter: "blur(12px)" },
          { autoAlpha: 1, yPercent: 0, filter: "blur(0px)", duration: 1.6 }
        )
        .to(titleRef.current, { autoAlpha: 0, duration: 1.1 }, "+=1.2")
        .add(() => setStage("approach"))
        .to(skipButtonRef.current, { autoAlpha: 1, duration: 0.4 }, "<")
        .fromTo(
          approachRef.current,
          { autoAlpha: 0, scale: 1.08, filter: "blur(8px)" },
          { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: 4.2 }
        )
        .to(approachRef.current, { autoAlpha: 0, duration: 1.0 }, "+=0.3")
        .add(() => setStage("encounter"))
        .fromTo(
          encounterRef.current,
          { autoAlpha: 0, yPercent: 8, filter: "blur(10px)" },
          { autoAlpha: 1, yPercent: 0, filter: "blur(0px)", duration: 2.0 }
        )
        .to(encounterRef.current, { autoAlpha: 0.65, duration: 1.1 }, "+=0.9")
        .add(() => setStage("awakening"))
        .fromTo(
          awakeningRef.current,
          { autoAlpha: 0, yPercent: 18, filter: "blur(14px)" },
          { autoAlpha: 1, yPercent: 0, filter: "blur(0px)", duration: 1.6 }
        )
        .fromTo(
          flareRef.current,
          { autoAlpha: 0, scale: 0.75 },
          { autoAlpha: 1, scale: 1.3, duration: 1.2, ease: "power2.out" },
          "-=0.8"
        )
        .to(
          [awakeningRef.current, flareRef.current, encounterRef.current],
          { autoAlpha: 0, duration: 0.9 }
        )
        .add(() => setStage("interface"))
        .to(
          containerRef.current,
          {
            autoAlpha: 0,
            duration: 1.0,
            ease: "power1.inOut",
            onComplete: () => {
              markInterfaceReady();
            },
          },
          "+=0.4"
        );

      return () => {
        timeline.kill();
        timelineRef.current = null;
      };
    },
    {
      scope: containerRef,
      dependencies: [interfaceReady],
      revertOnUpdate: true,
    }
  );

  const handleSkip = useMemo(
    () =>
      contextSafe?.(() => {
        const container = containerRef.current;
        timelineRef.current?.kill();
        if (!container) {
          skipCinematic();
          markInterfaceReady();
          return;
        }
        gsap.to(container, {
          autoAlpha: 0,
          duration: 0.5,
          ease: "power1.inOut",
          onComplete: () => {
            skipCinematic();
            markInterfaceReady();
          },
        });
      }) ??
      (() => {
        skipCinematic();
        markInterfaceReady();
      }),
    [contextSafe, skipCinematic, markInterfaceReady]
  );

  const copy = stageCopy[stage];

  return (
    <div
      ref={containerRef}
      className={clsx(
        "pointer-events-auto",
        "fixed inset-0 z-40 flex items-center justify-center overflow-hidden bg-[rgba(6,4,2,0.92)] text-parchment",
        interfaceReady && "pointer-events-none"
      )}
      style={{ opacity: interfaceReady ? 0 : 1 }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#050302] via-transparent to-[#120c08] opacity-75" />

      <div className="relative z-10 flex w-full max-w-5xl flex-col items-center gap-10 px-6 text-center">
        <div
          ref={titleRef}
          className="space-y-3 font-display text-4xl tracking-[0.35em] uppercase text-accentGold sm:text-5xl"
        >
          <p>{stageCopy.intro.whisper}</p>
        </div>

        <div
          ref={approachRef}
          className="max-w-2xl text-lg leading-relaxed text-accentGold/80"
        >
          <p>
            A hush falls as the ward of grass breathes with you. Soft embers trace
            forgotten constellations along the path ahead.
          </p>
        </div>

        <div
          ref={encounterRef}
          className="max-w-2xl text-base leading-relaxed text-accentGold/85"
        >
          <p>
            The pedestal emerges, roots entwined around a tome sealed with radiant
            sigils. A pagan angel watches, wings carved in twilight.
          </p>
        </div>

        <div
          ref={awakeningRef}
          className="space-y-6 font-serif text-lg leading-relaxed text-glow/90"
        >
          <p>The book trembles; light spills from between its vellum leaves.</p>
          <p>
            Pages flutter without touch. A bloom of iridescent dawn consumes the dark
            and invites your hand to the interface within.
          </p>
        </div>

        <div
          ref={flareRef}
          className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,_rgba(248,222,126,0.35),_transparent_65%)] blur-3xl"
        />

        <button
          ref={skipButtonRef}
          type="button"
          className="rounded-full border border-accentGold/30 bg-transparent px-5 py-2 text-sm uppercase tracking-[0.3em] text-accentGold/85 transition hover:border-accentGold hover:text-accentGold focus:outline-none focus-visible:ring-2 focus-visible:ring-accentGold/60"
          onClick={handleSkip}
        >
          Skip Invocation
        </button>

        <div className="mt-8 flex flex-col items-center gap-2 text-sm text-accentGold/70">
          <p className="font-display text-lg uppercase tracking-[0.6em] text-accentGold">
            {copy.title}
          </p>
          <p>{copy.whisper}</p>
          {copy.caption ? <p className="text-accentGold/60">{copy.caption}</p> : null}
        </div>
      </div>
    </div>
  );
};

export default CinematicPrelude;
